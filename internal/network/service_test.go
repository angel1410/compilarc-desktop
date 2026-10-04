package network

import (
	"fmt"
	"net"
	"testing"
)

func TestVerificarEstado(t *testing.T) {
	ifaces, _ := net.Interfaces()
	for _, i := range ifaces {
		addrs, _ := i.Addrs()
		fmt.Printf("IFACE: %s, Flags: %v, Addrs: %v\n", i.Name, i.Flags, addrs)
	}
	srv := NewNetworkService()
	st := srv.VerificarEstado()
	fmt.Printf("\nResultado Diagnóstico de Red Final:\n%+v\n", st)
}
