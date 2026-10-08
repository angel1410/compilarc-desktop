package main

import (
	"os"
	"path/filepath"
	"testing"

	"compilarc-desktop/internal/crypto"
	"compilarc-desktop/internal/storage"
)

func TestRescueWorkflow(t *testing.T) {
	// 1. Simular estructura de un disco USB de Windows: E:\Users\operador\AppData\Roaming\CompilaRC\data\solicitudes_offline.db
	simulatedRoot, err := os.MkdirTemp("", "compilarc_simulated_usb_*")
	if err != nil {
		t.Fatalf("Error creando root simulado: %v", err)
	}
	defer os.RemoveAll(simulatedRoot)

	dataDir := filepath.Join(simulatedRoot, "Users", "operador_taquilla", "AppData", "Roaming", "CompilaRC", "data")
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		t.Fatalf("Error creando dataDir: %v", err)
	}

	dbPath := filepath.Join(dataDir, "solicitudes_offline.db")
	st, err := storage.NewPacketStorage(dbPath)
	if err != nil {
		t.Fatalf("Error inicializando storage: %v", err)
	}

	// Sembrar 3 solicitudes cifradas
	solicitudes := []*storage.SolicitudCertificacion{
		{
			TipoActa: "NACIMIENTO",
			Operador: "MARIA_RODRIGUEZ",
			DatosSolicitante: map[string]interface{}{
				"cedula":  "V-24555888",
				"nombres": "CARMEN ELENA LOPEZ",
			},
			DatosActa: map[string]interface{}{
				"numero_acta": "ACT-NAC-2026-0045",
				"presentado":  "SOFIA VALENTINA LOPEZ",
			},
			DatosBiometricos: map[string]interface{}{
				"huella_wsq": "WSQ_SAMPLE_DATA",
			},
		},
		{
			TipoActa: "DEFUNCION",
			Operador: "MARIA_RODRIGUEZ",
			DatosSolicitante: map[string]interface{}{
				"cedula":  "V-18777999",
				"nombres": "JOSE MANUEL GONZALEZ",
			},
			DatosActa: map[string]interface{}{
				"numero_acta": "ACT-DEF-2026-0012",
			},
			DatosBiometricos: map[string]interface{}{},
		},
		{
			TipoActa: "UNION_ESTABLE",
			Operador: "MARIA_RODRIGUEZ",
			DatosSolicitante: map[string]interface{}{
				"cedula":  "V-20111222",
				"nombres": "ANDRES RAMON MARTINEZ",
			},
			DatosActa: map[string]interface{}{
				"numero_acta": "ACT-UEH-2026-0005",
			},
			DatosBiometricos: map[string]interface{}{
				"huella_wsq": "WSQ_SAMPLE_DATA",
			},
		},
	}

	for _, s := range solicitudes {
		if err := st.GuardarSolicitud(s); err != nil {
			t.Fatalf("Error guardando solicitud: %v", err)
		}
	}
	st.Close()

	// 2. Probar Auto-Discovery
	encontradas := BuscarBasesDeDatos(simulatedRoot)
	if len(encontradas) == 0 {
		t.Fatalf("Auto-discovery falló en encontrar la BD en el disco simulado")
	}
	t.Logf("Descubrimiento exitoso: %s", encontradas[0].Path)

	// 3. Probar Backup Forense
	bak, err := CrearBackupSeguridad(encontradas[0].Path)
	if err != nil {
		t.Fatalf("Error creando backup: %v", err)
	}
	if _, err := os.Stat(bak); err != nil {
		t.Fatalf("Archivo de respaldo no existe: %s", bak)
	}
	t.Logf("Respaldo forense creado en: %s", bak)

	// 4. Probar Exportación a JSON con Checksum SHA-256
	key := crypto.ObtenerLlaveMaestra()
	stRecovered, err := storage.NewPacketStorageWithKey(encontradas[0].Path, key)
	if err != nil {
		t.Fatalf("Error abriendo BD recuperada: %v", err)
	}
	defer stRecovered.Close()

	pendientes, err := stRecovered.ListarPendientes()
	if err != nil {
		t.Fatalf("Error listando pendientes descifradas: %v", err)
	}
	if len(pendientes) != 3 {
		t.Fatalf("Se esperaban 3 pendientes, se obtuvieron %d", len(pendientes))
	}

	outJSON := filepath.Join(simulatedRoot, "export_test.json")
	outFinal, err := ExportarRescateJSON(pendientes, encontradas[0].Path, outJSON)
	if err != nil {
		t.Fatalf("Error exportando JSON: %v", err)
	}

	if _, err := os.Stat(outFinal); err != nil {
		t.Fatalf("Archivo exportado no existe: %s", outFinal)
	}
	if _, err := os.Stat(outFinal + ".sha256"); err != nil {
		t.Fatalf("Archivo de suma sha256 no existe: %s.sha256", outFinal)
	}

	t.Logf("Exportación y checksum generados con éxito: %s", outFinal)
}
