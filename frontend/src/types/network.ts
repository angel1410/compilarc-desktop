export type TipoConexionRed = 'CABLEADA' | 'INALAMBRICA' | 'CELULAR' | 'OTRO' | 'DESCONECTADO';

export interface EstadoRed {
  online: boolean;
  tipo_conexion: TipoConexionRed;
  nombre_interfaz: string;
  ip_local: string;
  gateway: string;
  tiene_internet: boolean;
  latencia_ms: number;
  mensaje: string;
  ultima_revision: string;
}
