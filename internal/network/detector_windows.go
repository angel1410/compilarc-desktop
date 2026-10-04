//go:build windows

package network

import (
	"strings"
	"unsafe"

	"golang.org/x/sys/windows"
)

// detectarInterfazActiva consulta las interfaces del sistema en Windows usando GetAdaptersAddresses
func detectarInterfazActiva() (tipo TipoConexion, nombre string, ipLocal string, gateway string) {
	flags := uint32(windows.GAA_FLAG_INCLUDE_GATEWAYS | windows.GAA_FLAG_SKIP_ANYCAST | windows.GAA_FLAG_SKIP_MULTICAST | windows.GAA_FLAG_SKIP_DNS_SERVER)
	var size uint32 = 16384
	buf := make([]byte, size)

	err := windows.GetAdaptersAddresses(windows.AF_INET, flags, 0, (*windows.IpAdapterAddresses)(unsafe.Pointer(&buf[0])), &size)
	if err == windows.ERROR_BUFFER_OVERFLOW {
		buf = make([]byte, size)
		err = windows.GetAdaptersAddresses(windows.AF_INET, flags, 0, (*windows.IpAdapterAddresses)(unsafe.Pointer(&buf[0])), &size)
	}
	if err != nil {
		return ConexionNinguna, "", "", ""
	}

	type Candidato struct {
		tipo      TipoConexion
		nombre    string
		ip        string
		gateway   string
		prioridad int // 1: Ethernet física, 2: Wi-Fi física, 3: Celular, 4: Otra, 5: Virtual
	}

	var candidatos []Candidato

	addr := (*windows.IpAdapterAddresses)(unsafe.Pointer(&buf[0]))
	for addr != nil {
		// Solo adaptadores operacionales y no loopback
		if addr.OperStatus == windows.IfOperStatusUp && addr.IfType != windows.IF_TYPE_SOFTWARE_LOOPBACK {
			friendlyName := ""
			if addr.FriendlyName != nil {
				friendlyName = windows.UTF16PtrToString(addr.FriendlyName)
			}
			desc := ""
			if addr.Description != nil {
				desc = windows.UTF16PtrToString(addr.Description)
			}

			// Obtener primera IPv4 válida
			ipStr := ""
			uAddr := addr.FirstUnicastAddress
			for uAddr != nil {
				ip := uAddr.Address.IP()
				if ip != nil && ip.To4() != nil && !ip.IsLoopback() && !ip.IsLinkLocalUnicast() {
					ipStr = ip.String()
					break
				}
				uAddr = uAddr.Next
			}

			// Obtener Gateway si existe
			gwStr := ""
			gAddr := addr.FirstGatewayAddress
			for gAddr != nil {
				gw := gAddr.Address.IP()
				if gw != nil && gw.To4() != nil && !gw.IsLoopback() {
					gwStr = gw.String()
					break
				}
				gAddr = gAddr.Next
			}

			if ipStr != "" {
				nameLower := strings.ToLower(friendlyName + " " + desc)
				esVirtual := strings.Contains(nameLower, "virtual") ||
					strings.Contains(nameLower, "vmware") ||
					strings.Contains(nameLower, "vbox") ||
					strings.Contains(nameLower, "hyper-v") ||
					strings.Contains(nameLower, "vethernet") ||
					strings.Contains(nameLower, "tap-") ||
					strings.Contains(nameLower, "tailscale") ||
					strings.Contains(nameLower, "zerotier") ||
					strings.Contains(nameLower, "loopback")

				var t TipoConexion
				prio := 4

				if addr.IfType == windows.IF_TYPE_ETHERNET_CSMACD {
					t = ConexionCableada
					if esVirtual {
						prio = 5
					} else {
						prio = 1
					}
				} else if addr.IfType == windows.IF_TYPE_IEEE80211 {
					t = ConexionInalambrica
					if esVirtual {
						prio = 5
					} else {
						prio = 2
					}
				} else if addr.IfType == 243 || addr.IfType == 244 { // WWAN
					t = ConexionCelular
					prio = 3
				} else {
					// Inferencia por nombre
					if strings.Contains(nameLower, "wi-fi") || strings.Contains(nameLower, "wifi") || strings.Contains(nameLower, "wireless") || strings.Contains(nameLower, "inalámbrica") {
						t = ConexionInalambrica
						prio = 2
					} else if strings.Contains(nameLower, "ethernet") || strings.Contains(nameLower, "área local") || strings.Contains(nameLower, "local area") {
						t = ConexionCableada
						prio = 1
					} else {
						t = ConexionOtro
						prio = 4
					}
					if esVirtual {
						prio = 5
					}
				}

				candidatos = append(candidatos, Candidato{
					tipo:      t,
					nombre:    friendlyName,
					ip:        ipStr,
					gateway:   gwStr,
					prioridad: prio,
				})
			}
		}
		addr = addr.Next
	}

	if len(candidatos) == 0 {
		return ConexionNinguna, "", "", ""
	}

	// Si hay adaptadores físicos reales, descartar los virtuales
	var fisicos []Candidato
	for _, c := range candidatos {
		if c.prioridad < 5 {
			fisicos = append(fisicos, c)
		}
	}

	evaluar := candidatos
	if len(fisicos) > 0 {
		evaluar = fisicos
	}

	// Seleccionar el mejor candidato (menor valor de prioridad)
	mejor := evaluar[0]
	for _, c := range evaluar[1:] {
		if c.prioridad < mejor.prioridad {
			mejor = c
		} else if c.prioridad == mejor.prioridad && c.gateway != "" && mejor.gateway == "" {
			// Si tienen la misma prioridad pero uno tiene gateway definido, preferir el que tiene gateway
			mejor = c
		}
	}

	return mejor.tipo, mejor.nombre, mejor.ip, mejor.gateway
}
