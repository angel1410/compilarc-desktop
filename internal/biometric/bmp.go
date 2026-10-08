package biometric

import (
	"bytes"
	"encoding/binary"
)

// RawToBMP convierte un buffer de píxeles en escala de grises de 8 bits a una imagen BMP estándar
func RawToBMP(width, height int, rawData []byte) []byte {
	rowSize := width
	paddedRowSize := (rowSize + 3) &^ 3
	imageSize := paddedRowSize * height
	fileSize := 14 + 40 + 1024 + imageSize

	buf := new(bytes.Buffer)

	// 1. BITMAPFILEHEADER (14 bytes)
	buf.Write([]byte("BM"))
	_ = binary.Write(buf, binary.LittleEndian, uint32(fileSize))
	_ = binary.Write(buf, binary.LittleEndian, uint16(0)) // Reserved1
	_ = binary.Write(buf, binary.LittleEndian, uint16(0)) // Reserved2
	_ = binary.Write(buf, binary.LittleEndian, uint32(14+40+1024)) // Offset a píxeles (1078)

	// 2. BITMAPINFOHEADER (40 bytes)
	_ = binary.Write(buf, binary.LittleEndian, uint32(40))               // biSize
	_ = binary.Write(buf, binary.LittleEndian, int32(width))             // biWidth
	_ = binary.Write(buf, binary.LittleEndian, int32(height))            // biHeight (bottom-up)
	_ = binary.Write(buf, binary.LittleEndian, uint16(1))                // biPlanes
	_ = binary.Write(buf, binary.LittleEndian, uint16(8))                // biBitCount (8 bits escala de grises)
	_ = binary.Write(buf, binary.LittleEndian, uint32(0))                // biCompression (BI_RGB)
	_ = binary.Write(buf, binary.LittleEndian, uint32(imageSize))        // biSizeImage
	_ = binary.Write(buf, binary.LittleEndian, int32(19685))             // biXPelsPerMeter (500 DPI)
	_ = binary.Write(buf, binary.LittleEndian, int32(19685))             // biYPelsPerMeter (500 DPI)
	_ = binary.Write(buf, binary.LittleEndian, uint32(256))              // biClrUsed
	_ = binary.Write(buf, binary.LittleEndian, uint32(256))              // biClrImportant

	// 3. Paleta de colores en escala de grises (256 entradas de 4 bytes = 1024 bytes)
	for i := 0; i < 256; i++ {
		b := byte(i)
		buf.Write([]byte{b, b, b, 0}) // B, G, R, 0
	}

	// 4. Datos de píxeles (bottom-up: de la última fila a la primera)
	pad := make([]byte, paddedRowSize-rowSize)
	for y := height - 1; y >= 0; y-- {
		start := y * width
		end := start + width
		if end <= len(rawData) {
			buf.Write(rawData[start:end])
		} else if start < len(rawData) {
			buf.Write(rawData[start:])
			buf.Write(make([]byte, end-len(rawData)))
		} else {
			buf.Write(make([]byte, width))
		}
		if len(pad) > 0 {
			buf.Write(pad)
		}
	}

	return buf.Bytes()
}
