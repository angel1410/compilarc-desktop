package biometric

import (
	"bytes"
	"fmt"
	"image"

	"compilarc-desktop/internal/biometric/wsq"
)

// RawToWSQ comprime un buffer de píxeles en escala de grises de 8 bits (500 DPI)
// al formato estándar WSQ de NIST/FBI requerido por el AFIS del CNE.
// Incluye auto-validación de descompresión para garantizar que el buffer nunca sea corrupto.
func RawToWSQ(width, height int, rawData []byte) ([]byte, error) {
	if width <= 0 || height <= 0 {
		return nil, fmt.Errorf("dimensiones inválidas para compresión WSQ: %dx%d", width, height)
	}

	tamEsperado := width * height
	if len(rawData) < tamEsperado {
		return nil, fmt.Errorf("tamaño de buffer insuficiente para dimensiones %dx%d (esperado %d, recibido %d)",
			width, height, tamEsperado, len(rawData))
	}

	gray := &image.Gray{
		Pix:    rawData[:tamEsperado],
		Stride: width,
		Rect:   image.Rect(0, 0, width, height),
	}

	var buf bytes.Buffer
	// Bitrate 0.75 es el estándar oficial de compresión biométrica NIST/FBI (ratio ~15:1)
	err := wsq.Encode(&buf, gray, &wsq.Options{Bitrate: 0.75})
	if err != nil {
		return nil, fmt.Errorf("error codificando imagen a formato WSQ: %w", err)
	}

	wsqBytes := buf.Bytes()

	// Garantía de integridad NIST: Verificar inmediatamente que el WSQ generado sea decodificable
	if _, errDec := wsq.Decode(bytes.NewReader(wsqBytes)); errDec != nil {
		return nil, fmt.Errorf("falla de verificación en integridad de compresión WSQ: %w", errDec)
	}

	return wsqBytes, nil
}
