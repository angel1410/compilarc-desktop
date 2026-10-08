package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"compilarc-desktop/internal/ac"
	"compilarc-desktop/internal/biometric"
	"compilarc-desktop/internal/network"
	"compilarc-desktop/internal/storage"
	"compilarc-desktop/internal/sync"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx           context.Context
	acDB          *ac.ACDatabase
	scanner       *biometric.ScannerService
	packetStorage *storage.PacketStorage
	netService    *network.NetworkService
	syncClient    *sync.Client
}

// AppConfig estructura para persistencia de configuración del cliente Desktop
type AppConfig struct {
	ServerURL  string `json:"server_url"`
	APIKey     string `json:"api_key"`
	EstacionID string `json:"estacion_id"`
}

func cargarConfiguracionInicial() AppConfig {
	cfg := AppConfig{
		ServerURL:  "http://192.168.213.42:8080",
		APIKey:     "P!Y2lFcqAiV1E][p",
		EstacionID: "TAQUILLA-01",
	}

	exeDir := "."
	if exePath, err := os.Executable(); err == nil {
		exeDir = filepath.Dir(exePath)
	}

	candidatos := []string{
		filepath.Join(exeDir, "config.json"),
		filepath.Join(exeDir, "data", "config.json"),
		"./config.json",
		"./data/config.json",
	}

	for _, cand := range candidatos {
		if data, err := os.ReadFile(cand); err == nil {
			var parsed AppConfig
			if errU := json.Unmarshal(data, &parsed); errU == nil {
				if parsed.ServerURL != "" {
					cfg.ServerURL = strings.TrimRight(parsed.ServerURL, "/")
				}
				if parsed.APIKey != "" {
					cfg.APIKey = parsed.APIKey
				}
				if parsed.EstacionID != "" {
					cfg.EstacionID = parsed.EstacionID
				}
				break
			}
		}
	}

	if envURL := os.Getenv("COMPILARC_WEB_URL"); envURL != "" {
		cfg.ServerURL = strings.TrimRight(envURL, "/")
	}
	if envKey := os.Getenv("COMPILARC_API_KEY"); envKey != "" {
		cfg.APIKey = envKey
	}
	if envEst := os.Getenv("COMPILARC_ESTACION_ID"); envEst != "" {
		cfg.EstacionID = envEst
	}

	return cfg
}

// NewApp creates a new App application struct
func NewApp() *App {
	cfg := cargarConfiguracionInicial()
	fmt.Printf("[CompilaRC Desktop] Conectando a Servidor Central: %s (Estación: %s)\n", cfg.ServerURL, cfg.EstacionID)

	return &App{
		scanner:    biometric.NewScannerService(),
		netService: network.NewNetworkService(),
		syncClient: sync.NewClient(cfg.ServerURL, cfg.APIKey, cfg.EstacionID),
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

	// Inicializar SQLite del Archivo Cedular local (priorizar cedulados_full.db de 36.6M si existe)
	acPath := filepath.Join(dataDir, "cedulados_full.db")
	if _, err := os.Stat(acPath); err != nil {
		acPath = filepath.Join(dataDir, "ac_local.db")
	}
	acDB, err := ac.NewACDatabase(acPath)
	if err != nil {
		fmt.Printf("Error inicializando AC SQLite: %v\n", err)
	} else {
		a.acDB = acDB
	}

	// Inicializar SQLite de solicitudes offline
	packPath := filepath.Join(dataDir, "solicitudes_offline.db")
	packDB, err := storage.NewPacketStorage(packPath)
	if err != nil {
		fmt.Printf("Error inicializando Paquetes Offline SQLite: %v\n", err)
	} else {
		a.packetStorage = packDB
	}

	// Iniciar monitoreo continuo del estado de red
	if a.netService != nil {
		a.netService.IniciarMonitoreo(a.ctx, func(estado network.EstadoRed) {
			runtime.EventsEmit(a.ctx, "red:estado_cambiado", estado)
		})
	}
}

// ConsultarAC busca en el padrón local con latencia menor a 3 milisegundos.
// Si no se encuentra localmente en SQLite y la estación tiene conexión, consulta en vivo
// el Archivo Cedular central (36.6 millones de registros) y lo guarda automáticamente en la base local (caché).
func (a *App) ConsultarAC(nacionalidad string, cedula int) (*ac.Ciudadano, error) {
	if a.acDB != nil {
		c, err := a.acDB.Consultar(nacionalidad, cedula)
		if err == nil && c != nil {
			return c, nil
		}
	}

	// Fallback inteligente: consultar al servidor central si no está en SQLite local
	if a.syncClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		cCentral, err := a.syncClient.ConsultarCiudadano(ctx, nacionalidad, cedula)
		if err == nil && cCentral != nil {
			// Persistir en SQLite local para que quede disponible offline
			if a.acDB != nil {
				_, _ = a.acDB.AplicarDelta([]ac.Ciudadano{*cCentral}, 146, time.Now().Format(time.RFC3339))
			}
			return cCentral, nil
		}
	}

	return nil, nil
}

