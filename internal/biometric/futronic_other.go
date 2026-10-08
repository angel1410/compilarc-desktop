//go:build !windows

package biometric

import "fmt"

// CapturarDesdeHardware stub para plataformas que no son Windows
func CapturarDesdeHardware() ([]byte, int, int, string, int, error) {
	return nil, 0, 0, "", 0, fmt.Errorf("captura por hardware nativo solo disponible en Windows mediante ftrScanAPI.dll")
}

// VerificarConexionHardware stub para plataformas que no son Windows (en Linux emulamos conectado)
func VerificarConexionHardware() bool {
	return true
}
