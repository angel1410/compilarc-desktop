package sync

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"compilarc-desktop/internal/ac"
	"compilarc-desktop/internal/storage"
)

// RespuestaDesktop representa la respuesta del servidor central CompilaRC Web
type RespuestaDesktop struct {
	Success     bool                   `json:"success"`
	CoSolicitud int64                  `json:"co_solicitud,omitempty"`
	IDLocal     string                 `json:"id_local,omitempty"`
	Estado      string                 `json:"estado"`
	Mensaje     string                 `json:"mensaje"`
	Biometria   map[string]interface{} `json:"biometria,omitempty"`
	Error       string                 `json:"error,omitempty"`
}

// RespuestaLote representa el resumen de sincronización de un lote
type RespuestaLote struct {
	Success    bool               `json:"success"`
	Total      int                `json:"total"`
	Exitosos   int                `json:"exitosos"`
	Fallidos   int                `json:"fallidos"`
	Resultados []RespuestaDesktop `json:"resultados"`
	Error      string             `json:"error,omitempty"`
}

// Client cliente HTTP para comunicación con CompilaRC Web
type Client struct {
	BaseURL    string
	APIKey     string
	EstacionID string
	httpClient *http.Client
}

// NewClient inicializa el cliente de sincronización con CompilaRC Web
func NewClient(baseURL, apiKey, estacionID string) *Client {
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}
	baseURL = strings.TrimSuffix(baseURL, "/")

	if apiKey == "" {
		apiKey = "P!Y2lFcqAiV1E][p"
	}
	if estacionID == "" {
		estacionID = "TAQUILLA-01"
	}

	return &Client{
		BaseURL:    baseURL,
		APIKey:     apiKey,
		EstacionID: estacionID,
		httpClient: &http.Client{
			Timeout: 45 * time.Second,
		},
	}
}

