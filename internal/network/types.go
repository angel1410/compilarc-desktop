package network

// TipoConexion define la tecnología de conexión de red detectada
type TipoConexion string

const (
	ConexionCableada    TipoConexion = "CABLEADA"     // Ethernet (LAN)
	ConexionInalambrica TipoConexion = "INALAMBRICA"  // Wi-Fi (WLAN)
	ConexionCelular     TipoConexion = "CELULAR"      // 4G/LTE/Banda ancha móvil
	ConexionOtro        TipoConexion = "OTRO"         // VPN, Loopback, virtual
	ConexionNinguna     TipoConexion = "DESCONECTADO" // Sin red activa
)

// EstadoRed representa el diagnóstico en tiempo real de la conectividad
type EstadoRed struct {
	Online         bool         `json:"online"`          // true si hay interfaz activa con IP
	TipoConexion   TipoConexion `json:"tipo_conexion"`   // "CABLEADA", "INALAMBRICA", "CELULAR", "DESCONECTADO"
	NombreInterfaz string       `json:"nombre_interfaz"` // Ej: "Ethernet 1", "Wi-Fi", "eth0", "wlp2s0"
	IPLocal        string       `json:"ip_local"`        // Ej: "192.168.1.100"
	Gateway        string       `json:"gateway"`         // Puerta de enlace predeterminada
	TieneInternet  bool         `json:"tiene_internet"`  // true si hay salida comprobada (DNS/Web)
	LatenciaMs     int64        `json:"latencia_ms"`     // Milisegundos de respuesta
	Mensaje        string       `json:"mensaje"`         // Descripción legible para el operador
	UltimaRevision string       `json:"ultima_revision"` // Hora de la última comprobación
}
