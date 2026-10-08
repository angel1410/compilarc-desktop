package storage

import (
	"database/sql"
	"os"
	"path/filepath"
	"testing"

	"compilarc-desktop/internal/crypto"
)

func TestStorageEncryptionAndRetrieval(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "compilarc_storage_test_*")
	if err != nil {
		t.Fatalf("Error creando tmpDir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	dbPath := filepath.Join(tmpDir, "test_solicitudes.db")
	storage, err := NewPacketStorage(dbPath)
	if err != nil {
		t.Fatalf("Error al inicializar PacketStorage: %v", err)
	}
	defer storage.Close()

	sol := &SolicitudCertificacion{
		TipoActa: "NACIMIENTO",
		Operador: "REGISTRADOR_01",
		DatosSolicitante: map[string]interface{}{
			"cedula": "V-19876543",
			"nombre": "CARLOS PEREZ",
		},
		DatosActa: map[string]interface{}{
			"numero_acta": "ACTA-2026-001",
		},
		DatosBiometricos: map[string]interface{}{
			"huella": "WSQ_BASE64_TEMPLATE",
		},
	}

	err = storage.GuardarSolicitud(sol)
	if err != nil {
		t.Fatalf("Error guardando solicitud: %v", err)
	}

	// 1. Verificar directamente en SQLite crudo que esté cifrado con el prefijo "ENC:"
	rawDB, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("Error abriendo DB crudo: %v", err)
	}
	defer rawDB.Close()

	var rawSol, rawActa, rawBio string
	err = rawDB.QueryRow("SELECT datos_solicitante, datos_acta, datos_biometricos FROM solicitudes_offline LIMIT 1").Scan(&rawSol, &rawActa, &rawBio)
	if err != nil {
		t.Fatalf("Error consultando DB crudo: %v", err)
	}

	if rawSol[:4] != crypto.MagicPrefix || rawActa[:4] != crypto.MagicPrefix || rawBio[:4] != crypto.MagicPrefix {
		t.Fatalf("Los datos en disco DEBEN estar cifrados con prefijo %s. Obtenido: %s", crypto.MagicPrefix, rawSol)
	}

	// 2. Verificar que ListarPendientes lo desencripte adecuadamente
	pendientes, err := storage.ListarPendientes()
	if err != nil {
		t.Fatalf("Error listando pendientes: %v", err)
	}
	if len(pendientes) != 1 {
		t.Fatalf("Esperaba 1 pendiente, obtuvo %d", len(pendientes))
	}

	item := pendientes[0]
	if item.DatosSolicitante["cedula"] != "V-19876543" {
		t.Fatalf("Datos solicitante desencriptados no coinciden")
	}

	// 3. Probar estadísticas
	stats, err := storage.ObtenerEstadisticas()
	if err != nil {
		t.Fatalf("Error obteniendo estadísticas: %v", err)
	}
	if stats["pendientes"] != 1 || stats["total"] != 1 {
		t.Fatalf("Estadísticas incorrectas: %+v", stats)
	}

	// 4. Marcar transmitida
	err = storage.MarcarTransmitidas([]string{item.ID})
	if err != nil {
		t.Fatalf("Error marcando transmitida: %v", err)
	}

	pendientesAfter, _ := storage.ListarPendientes()
	if len(pendientesAfter) != 0 {
		t.Fatalf("No debería haber pendientes después de sincronizar")
	}
}

func TestCompatibilidadHaciaAtrasTextoPlano(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "compilarc_legacy_test_*")
	if err != nil {
		t.Fatalf("Error creando tmpDir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	dbPath := filepath.Join(tmpDir, "legacy.db")
	storage, err := NewPacketStorage(dbPath)
	if err != nil {
		t.Fatalf("Error inicializando: %v", err)
	}
	defer storage.Close()

	// Insertar manualmente un registro en texto plano (como se guardaba antes)
	rawDB, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("Error abriendo: %v", err)
	}
	defer rawDB.Close()

	_, err = rawDB.Exec(`
	INSERT INTO solicitudes_offline (
		id, tipo_acta, operador, cedula_verificacion_central,
		datos_solicitante, datos_acta, datos_biometricos, estado, creado_en
	) VALUES (
		'LEGACY-001', 'DEFUNCION', 'OP_ANTIGUO', 0,
		'{"cedula":"V-11111111","nombre":"PEDRO LEGACY"}',
		'{"acta":"000"}',
		'{}', 'PENDIENTE', '2026-10-01 10:00:00'
	);`)
	if err != nil {
		t.Fatalf("Error insertando legacy: %v", err)
	}

	// Debe leerse sin error gracias a la compatibilidad hacia atrás
	pendientes, err := storage.ListarPendientes()
	if err != nil {
		t.Fatalf("Error al leer registro legacy: %v", err)
	}
	if len(pendientes) != 1 {
		t.Fatalf("Esperaba 1 registro legacy")
	}
	if pendientes[0].DatosSolicitante["cedula"] != "V-11111111" {
		t.Fatalf("Error al interpretar JSON legacy")
	}
}
