package network

import (
	"fmt"
	"testing"
)

func TestVerificarEstado(t *testing.T) {
	srv := NewNetworkService()
	st := srv.VerificarEstado()
	fmt.Printf("Resultado Diagnóstico de Red:\n%+v\n", st)
	if !st.Online {
		t.Logf("No online connection detected, or offline")
	}
}
