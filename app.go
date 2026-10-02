package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"compilarc-desktop/internal/ac"
	"compilarc-desktop/internal/biometric"
	"compilarc-desktop/internal/storage"
)

// App struct
type App struct {
	ctx           context.Context
	acDB          *ac.ACDatabase
	scanner       *biometric.ScannerService
	packetStorage *storage.PacketStorage
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		scanner: biometric.NewScannerService(),
	}
}

func (a *App) determinarDataDir() string {
	// 1. Intentar carpeta data junto al ejecutable (modo portátil en cualquier carpeta o pendrive)
	if exePath, err := os.Executable(); err == nil {
		exeDir := filepath.Dir(exePath)
		candidate := filepath.Join(exeDir, "data")
		if err := os.MkdirAll(candidate, 0755); err == nil {
			return candidate
		}
	}

	// 2. Si el directorio del binario es de solo lectura (ej. Program Files en Windows),
	// utilizar la carpeta de datos de usuario del sistema (%APPDATA% / ~/.config)
	if userConfig, err := os.UserConfigDir(); err == nil {
		candidate := filepath.Join(userConfig, "CompilaRC", "data")
		if err := os.MkdirAll(candidate, 0755); err == nil {
			return candidate
		}
	}

	// 3. Fallback relativo
	candidate := filepath.Join(".", "data")
	_ = os.MkdirAll(candidate, 0755)
	return candidate
}

// startup is called when the app starts.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Determinar ubicación persistente de datos locales
	dataDir := a.determinarDataDir()
	fmt.Printf("[CompilaRC] Directorio de datos locales: %s\n", dataDir)

	// Inicializar SQLite del Archivo Cedular local
	acPath := filepath.Join(dataDir, "ac_local.db")
	acDB, err := ac.NewACDatabase(acPath)
	if err != nil {
		fmt.Printf("Error inicializando AC SQLite: %v\n", err)
	} else {
		a.acDB = acDB
		_ = a.acDB.SembrarDatosDemo()
	}

	// Inicializar SQLite de solicitudes offline
	packPath := filepath.Join(dataDir, "solicitudes_offline.db")
	packDB, err := storage.NewPacketStorage(packPath)
	if err != nil {
		fmt.Printf("Error inicializando Paquetes Offline SQLite: %v\n", err)
	} else {
		a.packetStorage = packDB
	}
}

// ConsultarAC busca en el padrón local con latencia menor a 3 milisegundos
func (a *App) ConsultarAC(nacionalidad string, cedula int) (*ac.Ciudadano, error) {
	if a.acDB == nil {
		return nil, fmt.Errorf("base de datos AC no disponible")
	}
	return a.acDB.Consultar(nacionalidad, cedula)
}

// CapturarHuella ejecuta la lectura del sensor Futronic FS88H
func (a *App) CapturarHuella(dedoNombre string) (*biometric.ResultadoHuella, error) {
	if a.scanner == nil {
		return nil, fmt.Errorf("servicio biométrico no disponible")
	}
	return a.scanner.CapturarHuella(dedoNombre)
}

// ObtenerEstadoSensor retorna el estado de conexión del escáner
func (a *App) ObtenerEstadoSensor() biometric.EstadoSensor {
	if a.scanner == nil {
		return biometric.EstadoSensor{Conectado: false}
	}
	return a.scanner.ObtenerEstado()
}

// GuardarSolicitud registra el acta y huella en el lote local seguro
func (a *App) GuardarSolicitud(solicitud storage.SolicitudCertificacion) (string, error) {
	if a.packetStorage == nil {
		return "", fmt.Errorf("almacén offline no disponible")
	}
	if solicitud.Operador == "" {
		solicitud.Operador = "operador.taquilla"
	}
	err := a.packetStorage.GuardarSolicitud(&solicitud)
	if err != nil {
		return "", err
	}
	return solicitud.ID, nil
}

// ListarSolicitudesPendientes devuelve las solicitudes almacenadas offline
func (a *App) ListarSolicitudesPendientes() ([]storage.SolicitudCertificacion, error) {
	if a.packetStorage == nil {
		return nil, fmt.Errorf("almacén offline no disponible")
	}
	return a.packetStorage.ListarPendientes()
}

// ObtenerEstadisticasAC retorna información del corte del Archivo Cedular local
func (a *App) ObtenerEstadisticasAC() (map[string]interface{}, error) {
	if a.acDB == nil {
		return nil, fmt.Errorf("base de datos AC no disponible")
	}
	total, version, fecha, err := a.acDB.ObtenerEstadisticas()
	if err != nil {
		return nil, err
	}
	pendientes := 0
	if a.packetStorage != nil {
		pendientes, _ = a.packetStorage.ContarPendientes()
	}

	return map[string]interface{}{
		"total_registros":    total,
		"version_corte":      version,
		"fecha_corte":        fecha,
		"lotes_pendientes":   pendientes,
		"estacion_id":        "ESTACION-RC-01",
	}, nil
}

// AplicarDeltaAC recibe un JSON con registros nuevos y actualiza el AC local
func (a *App) AplicarDeltaAC(deltaJSON string) (map[string]interface{}, error) {
	if a.acDB == nil {
		return nil, fmt.Errorf("base de datos AC no disponible")
	}

	var payload struct {
		VersionActual int            `json:"version_actual"`
		FechaCorte    string         `json:"fecha_corte"`
		Registros     []ac.Ciudadano `json:"registros"`
	}

	if err := json.Unmarshal([]byte(deltaJSON), &payload); err != nil {
		return nil, fmt.Errorf("error al decodificar delta JSON: %w", err)
	}

	total, err := a.acDB.AplicarDelta(payload.Registros, payload.VersionActual, payload.FechaCorte)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"exito":              true,
		"registros_aplicados": total,
		"nueva_version":      payload.VersionActual,
		"fecha_corte":        payload.FechaCorte,
	}, nil
}

// SimularSincronizacionLote simula la transmisión del lote encriptado hacia CompilaRC-Web
func (a *App) SimularSincronizacionLote() (map[string]interface{}, error) {
	if a.packetStorage == nil {
		return nil, fmt.Errorf("almacén offline no disponible")
	}

	pendientes, err := a.packetStorage.ListarPendientes()
	if err != nil {
		return nil, err
	}

	if len(pendientes) == 0 {
		return map[string]interface{}{
			"transmitidos": 0,
			"mensaje":      "No hay solicitudes pendientes por transmitir.",
		}, nil
	}

	var ids []string
	for _, p := range pendientes {
		ids = append(ids, p.ID)
	}

	err = a.packetStorage.MarcarTransmitidas(ids)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"transmitidos": len(ids),
		"mensaje":      fmt.Sprintf("Se han transmitido exitosamente %d paquetes encriptados a CompilaRC-Web (PIAC/CIVIS).", len(ids)),
		"timestamp":    time.Now().Format("2006-01-02 15:04:05"),
	}, nil
}
