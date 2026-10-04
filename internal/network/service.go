package network

import (
	"context"
	"fmt"
	"net"
	"sync"
	"time"
)

// NetworkService gestiona el diagnóstico y monitoreo en segundo plano de la conexión
type NetworkService struct {
	mu           sync.RWMutex
	ultimoEstado EstadoRed
	cancel       context.CancelFunc
	onCambio     func(EstadoRed)
}

func NewNetworkService() *NetworkService {
	s := &NetworkService{
		ultimoEstado: EstadoRed{
			Online:       false,
			TipoConexion: ConexionNinguna,
			Mensaje:      "Inicializando diagnóstico de red...",
		},
	}
	return s
}

// IniciarMonitoreo inicia una goroutine que comprueba la red periódicamente
func (s *NetworkService) IniciarMonitoreo(ctx context.Context, onCambio func(EstadoRed)) {
	s.mu.Lock()
	s.onCambio = onCambio
	monitorCtx, cancel := context.WithCancel(ctx)
	s.cancel = cancel
	s.mu.Unlock()

	// Verificación inicial inmediata
	go func() {
		s.VerificarEstado()

		ticker := time.NewTicker(3 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-monitorCtx.Done():
				return
			case <-ticker.C:
				s.VerificarEstado()
			}
		}
	}()
}

// DetenerMonitoreo cancela el ciclo de monitoreo
func (s *NetworkService) DetenerMonitoreo() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.cancel != nil {
		s.cancel()
		s.cancel = nil
	}
}

// ObtenerEstadoActual devuelve la última lectura de estado en memoria
func (s *NetworkService) ObtenerEstadoActual() EstadoRed {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.ultimoEstado
}

// VerificarEstado realiza la detección activa y prueba de conectividad
func (s *NetworkService) VerificarEstado() EstadoRed {
	tipo, nombre, ipLocal, gw := detectarInterfazActiva()

	ahora := time.Now().Format("15:04:05")
	var nuevo EstadoRed

	if tipo == ConexionNinguna || ipLocal == "" {
		nuevo = EstadoRed{
			Online:         false,
			TipoConexion:   ConexionNinguna,
			NombreInterfaz: "",
			IPLocal:        "",
			Gateway:        "",
			TieneInternet:  false,
			LatenciaMs:     0,
			Mensaje:        "Modo Offline (Sin red detectada)",
			UltimaRevision: ahora,
		}
	} else {
		// Interfaz activa detectada. Ahora probar salida / internet
		tieneInternet, latencia := probarConectividadExterna()

		mensaje := ""
		switch tipo {
		case ConexionCableada:
			if tieneInternet {
				mensaje = fmt.Sprintf("Conectado por Cable (Ethernet: %s)", nombre)
			} else {
				mensaje = fmt.Sprintf("Red Cableada Local (Sin Internet: %s)", nombre)
			}
		case ConexionInalambrica:
			if tieneInternet {
				mensaje = fmt.Sprintf("Conectado por Wi-Fi (%s)", nombre)
			} else {
				mensaje = fmt.Sprintf("Wi-Fi Local (Sin Internet: %s)", nombre)
			}
		case ConexionCelular:
			mensaje = fmt.Sprintf("Conectado por Banda Ancha Móvil (%s)", nombre)
		default:
			if tieneInternet {
				mensaje = fmt.Sprintf("Conectado a Red (%s)", nombre)
			} else {
				mensaje = fmt.Sprintf("Red Local (%s)", nombre)
			}
		}

		nuevo = EstadoRed{
			Online:         true,
			TipoConexion:   tipo,
			NombreInterfaz: nombre,
			IPLocal:        ipLocal,
			Gateway:        gw,
			TieneInternet:  tieneInternet,
			LatenciaMs:     latencia,
			Mensaje:        mensaje,
			UltimaRevision: ahora,
		}
	}

	s.mu.Lock()
	anterior := s.ultimoEstado
	s.ultimoEstado = nuevo
	callback := s.onCambio
	s.mu.Unlock()

	// Si hubo cambio relevante en el estado, notificar al callback
	if callback != nil && (anterior.Online != nuevo.Online ||
		anterior.TipoConexion != nuevo.TipoConexion ||
		anterior.IPLocal != nuevo.IPLocal ||
		anterior.TieneInternet != nuevo.TieneInternet) {
		callback(nuevo)
	}

	return nuevo
}

// probarConectividadExterna intenta abrir un socket TCP a servidores DNS públicos ultra-rápidos
func probarConectividadExterna() (bool, int64) {
	destinos := []string{"1.1.1.1:53", "8.8.8.8:53"}
	timeout := 750 * time.Millisecond

	for _, d := range destinos {
		start := time.Now()
		conn, err := net.DialTimeout("tcp", d, timeout)
		if err == nil {
			_ = conn.Close()
			latencia := time.Since(start).Milliseconds()
			return true, latencia
		}
	}

	return false, 0
}
