package storage

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	_ "modernc.org/sqlite"
)

type SolicitudCertificacion struct {
	ID                       string                 `json:"id"`
	TipoActa                 string                 `json:"tipo_acta"`
	Operador                 string                 `json:"operador"`
	CedulaVerificacionCentral bool                   `json:"cedula_verificacion_central"`
	DatosSolicitante         map[string]interface{} `json:"datos_solicitante"`
	DatosActa                map[string]interface{} `json:"datos_acta"`
	DatosBiometricos         map[string]interface{} `json:"datos_biometricos"`
	Estado                   string                 `json:"estado"` // PENDIENTE, SINCRONIZADO
	CreadoEn                 string                 `json:"creado_en"`
}

type PacketStorage struct {
	db *sql.DB
}

func NewPacketStorage(dbPath string) (*PacketStorage, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("error al abrir base de datos de paquetes offline: %w", err)
	}

	p := &PacketStorage{db: db}
	if err := p.initSchema(); err != nil {
		return nil, err
	}

	return p, nil
}

func (p *PacketStorage) initSchema() error {
	query := `
	CREATE TABLE IF NOT EXISTS solicitudes_offline (
		id TEXT PRIMARY KEY,
		tipo_acta TEXT NOT NULL,
		operador TEXT NOT NULL,
		cedula_verificacion_central INTEGER DEFAULT 0,
		datos_solicitante TEXT NOT NULL,
		datos_acta TEXT NOT NULL,
		datos_biometricos TEXT NOT NULL,
		estado TEXT DEFAULT 'PENDIENTE',
		creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes_offline (estado);
	`
	_, err := p.db.Exec(query)
	return err
}

func (p *PacketStorage) GuardarSolicitud(s *SolicitudCertificacion) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	if s.CreadoEn == "" {
		s.CreadoEn = time.Now().UTC().Format(time.RFC3339)
	}
	s.Estado = "PENDIENTE"

	solBytes, err := json.Marshal(s.DatosSolicitante)
	if err != nil {
		return fmt.Errorf("error al serializar datos solicitante: %w", err)
	}
	actaBytes, err := json.Marshal(s.DatosActa)
	if err != nil {
		return fmt.Errorf("error al serializar datos acta: %w", err)
	}
	bioBytes, err := json.Marshal(s.DatosBiometricos)
	if err != nil {
		return fmt.Errorf("error al serializar datos biometricos: %w", err)
	}

	flagInt := 0
	if s.CedulaVerificacionCentral {
		flagInt = 1
	}

	query := `
	INSERT INTO solicitudes_offline (
		id, tipo_acta, operador, cedula_verificacion_central,
		datos_solicitante, datos_acta, datos_biometricos, estado, creado_en
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
	`
	_, err = p.db.Exec(query,
		s.ID, s.TipoActa, s.Operador, flagInt,
		string(solBytes), string(actaBytes), string(bioBytes), s.Estado, s.CreadoEn,
	)
	return err
}

func (p *PacketStorage) ListarPendientes() ([]SolicitudCertificacion, error) {
	query := `
	SELECT id, tipo_acta, operador, cedula_verificacion_central,
	       datos_solicitante, datos_acta, datos_biometricos, estado, creado_en
	FROM solicitudes_offline
	WHERE estado = 'PENDIENTE'
	ORDER BY creado_en DESC;
	`
	rows, err := p.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lista []SolicitudCertificacion
	for rows.Next() {
		var s SolicitudCertificacion
		var flagInt int
		var solStr, actaStr, bioStr string

		err := rows.Scan(
			&s.ID, &s.TipoActa, &s.Operador, &flagInt,
			&solStr, &actaStr, &bioStr, &s.Estado, &s.CreadoEn,
		)
		if err != nil {
			return nil, err
		}

		s.CedulaVerificacionCentral = (flagInt == 1)
		_ = json.Unmarshal([]byte(solStr), &s.DatosSolicitante)
		_ = json.Unmarshal([]byte(actaStr), &s.DatosActa)
		_ = json.Unmarshal([]byte(bioStr), &s.DatosBiometricos)

		lista = append(lista, s)
	}

	return lista, nil
}

func (p *PacketStorage) MarcarTransmitidas(ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	tx, err := p.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`UPDATE solicitudes_offline SET estado = 'SINCRONIZADO' WHERE id = ?`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, id := range ids {
		_, err := stmt.Exec(id)
		if err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (p *PacketStorage) ContarPendientes() (int, error) {
	var count int
	err := p.db.QueryRow(`SELECT COUNT(*) FROM solicitudes_offline WHERE estado = 'PENDIENTE'`).Scan(&count)
	return count, err
}

func (p *PacketStorage) Close() error {
	return p.db.Close()
}
