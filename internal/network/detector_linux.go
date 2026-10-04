//go:build !windows

package network

import (
	"bufio"
	"encoding/hex"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strings"
)

// detectarInterfazActiva consulta las interfaces del sistema en Linux / Unix
func detectarInterfazActiva() (tipo TipoConexion, nombre string, ipLocal string, gateway string) {
	ifaces, err := net.Interfaces()
	if err != nil {
		return ConexionNinguna, "", "", ""
	}

	gateways := obtenerGatewaysLinux()

	type Candidato struct {
		tipo      TipoConexion
		nombre    string
		ip        string
		gateway   string
		prioridad int
	}

	var candidatos []Candidato

	for _, iface := range ifaces {
		// Ignorar interfaces apagadas o loopback
		if (iface.Flags&net.FlagUp) == 0 || (iface.Flags&net.FlagLoopback) != 0 {
			continue
		}

		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}

		var ipValida string
		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}
			if ip != nil && ip.To4() != nil && !ip.IsLoopback() && !ip.IsLinkLocalUnicast() {
				ipValida = ip.String()
				break
			}
		}

		if ipValida == "" {
			continue
		}

		nombreLower := strings.ToLower(iface.Name)
		esVirtual := strings.Contains(nombreLower, "docker") ||
			strings.Contains(nombreLower, "veth") ||
			strings.Contains(nombreLower, "virbr") ||
			strings.Contains(nombreLower, "tailscale") ||
			strings.Contains(nombreLower, "tun") ||
			strings.Contains(nombreLower, "tap") ||
			strings.Contains(nombreLower, "br-")

		// Verificar si es Wi-Fi: /sys/class/net/<name>/wireless o phy80211 o prefijo wl
		esWifi := false
		if strings.HasPrefix(nombreLower, "wl") {
			esWifi = true
		} else {
			if _, err := os.Stat(filepath.Join("/sys/class/net", iface.Name, "wireless")); err == nil {
				esWifi = true
			} else if _, err := os.Stat(filepath.Join("/sys/class/net", iface.Name, "phy80211")); err == nil {
				esWifi = true
			}
		}

		var t TipoConexion
		prio := 4

		if esWifi {
			t = ConexionInalambrica
			if esVirtual {
				prio = 5
			} else {
				prio = 2
			}
		} else if strings.HasPrefix(nombreLower, "eth") || strings.HasPrefix(nombreLower, "en") {
			t = ConexionCableada
			if esVirtual {
				prio = 5
			} else {
				prio = 1
			}
		} else {
			t = ConexionOtro
			prio = 4
			if esVirtual {
				prio = 5
			}
		}

		gw := gateways[iface.Name]

		candidatos = append(candidatos, Candidato{
			tipo:      t,
			nombre:    iface.Name,
			ip:        ipValida,
			gateway:   gw,
			prioridad: prio,
		})
	}

	if len(candidatos) == 0 {
		return ConexionNinguna, "", "", ""
	}

	mejor := candidatos[0]
	for _, c := range candidatos[1:] {
		if c.prioridad < mejor.prioridad {
			mejor = c
		} else if c.prioridad == mejor.prioridad && c.gateway != "" && mejor.gateway == "" {
			mejor = c
		}
	}

	return mejor.tipo, mejor.nombre, mejor.ip, mejor.gateway
}

// obtenerGatewaysLinux lee /proc/net/route para descubrir la puerta de enlace de cada interfaz
func obtenerGatewaysLinux() map[string]string {
	res := make(map[string]string)
	f, err := os.Open("/proc/net/route")
	if err != nil {
		return res
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	// Saltar cabecera
	if scanner.Scan() {
		for scanner.Scan() {
			fields := strings.Fields(scanner.Text())
			if len(fields) >= 3 {
				iface := fields[0]
				dest := fields[1]
				gwHex := fields[2]

				// La ruta por defecto tiene destino 00000000
				if dest == "00000000" && gwHex != "00000000" && len(gwHex) == 8 {
					bytes, err := hex.DecodeString(gwHex)
					if err == nil && len(bytes) == 4 {
						// Little-endian IPv4 en /proc/net/route
						gwIP := fmt.Sprintf("%d.%d.%d.%d", bytes[3], bytes[2], bytes[1], bytes[0])
						res[iface] = gwIP
					}
				}
			}
		}
	}
	return res
}