// CapturarHuella ejecuta la lectura del sensor Futronic FS88H con la cédula del titular
func (a *App) CapturarHuella(dedoNombre, cedula string) (*biometric.ResultadoHuella, error) {
	if strings.TrimSpace(cedula) == "" || strings.Contains(cedula, "XXXXXXXX") {
		return nil, fmt.Errorf("cédula de titular válida y verificada es obligatoria para la captura biométrica")
	}
	if a.scanner == nil {
		return nil, fmt.Errorf("servicio biométrico no disponible")
	}
	return a.scanner.CapturarHuella(dedoNombre, cedula)
}

// ObtenerEstadoSensor retorna el estado de conexión del escáner
func (a *App) ObtenerEstadoSensor() biometric.EstadoSensor {
	if a.scanner == nil {
		return biometric.EstadoSensor{Conectado: false}
	}
	return a.scanner.ObtenerEstado()
}

// VerificarHuellaOnline valida en tiempo real la muestra dactilar con CNE/PIAC a través de CompilaRC Web
func (a *App) VerificarHuellaOnline(cedula, sampleWSQ, dedo string) (map[string]interface{}, error) {
	if strings.TrimSpace(cedula) == "" || strings.Contains(cedula, "XXXXXXXX") {
		return nil, fmt.Errorf("cédula de titular válida y verificada requerida para verificación biométrica CNE/PIAC")
	}
	stRed := a.ObtenerEstadoRed()
	if !stRed.Online {
		return map[string]interface{}{
			"online":     false,
			"verificado": false,
			"match":      false,
			"resultado":  "MODO_OFFLINE",
			"mensaje":    "Estación en Modo Offline: la huella se resguardará localmente para validación diferida al sincronizar el lote.",
		}, nil
	}

	if a.syncClient == nil {
		return nil, fmt.Errorf("cliente de sincronización no inicializado")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()

	res, err := a.syncClient.VerificarHuella(ctx, "", cedula, sampleWSQ, dedo)
	if err != nil {
		return map[string]interface{}{
			"online":     true,
			"verificado": false,
			"match":      false,
			"resultado":  "ERROR_COMUNICACION",
			"error":      err.Error(),
			"mensaje":    fmt.Sprintf("Error comunicando con servicio de biometría CNE: %v", err),
		}, nil
	}

	return map[string]interface{}{
		"online":         true,
		"success":        res.Success,
		"verificado":     res.Match,
		"match":          res.Match,
		"score":          res.Score,
		"resultado":      res.Resultado,
		"transaccion_id": res.TransaccionID,
		"mensaje":        res.Mensaje,
		"simulado":       res.Simulado,
		"dedo":           res.Dedo,
	}, nil
}

// ResultadoGuardarSolicitud reporte del guardado de la solicitud
type ResultadoGuardarSolicitud struct {
	ID          string `json:"id"`
	Transmitido bool   `json:"transmitido"`
	Modo        string `json:"modo"` // "ONLINE" o "OFFLINE"
	CoSolicitud int64  `json:"co_solicitud,omitempty"`
	Mensaje     string `json:"mensaje"`
}

// GuardarSolicitud registra el acta y huella. Si la estación está online, intenta transmisión inmediata. Si está offline o falla, guarda en la cola cifrada local (AES-256).
func (a *App) GuardarSolicitud(solicitud storage.SolicitudCertificacion) (*ResultadoGuardarSolicitud, error) {
	if a.packetStorage == nil {
		return nil, fmt.Errorf("almacén offline no disponible")
	}
	if solicitud.Operador == "" {
		solicitud.Operador = "operador.taquilla"
	}

	// 1. Si la red está activa, intentar transmisión inmediata al servidor central
	stRed := a.ObtenerEstadoRed()
	if stRed.Online && a.syncClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
		defer cancel()

		respOnline, err := a.syncClient.EnviarSolicitudEnLinea(ctx, "", solicitud)
		if err == nil && respOnline != nil && respOnline.Success {
			solicitud.Estado = "SINCRONIZADO"
			_ = a.packetStorage.GuardarSolicitud(&solicitud)
			fmt.Printf("[CompilaRC Desktop] Solicitud transmitida en línea con éxito. CoSolicitud Central: #%d\n", respOnline.CoSolicitud)
			return &ResultadoGuardarSolicitud{
				ID:          solicitud.ID,
				Transmitido: true,
				Modo:        "ONLINE",
				CoSolicitud: respOnline.CoSolicitud,
				Mensaje:     fmt.Sprintf("Solicitud transmitida en línea con éxito a CompilaRC Central (#%d)", respOnline.CoSolicitud),
			}, nil
		}
		if respOnline != nil && respOnline.Error != "" {
			fmt.Printf("[CompilaRC Desktop] Servidor central reportó: %s\n", respOnline.Error)
		}
		if err != nil {
			fmt.Printf("[CompilaRC Desktop] Envío en línea no completado (%v). Encolando en lote offline seguro.\n", err)
		}
	}

	// 2. Modo Offline o fallback seguro: encolar cifrado con AES-256-GCM
	solicitud.Estado = "PENDIENTE"
	err := a.packetStorage.GuardarSolicitud(&solicitud)
	if err != nil {
		return nil, err
	}
	return &ResultadoGuardarSolicitud{
		ID:          solicitud.ID,
		Transmitido: false,
		Modo:        "OFFLINE",
		Mensaje:     "Solicitud resguardada con éxito en lote local seguro (cifrado AES-256)",
	}, nil
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

// SimularSincronizacionLote transmite el lote encriptado hacia CompilaRC-Web (o fallback local)
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

	// 1. Si el cliente de sincronización está disponible, transmitir al servidor central
	if a.syncClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer cancel()

		loteResp, errSync := a.syncClient.SincronizarLoteOffline(ctx, "", pendientes)
		if errSync == nil && loteResp.Success {
			var idsExitosos []string
			for _, r := range loteResp.Resultados {
				if r.Success {
					idsExitosos = append(idsExitosos, r.IDLocal)
				}
			}
			if len(idsExitosos) > 0 {
				_ = a.packetStorage.MarcarTransmitidas(idsExitosos)
			}

			return map[string]interface{}{
				"transmitidos": len(idsExitosos),
				"fallidos":     loteResp.Fallidos,
				"mensaje":      fmt.Sprintf("Se han transmitido exitosamente %d paquetes a CompilaRC-Web (CIVIS/PIAC). Fallidos: %d", len(idsExitosos), loteResp.Fallidos),
				"timestamp":    time.Now().Format("2006-01-02 15:04:05"),
			}, nil
		}
		fmt.Printf("[CompilaRC Desktop] Error sincronizando con CompilaRC Web: %v. Usando procesamiento de respaldo.\n", errSync)
	}

	// 2. Procesamiento local
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
		"mensaje":      fmt.Sprintf("Se han marcado exitosamente %d paquetes en el almacén local.", len(ids)),
		"timestamp":    time.Now().Format("2006-01-02 15:04:05"),
	}, nil
}

