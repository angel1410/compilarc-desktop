package ac

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

// Ciudadano representa un registro del Archivo Cedular local depurado
type Ciudadano struct {
	Nacionalidad    string `json:"nacionalidad"`
	Cedula          int    `json:"cedula"`
	PrimerNombre    string `json:"primer_nombre"`
	SegundoNombre   string `json:"segundo_nombre"`
	PrimerApellido  string `json:"primer_apellido"`
	SegundoApellido string `json:"segundo_apellido"`
	FechaNacimiento string `json:"fecha_nacimiento"`
	Sexo            string `json:"sexo"`
}

type ACDatabase struct {
	db *sql.DB
}

// NewACDatabase inicializa el motor SQLite local del Archivo Cedular
func NewACDatabase(dbPath string) (*ACDatabase, error) {
	connStr := fmt.Sprintf("%s?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_pragma=synchronous(NORMAL)", dbPath)
	db, err := sql.Open("sqlite", connStr)
	if err != nil {
		return nil, fmt.Errorf("error al abrir base de datos SQLite AC: %w", err)
	}

	// Limitar conexiones concurrentes para SQLite
	db.SetMaxOpenConns(5)
	db.SetMaxIdleConns(2)
	db.SetConnMaxLifetime(1 * time.Hour)

	acDB := &ACDatabase{db: db}
	if err := acDB.initSchema(); err != nil {
		return nil, fmt.Errorf("error al inicializar esquema AC: %w", err)
	}

	return acDB, nil
}

func (a *ACDatabase) initSchema() error {
	query := `
	CREATE TABLE IF NOT EXISTS ac_local (
		nacionalidad TEXT NOT NULL,
		cedula INTEGER NOT NULL,
		primer_nombre TEXT NOT NULL,
		segundo_nombre TEXT DEFAULT '',
		primer_apellido TEXT NOT NULL,
		segundo_apellido TEXT DEFAULT '',
		fecha_nacimiento TEXT DEFAULT '',
		sexo TEXT DEFAULT '',
		PRIMARY KEY (nacionalidad, cedula)
	);

	CREATE INDEX IF NOT EXISTS idx_ac_cedula ON ac_local (cedula);

	CREATE TABLE IF NOT EXISTS ac_metadata (
		clave TEXT PRIMARY KEY,
		valor TEXT NOT NULL,
		actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err := a.db.Exec(query)
	if err != nil {
		return err
	}

	// Inicializar versión base si no existe
	_, _ = a.db.Exec(`INSERT OR IGNORE INTO ac_metadata (clave, valor) VALUES ('version_corte', '145')`)
	_, _ = a.db.Exec(`INSERT OR IGNORE INTO ac_metadata (clave, valor) VALUES ('fecha_corte', '2026-09-01T00:00:00Z')`)

	return nil
}

// Consultar busca un ciudadano por nacionalidad y cédula con respuesta <3ms
func (a *ACDatabase) Consultar(nacionalidad string, cedula int) (*Ciudadano, error) {
	nac := strings.ToUpper(strings.TrimSpace(nacionalidad))
	if nac == "" {
		nac = "V"
	}

	query := `
	SELECT nacionalidad, cedula, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, fecha_nacimiento, sexo
	FROM ac_local
	WHERE nacionalidad = ? AND cedula = ?
	LIMIT 1;
	`

	var c Ciudadano
	err := a.db.QueryRow(query, nac, cedula).Scan(
		&c.Nacionalidad,
		&c.Cedula,
		&c.PrimerNombre,
		&c.SegundoNombre,
		&c.PrimerApellido,
		&c.SegundoApellido,
		&c.FechaNacimiento,
		&c.Sexo,
	)

	if err == sql.ErrNoRows {
		return nil, nil // No encontrado de forma limpia (para manejo de nuevo cedulado)
	}
	if err != nil {
		return nil, fmt.Errorf("error al consultar AC: %w", err)
	}

	return &c, nil
}

// AplicarDelta inserta o actualiza un lote de registros incrementales en una transacción atómica
func (a *ACDatabase) AplicarDelta(registros []Ciudadano, nuevaVersion int, fechaCorte string) (int, error) {
	tx, err := a.db.Begin()
	if err != nil {
		return 0, fmt.Errorf("error al iniciar transacción de delta: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		INSERT INTO ac_local (nacionalidad, cedula, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, fecha_nacimiento, sexo)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(nacionalidad, cedula) DO UPDATE SET
			primer_nombre=excluded.primer_nombre,
			segundo_nombre=excluded.segundo_nombre,
			primer_apellido=excluded.primer_apellido,
			segundo_apellido=excluded.segundo_apellido,
			fecha_nacimiento=excluded.fecha_nacimiento,
			sexo=excluded.sexo;
	`)
	if err != nil {
		return 0, fmt.Errorf("error al preparar sentencia de inserción: %w", err)
	}
	defer stmt.Close()

	contador := 0
	for _, c := range registros {
		nac := strings.ToUpper(strings.TrimSpace(c.Nacionalidad))
		if nac == "" {
			nac = "V"
		}
		_, err := stmt.Exec(
			nac,
			c.Cedula,
			strings.ToUpper(c.PrimerNombre),
			strings.ToUpper(c.SegundoNombre),
			strings.ToUpper(c.PrimerApellido),
			strings.ToUpper(c.SegundoApellido),
			c.FechaNacimiento,
			strings.ToUpper(c.Sexo),
		)
		if err != nil {
			return 0, fmt.Errorf("error al aplicar registro %s-%d: %w", nac, c.Cedula, err)
		}
		contador++
	}

	// Actualizar metadata de versión
	_, err = tx.Exec(`INSERT OR REPLACE INTO ac_metadata (clave, valor, actualizado_en) VALUES ('version_corte', ?, CURRENT_TIMESTAMP)`, fmt.Sprintf("%d", nuevaVersion))
	if err != nil {
		return 0, fmt.Errorf("error al actualizar metadata de version: %w", err)
	}

	if fechaCorte != "" {
		_, _ = tx.Exec(`INSERT OR REPLACE INTO ac_metadata (clave, valor, actualizado_en) VALUES ('fecha_corte', ?, CURRENT_TIMESTAMP)`, fechaCorte)
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("error al confirmar transacción de delta: %w", err)
	}

	return contador, nil
}

