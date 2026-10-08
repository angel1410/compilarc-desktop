package biometric

import (
	"bytes"
	"image"
	"os"
	"testing"

	wsq "github.com/jtejido/go-wsq"
)

func TestDumpWSQ(t *testing.T) {
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
	_ = os.WriteFile("/tmp/gowsq.wsq", out.Bytes(), 0644)
}
