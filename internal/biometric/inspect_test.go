package biometric

import (
	"bytes"
	"encoding/hex"
	"image"
	"os"
	"testing"

	wsq "github.com/jtejido/go-wsq"
)

func TestInspectWSQHeader(t *testing.T) {
	data, _ := os.ReadFile("muestras/V-4479824/RightThumb.wsq")
	img, _ := wsq.Decode(bytes.NewReader(data))
	w, h := img.Bounds().Dx(), img.Bounds().Dy()
	rawPixels := make([]byte, w*h)
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			c := img.At(x, y)
			r, g, b, _ := c.RGBA()
			rawPixels[y*w+x] = byte((r*299 + g*587 + b*114) / 1000 >> 8)
		}
	}
	gray := &image.Gray{Pix: rawPixels, Stride: w, Rect: image.Rect(0, 0, w, h)}

	var out bytes.Buffer
	_ = wsq.Encode(&out, gray, &wsq.Options{Bitrate: 0.75})
	t.Logf("Go-WSQ first 64 bytes: %s", hex.EncodeToString(out.Bytes()[:64]))
	t.Logf("Go-WSQ text: %q", string(out.Bytes()[:64]))

	t.Logf("Corner (0,0): %d", rawPixels[0])
	t.Logf("Corner (w-1, 0): %d", rawPixels[w-1])
	t.Logf("Corner (0, h-1): %d", rawPixels[(h-1)*w])
	t.Logf("Center: %d", rawPixels[(h/2)*w+w/2])
}