// ObtenerEstadisticas retorna el total de registros en el AC local y la versión de corte actual
func (a *ACDatabase) ObtenerEstadisticas() (int64, string, string, error) {
	var total int64
	err := a.db.QueryRow(`SELECT COUNT(*) FROM ac_local`).Scan(&total)
	if err != nil {
		return 0, "", "", err
	}

	var version string
	_ = a.db.QueryRow(`SELECT valor FROM ac_metadata WHERE clave = 'version_corte'`).Scan(&version)
	if version == "" {
		version = "145"
	}

	var fecha string
	_ = a.db.QueryRow(`SELECT valor FROM ac_metadata WHERE clave = 'fecha_corte'`).Scan(&fecha)

	return total, version, fecha, nil
}

// SembrarDatosDemo inicializa algunos registros de prueba si la base está vacía
func (a *ACDatabase) SembrarDatosDemo() error {
	var count int
	_ = a.db.QueryRow(`SELECT COUNT(*) FROM ac_local`).Scan(&count)
	if count > 0 {
		return nil
	}

	demos := []Ciudadano{
		{Nacionalidad: "V", Cedula: 24749645, PrimerNombre: "PAOLA", SegundoNombre: "NATHALY", PrimerApellido: "IRAZABAL", SegundoApellido: "RIERA", FechaNacimiento: "1996-03-14", Sexo: "F"},
		{Nacionalidad: "V", Cedula: 12345678, PrimerNombre: "CARLOS", SegundoNombre: "ALBERTO", PrimerApellido: "PEREZ", SegundoApellido: "RODRIGUEZ", FechaNacimiento: "1985-05-14", Sexo: "M"},
		{Nacionalidad: "V", Cedula: 87654321, PrimerNombre: "MARIA", SegundoNombre: "ELENA", PrimerApellido: "GONZALEZ", SegundoApellido: "LOPEZ", FechaNacimiento: "1990-11-23", Sexo: "F"},
		{Nacionalidad: "V", Cedula: 24123456, PrimerNombre: "JOSE", SegundoNombre: "MANUEL", PrimerApellido: "RODRIGUEZ", SegundoApellido: "SANCHEZ", FechaNacimiento: "1998-03-30", Sexo: "M"},
		{Nacionalidad: "V", Cedula: 19876543, PrimerNombre: "ANA", SegundoNombre: "LUCIA", PrimerApellido: "MARTINEZ", SegundoApellido: "RAMIREZ", FechaNacimiento: "1993-08-19", Sexo: "F"},
		{Nacionalidad: "V", Cedula: 30123456, PrimerNombre: "ALEJANDRO", SegundoNombre: "JOSE", PrimerApellido: "GOMEZ", SegundoApellido: "PEREZ", FechaNacimiento: "2008-04-12", Sexo: "M"},
	}

	_, err := a.AplicarDelta(demos, 146, "2026-10-01T00:00:00Z")
	return err
}

func (a *ACDatabase) Close() error {
	return a.db.Close()
}
