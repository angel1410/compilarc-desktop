package biometric

import (
	"bytes"
	"context"
	"encoding/base64"
	"image"
	"os"
	"strings"
	"testing"
	"time"

	wsq "github.com/jtejido/go-wsq"
	"compilarc-desktop/internal/sync"
)

func TestReencodedWSQWithCNE(t *testing.T) {
	// 1. Decodificar muestra oficial de Ivan Aparicio (V-4479824)
	data, err := os.ReadFile("muestras/V-4479824/RightThumb.wsq")
	if err != nil {
		t.Fatalf("Error leyendo muestra: %v", err)
	}

	img, err := wsq.Decode(bytes.NewReader(data))
	if err != nil {
		t.Fatalf("Error decodificando WSQ: %v", err)
	}

	w, h := img.Bounds().Dx(), img.Bounds().Dy()
	rawPixels := make([]byte, w*h)
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			c := img.At(x, y)
			r, g, b, _ := c.RGBA()
			rawPixels[y*w+x] = byte((r*299 + g*587 + b*114) / 1000 >> 8)
		}
	}

	gray := &image.Gray{
		Pix:    rawPixels,
		Stride: w,
		Rect:   image.Rect(0, 0, w, h),
	}

	// 2. Codificar con go-wsq
	var rawOut bytes.Buffer
	err = wsq.Encode(&rawOut, gray, &wsq.Options{Bitrate: 0.75})
	if err != nil {
		t.Fatalf("Error codificando a WSQ con go-wsq: %v", err)
	}

	wsqBytes := rawOut.Bytes()

	// Probar parcheando "PPI -1" por "PPI 500" o construyendo el NIST_COM exacto
	// Busquemos "PPI -1" en wsqBytes
	str := string(wsqBytes)
	if idx := strings.Index(str, "PPI -1\n"); idx != -1 {
		// Reemplazar "PPI -1\n" (7 bytes) con "PPI 500" + espacio (7 bytes) para preservar el tamaño del encabezado!
		copy(wsqBytes[idx:idx+7], []byte("PPI 500\n"))
		t.Logf("Parcheado PPI -1 a PPI 500 en offset %d", idx)
	}

	b64WSQ := base64.StdEncoding.EncodeToString(wsqBytes)

	// 3. Probar envío directo al backend CompilARC
	client := sync.NewClient("http://127.0.0.1:8080", "P!Y2lFcqAiV1E][p", "TEST-WSQ")
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	res, err := client.VerificarHuella(ctx, "", "V-4479824", b64WSQ, "RightThumb")
	if err != nil {
		t.Fatalf("VerificarHuella falló: %v", err)
	}

	t.Logf("Resultado backend: Match=%v, Score=%.1f, Result=%s", res.Match, res.Score, res.Resultado)
}
