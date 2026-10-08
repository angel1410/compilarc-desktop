package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"
)

const (
	// MagicPrefix identifica strings cifrados para compatibilidad hacia atrás con texto plano
	MagicPrefix = "ENC:"
	// EnvMasterKey nombre de variable de entorno para personalizar la llave maestra institucional
	EnvMasterKey = "COMPILARC_MASTER_KEY"
	// DefaultMasterKey llave base institucional de respaldo (se recomienda sobreescribir en prod con EnvMasterKey)
	DefaultMasterKey = "CompilaRC-Civil-2026-MasterKey-Secret-PIAC"
)

// ObtenerLlaveMaestra retorna la llave AES-256 (32 bytes) derivada de la variable de entorno o fallback
func ObtenerLlaveMaestra() []byte {
	keyStr := os.Getenv(EnvMasterKey)
	if strings.TrimSpace(keyStr) == "" {
		keyStr = DefaultMasterKey
	}
	hash := sha256.Sum256([]byte(keyStr))
	return hash[:]
}

// DerivarLlave deriva una clave de 32 bytes a partir de cualquier passphrase o texto
func DerivarLlave(passphrase string) []byte {
	if strings.TrimSpace(passphrase) == "" {
		return ObtenerLlaveMaestra()
	}
	hash := sha256.Sum256([]byte(passphrase))
	return hash[:]
}

// EncriptarTexto toma un string en texto plano y lo cifra con AES-256-GCM.
// Retorna un string formateado como "ENC:<base64(nonce + ciphertext + tag)>"
func EncriptarTexto(plaintext string, key []byte) (string, error) {
	if len(key) != 32 {
		return "", errors.New("la llave AES debe ser exactamente de 32 bytes")
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("error creando cifrador AES: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("error creando modo GCM: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("error generando nonce aleatorio: %w", err)
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	encoded := base64.StdEncoding.EncodeToString(ciphertext)
	return MagicPrefix + encoded, nil
}

// DesencriptarTexto descifra un string con AES-256-GCM.
// Si el texto NO tiene el prefijo "ENC:", asume compatibilidad hacia atrás y lo retorna como texto plano intacto.
func DesencriptarTexto(data string, key []byte) (string, error) {
	// Compatibilidad hacia atrás: si no está cifrado, retornar texto plano
	if !strings.HasPrefix(data, MagicPrefix) {
		return data, nil
	}

	rawB64 := strings.TrimPrefix(data, MagicPrefix)
	ciphertext, err := base64.StdEncoding.DecodeString(rawB64)
	if err != nil {
		return "", fmt.Errorf("error decodificando base64: %w", err)
	}

	if len(key) != 32 {
		return "", errors.New("la llave AES debe ser exactamente de 32 bytes")
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("error creando cifrador AES: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("error creando modo GCM: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return "", errors.New("tamano de texto cifrado invalido (menor al nonce)")
	}

	nonce, actualCiphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, actualCiphertext, nil)
	if err != nil {
		return "", fmt.Errorf("error de autenticacion al desencriptar (llave incorrecta o datos corruptos): %w", err)
	}

	return string(plaintext), nil
}