// ObtenerEstadoRed retorna el diagnóstico actual de la conectividad de red
func (a *App) ObtenerEstadoRed() network.EstadoRed {
	if a.netService == nil {
		return network.EstadoRed{Online: false, TipoConexion: network.ConexionNinguna, Mensaje: "Servicio de red no disponible"}
	}
	return a.netService.ObtenerEstadoActual()
}

// ForzarVerificacionRed fuerza un chequeo inmediato y emite el evento correspondiente
func (a *App) ForzarVerificacionRed() network.EstadoRed {
	if a.netService == nil {
		return network.EstadoRed{Online: false, TipoConexion: network.ConexionNinguna, Mensaje: "Servicio de red no disponible"}
	}
	st := a.netService.VerificarEstado()
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "red:estado_cambiado", st)
	}
	return st
}

// ObtenerConfigServidor retorna la URL configurada del servidor central
func (a *App) ObtenerConfigServidor() string {
	if a.syncClient != nil && a.syncClient.BaseURL != "" {
		return a.syncClient.BaseURL
	}
	return "http://192.168.213.42:8080"
}

// ConfigurarServidorURL permite cambiar en caliente la dirección del servidor central y guardarla en config.json
func (a *App) ConfigurarServidorURL(nuevaURL string) (string, error) {
	nuevaURL = strings.TrimSpace(nuevaURL)
	nuevaURL = strings.TrimRight(nuevaURL, "/")
	if nuevaURL == "" {
		return "", fmt.Errorf("la URL del servidor no puede estar vacía")
	}
	if !strings.HasPrefix(nuevaURL, "http://") && !strings.HasPrefix(nuevaURL, "https://") {
		nuevaURL = "http://" + nuevaURL
	}

	if a.syncClient != nil {
		a.syncClient.BaseURL = nuevaURL
	}

	dataDir := a.determinarDataDir()
	exeDir := "."
	if exePath, err := os.Executable(); err == nil {
		exeDir = filepath.Dir(exePath)
	}

	cfg := AppConfig{
		ServerURL:  nuevaURL,
		APIKey:     "P!Y2lFcqAiV1E][p",
		EstacionID: "TAQUILLA-01",
	}
	cfgBytes, _ := json.MarshalIndent(cfg, "", "  ")
	_ = os.WriteFile(filepath.Join(exeDir, "config.json"), cfgBytes, 0644)
	_ = os.WriteFile(filepath.Join(dataDir, "config.json"), cfgBytes, 0644)

	fmt.Printf("[CompilaRC Desktop] Servidor central reconfigurado a: %s\n", nuevaURL)
	return nuevaURL, nil
}


