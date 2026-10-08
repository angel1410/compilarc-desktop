package biometric

import (
	"bytes"
	"image"
	"os"
	"testing"

	wsq "github.com/jtejido/go-wsq"
)

func TestEncodeRawToWSQ(t *testing.T) {
	// Leer una muestra WSQ existente de prueba
	data, err := os.ReadFile("muestras/V-4479824/RightThumb.wsq")
	if err != nil {
		t.Fatalf("Error leyendo muestra: %v", err)
	}

	// Decodificar con go-wsq
	img, err := wsq.Decode(bytes.NewReader(data))
	if err != nil {
		t.Fatalf("Error decodificando WSQ: %v", err)
	}

	bounds := img.Bounds()
	w, h := bounds.Dx(), bounds.Dy()
	t.Logf("Imagen decodificada: %dx%d", w, h)

	// Extraer pixels reales como raw bytes
	rawPixels := make([]byte, w*h)
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			c := img.At(x, y)
			r, g, b, _ := c.RGBA()
			// Escala de grises estándar
			rawPixels[y*w+x] = byte((r*299 + g*587 + b*114) / 1000 >> 8)
		}
	}

	gray := &image.Gray{
		Pix:    rawPixels,
		Stride: w,
		Rect:   image.Rect(0, 0, w, h),
	}

	var rawOut bytes.Buffer
	err = wsq.Encode(&rawOut, gray, &wsq.Options{Bitrate: 0.75})
	if err != nil {
		t.Fatalf("Error codificando raw real a WSQ: %v", err)
	}
	t.Logf("WSQ desde raw real generado con éxito: %d bytes (original: %d)", rawOut.Len(), len(data))
}
