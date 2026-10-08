package crypto

import (
	"testing"
)

func TestEncriptarDesencriptar(t *testing.T) {
	key := ObtenerLlaveMaestra()
	original := `{"cedula":"V-12345678","nombres":"JUAN CARLOS","huella_wsq":"AAAA..."}`

	enc, err := EncriptarTexto(original, key)
	if err != nil {
		t.Fatalf("Error al encriptar: %v", err)
	}

	if enc == original {
		t.Fatal("El texto cifrado no puede ser igual al original")
	}

	dec, err := DesencriptarTexto(enc, key)
	if err != nil {
		t.Fatalf("Error al desencriptar: %v", err)
	}

	if dec != original {
		t.Fatalf("Se esperaba %s pero se obtuvo %s", original, dec)
	}
}

func TestCompatibilidadHaciaAtras(t *testing.T) {
	key := ObtenerLlaveMaestra()
	plainJSON := `{"campo":"valor_plano"}`

	// Sin prefijo ENC: debe retornar tal cual
	dec, err := DesencriptarTexto(plainJSON, key)
	if err != nil {
		t.Fatalf("No deberia fallar en texto plano: %v", err)
	}

	if dec != plainJSON {
		t.Fatalf("Esperaba texto plano intacto")
	}
}

func TestLlaveIncorrecta(t *testing.T) {
	key1 := DerivarLlave("Llave-Correcta-1")
	key2 := DerivarLlave("Llave-Incorrecta-2")
	original := "Mensaje Confidencial"

	enc, err := EncriptarTexto(original, key1)
	if err != nil {
		t.Fatalf("Error al encriptar: %v", err)
	}

	_, err = DesencriptarTexto(enc, key2)
	if err == nil {
		t.Fatal("Esperaba fallo al usar llave incorrecta")
	}
}
