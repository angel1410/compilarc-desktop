package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"compilarc-desktop/internal/storage"
)

// PaqueteRescateExportacion estructura el archivo JSON exportado para auditoría y transferencia
type PaqueteRescateExportacion struct {
	Formato         string                          `json:"formato"`
	Version         string                          `json:"version"`
	GeneradoEn      string                          `json:"generado_en"`
	TotalRegistros  int                             `json:"total_registros"`
	OrigenDB        string                          `json:"origen_db"`
	ChecksumSHA256  string                          `json:"checksum_sha256,omitempty"`
	Solicitudes     []storage.SolicitudCertificacion `json:"solicitudes"`
}

// CrearBackupSeguridad crea una copia timestamped de la base de datos antes de cualquier modificación
func CrearBackupSeguridad(dbPath string) (string, error) {
	origFile, err := os.Open(dbPath)
	if err != nil {
		return "", fmt.Errorf("error al abrir BD original para respaldo: %w", err)
	}
	defer origFile.Close()

	timestamp := time.Now().Format("20060102_150405")
	dir := filepath.Dir(dbPath)
	base := filepath.Base(dbPath)
	bakName := fmt.Sprintf("%s_BACKUP_%s.bak", base, timestamp)
	bakPath := filepath.Join(dir, bakName)

	destFile, err := os.Create(bakPath)
	if err != nil {
		// Si el directorio del disco es de solo lectura, respaldar en la carpeta actual
		bakPath = filepath.Join(".", bakName)
		destFile, err = os.Create(bakPath)
		if err != nil {
			return "", fmt.Errorf("error al crear archivo de respaldo: %w", err)
		}
	}
	defer destFile.Close()

	if _, err := io.Copy(destFile, origFile); err != nil {
		return "", fmt.Errorf("error al copiar contenido para respaldo: %w", err)
	}

	return bakPath, nil
}

// ExportarRescateJSON exporta la lista de solicitudes a un archivo JSON estructurado con su archivo de suma SHA-256
func ExportarRescateJSON(solicitudes []storage.SolicitudCertificacion, dbPath, outputPath string) (string, error) {
	if outputPath == "" {
		timestamp := time.Now().Format("20060102_150405")
		outputPath = fmt.Sprintf("compilarc_rescate_%s.json", timestamp)
	}

	paquete := PaqueteRescateExportacion{
		Formato:        "COMPILARC_RESCUE_PACKAGE",
		Version:        "1.0",
		GeneradoEn:     time.Now().UTC().Format(time.RFC3339),
		TotalRegistros: len(solicitudes),
		OrigenDB:       dbPath,
		Solicitudes:    solicitudes,
	}

	rawJSON, err := json.MarshalIndent(paquete, "", "  ")
	if err != nil {
		return "", fmt.Errorf("error al serializar paquete JSON: %w", err)
	}

	// Calcular hash SHA-256 del contenido
	hash := sha256.Sum256(rawJSON)
	hashHex := hex.EncodeToString(hash[:])

	if err := os.WriteFile(outputPath, rawJSON, 0644); err != nil {
		return "", fmt.Errorf("error al guardar archivo de rescate: %w", err)
	}

	// Crear archivo checksum sha256 acompañante
	shaPath := outputPath + ".sha256"
	shaContent := fmt.Sprintf("%s  %s\n", hashHex, filepath.Base(outputPath))
	_ = os.WriteFile(shaPath, []byte(shaContent), 0644)

	return outputPath, nil
}

// TransmitirAWeb envía las solicitudes pendientes al endpoint de sincronización de CompilaRC-Web
func TransmitirAWeb(apiURL, token string, solicitudes []storage.SolicitudCertificacion) (int, error) {
	if apiURL == "" {
		apiURL = "http://localhost:8080/api/v1/solicitudes/sincronizar-lote-desktop"
	}

	apiKey := os.Getenv("COMPILARC_API_KEY")
	if apiKey == "" {
		apiKey = "P!Y2lFcqAiV1E][p"
	}

	payload := map[string]interface{}{
		"modo":         "RESCATE_FORENSE_OFFLINE",
		"estacion_id":  "RESCATE-FORENSE-USB",
		"timestamp":    time.Now().UTC().Format(time.RFC3339),
		"total":        len(solicitudes),
		"solicitudes":  solicitudes,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return 0, fmt.Errorf("error al serializar payload de transmisión: %w", err)
	}

	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return 0, fmt.Errorf("error creando solicitud HTTP: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "CompilaRC-Forensic-Rescue/1.0")
	req.Header.Set("X-API-Key", apiKey)
	req.Header.Set("X-Estacion-ID", "RESCATE-FORENSE-USB")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	client := &http.Client{
		Timeout: 45 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return 0, fmt.Errorf("falla de conexión con CompilaRC-Web (%s): %w", apiURL, err)
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return resp.StatusCode, fmt.Errorf("el servidor respondió con código %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return resp.StatusCode, nil
}