// EnviarSolicitudEnLinea envía una solicitud en vivo (Modo Online) hacia CompilaRC Web
func (c *Client) EnviarSolicitudEnLinea(ctx context.Context, token string, s storage.SolicitudCertificacion) (*RespuestaDesktop, error) {
	urlDestino := c.BaseURL + "/api/v1/solicitudes/recibir-desktop"

	payload := map[string]interface{}{
		"id_local":          s.ID,
		"estacion_id":       c.EstacionID,
		"tipo_acta":         s.TipoActa,
		"operador":          s.Operador,
		"solicitante":       s.DatosSolicitante,
		"acta":              s.DatosActa,
		"biometria":         s.DatosBiometricos,
		"creado_en":         s.CreadoEn,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("error serializando solicitud para envío online: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, urlDestino, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("error creando request HTTP: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", c.APIKey)
	req.Header.Set("X-Estacion-ID", c.EstacionID)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("falla de conexión con CompilaRC Web (%s): %w", urlDestino, err)
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)

	var res RespuestaDesktop
	if err := json.Unmarshal(bodyBytes, &res); err != nil {
		return nil, fmt.Errorf("código HTTP %d - respuesta no válida del servidor: %s", resp.StatusCode, string(bodyBytes))
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		errMsg := res.Error
		if errMsg == "" {
			errMsg = res.Mensaje
		}
		return &res, fmt.Errorf("servidor central rechazó la solicitud (HTTP %d): %s", resp.StatusCode, errMsg)
	}

	return &res, nil
}

// SincronizarLoteOffline envía un lote acumulado de solicitudes offline a CompilaRC Web
func (c *Client) SincronizarLoteOffline(ctx context.Context, token string, solicitudes []storage.SolicitudCertificacion) (*RespuestaLote, error) {
	urlDestino := c.BaseURL + "/api/v1/solicitudes/sincronizar-lote-desktop"

	items := make([]map[string]interface{}, 0, len(solicitudes))
	for _, s := range solicitudes {
		items = append(items, map[string]interface{}{
			"id_local":          s.ID,
			"estacion_id":       c.EstacionID,
			"tipo_acta":         s.TipoActa,
			"operador":          s.Operador,
			"solicitante":       s.DatosSolicitante,
			"acta":              s.DatosActa,
			"biometria":         s.DatosBiometricos,
			"creado_en":         s.CreadoEn,
		})
	}

	payload := map[string]interface{}{
		"modo":        "SINCRONIZACION_OFFLINE",
		"estacion_id": c.EstacionID,
		"solicitudes": items,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("error serializando lote: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, urlDestino, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("error creando request HTTP: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", c.APIKey)
	req.Header.Set("X-Estacion-ID", c.EstacionID)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("falla de conexión con CompilaRC Web (%s): %w", urlDestino, err)
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)

	var res RespuestaLote
	if err := json.Unmarshal(bodyBytes, &res); err != nil {
		return nil, fmt.Errorf("código HTTP %d - error decodificando respuesta de lote: %s", resp.StatusCode, string(bodyBytes))
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return &res, fmt.Errorf("error en sincronización de lote (HTTP %d): %s", resp.StatusCode, res.Error)
	}

	return &res, nil
}

// CiudadanoCentral representa la respuesta del endpoint central /api/v1/ciudadanos/consultar
type CiudadanoCentral struct {
	PrimerNombre    string `json:"primer_nombre"`
	SegundoNombre   string `json:"segundo_nombre"`
	PrimerApellido  string `json:"primer_apellido"`
	SegundoApellido string `json:"segundo_apellido"`
	FechaNacimiento string `json:"fe_nacimiento"`
	Sexo            string `json:"sexo"`
	EsFallecido     bool   `json:"es_fallecido"`
	CoObjecion      string `json:"co_objecion"`
}

// ConsultarCiudadano busca un ciudadano en el servidor central (36.6 millones de registros)
func (c *Client) ConsultarCiudadano(ctx context.Context, nacionalidad string, cedula int) (*ac.Ciudadano, error) {
	if nacionalidad == "" {
		nacionalidad = "V"
	}
	urlDestino := fmt.Sprintf("%s/api/v1/ciudadanos/consultar?nacionalidad=%s&cedula=%d", c.BaseURL, nacionalidad, cedula)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, urlDestino, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-API-Key", c.APIKey)
	req.Header.Set("X-Estacion-ID", c.EstacionID)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error de conexion con servidor central: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, nil // No encontrado
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("servidor central retorno status HTTP: %d", resp.StatusCode)
	}

	var data CiudadanoCentral
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	return &ac.Ciudadano{
		Nacionalidad:    nacionalidad,
		Cedula:          cedula,
		PrimerNombre:    data.PrimerNombre,
		SegundoNombre:   data.SegundoNombre,
		PrimerApellido:  data.PrimerApellido,
		SegundoApellido: data.SegundoApellido,
		FechaNacimiento: data.FechaNacimiento,
		Sexo:            data.Sexo,
	}, nil
}

// ResultadoBiometriaDesktop estructura de respuesta para verificación dactilar en línea
type ResultadoBiometriaDesktop struct {
	Success       bool    `json:"success"`
	Match         bool    `json:"match"`
	Score         float64 `json:"score"`
	Resultado     string  `json:"resultado"`
	TransaccionID string  `json:"transaccion_id,omitempty"`
	Mensaje       string  `json:"mensaje"`
	Simulado      bool    `json:"simulado"`
	Dedo          string  `json:"dedo,omitempty"`
	Error         string  `json:"error,omitempty"`
}

// VerificarHuella valida en vivo una muestra WSQ y cédula contra el servicio CNE/PIAC en CompilaRC Web
func (c *Client) VerificarHuella(ctx context.Context, token, cedula, sampleWSQ, dedo string) (*ResultadoBiometriaDesktop, error) {
	urlDestino := c.BaseURL + "/api/v1/desktop/biometric/verificar"

	payload := map[string]interface{}{
		"cedula":      cedula,
		"sample_wsq":  sampleWSQ,
		"dedo":        dedo,
		"captured_on": time.Now().UTC().Format("2006-01-02T15:04:05.000000"),
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("error serializando payload de verificación biométrica: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, urlDestino, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("error creando request HTTP para biometría: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", c.APIKey)
	req.Header.Set("X-Estacion-ID", c.EstacionID)
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("falla de comunicación con el servicio central de biometría (%s): %w", urlDestino, err)
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)

	var res ResultadoBiometriaDesktop
	if err := json.Unmarshal(bodyBytes, &res); err != nil {
		return nil, fmt.Errorf("código HTTP %d - respuesta inválida de biometría: %s", resp.StatusCode, string(bodyBytes))
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		errMsg := res.Error
		if errMsg == "" {
			errMsg = res.Mensaje
		}
		return &res, fmt.Errorf("validación biométrica CNE/PIAC falló (HTTP %d): %s", resp.StatusCode, errMsg)
	}

	return &res, nil
}

