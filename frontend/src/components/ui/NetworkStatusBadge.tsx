import React, { useState, useRef, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Network,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Globe
} from 'lucide-react';
import type { EstadoRed } from '../../types/network';

interface NetworkStatusBadgeProps {
  estadoRed: EstadoRed;
  forzarOffline: boolean;
  onToggleForzarOffline: (forzar: boolean) => void;
  onReverificar: () => Promise<void>;
  reverificando: boolean;
}

export const NetworkStatusBadge: React.FC<NetworkStatusBadgeProps> = ({
  estadoRed,
  forzarOffline,
  onToggleForzarOffline,
  onReverificar,
  reverificando,
}) => {
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownAbierto(false);
      }
    };
    if (dropdownAbierto) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownAbierto]);

  const esOnlineReal = estadoRed.online && !forzarOffline;

  // Icono principal según el tipo de adaptador detectado
  const renderIcono = (className = 'w-3.5 h-3.5') => {
    if (forzarOffline || !estadoRed.online) {
      return <WifiOff className={className} />;
    }
    switch (estadoRed.tipo_conexion) {
      case 'CABLEADA':
        return <Network className={className} />;
      case 'INALAMBRICA':
        return <Wifi className={className} />;
      case 'CELULAR':
        return <Radio className={className} />;
      default:
        return <Globe className={className} />;
    }
  };

  // Etiqueta resumida para la barra superior
  const getEtiquetaResumen = () => {
    if (forzarOffline) {
      return 'Modo Offline (Forzado)';
    }
    if (!estadoRed.online) {
      return 'Modo Offline (Sin red)';
    }
    const ipCorta = estadoRed.ip_local ? ` (${estadoRed.ip_local})` : '';
    switch (estadoRed.tipo_conexion) {
      case 'CABLEADA':
        return `Cableada${ipCorta}`;
      case 'INALAMBRICA':
        return `Wi-Fi${ipCorta}`;
      case 'CELULAR':
        return `Móvil${ipCorta}`;
      default:
        return `Online${ipCorta}`;
    }
  };

  // Clases visuales del botón principal
  const getEstilosBoton = () => {
    if (forzarOffline) {
      return 'bg-amber-950/70 border-amber-500/50 text-amber-300 hover:bg-amber-900/60 shadow-amber-950/40';
    }
    if (!estadoRed.online) {
      return 'bg-slate-900/80 border-slate-600/60 text-slate-300 hover:bg-slate-800/80 shadow-slate-950/40';
    }
    if (estadoRed.tipo_conexion === 'CABLEADA') {
      return 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/70 shadow-emerald-950/40';
    }
    if (estadoRed.tipo_conexion === 'INALAMBRICA') {
      return 'bg-teal-950/80 border-teal-500/60 text-teal-300 hover:bg-teal-900/70 shadow-teal-950/40';
    }
    return 'bg-blue-950/80 border-blue-500/60 text-blue-300 hover:bg-blue-900/70 shadow-blue-950/40';
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Botón Badge en la barra de estado */}
      <button
        type="button"
        onClick={() => setDropdownAbierto(!dropdownAbierto)}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border shadow-inner ${getEstilosBoton()}`}
        title="Clic para ver detalles de conexión de red"
      >
        {/* Indicador pulsante */}
        <span className="relative flex h-2 w-2">
          {esOnlineReal ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          )}
        </span>

        {renderIcono()}
        <span>{getEtiquetaResumen()}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${dropdownAbierto ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover de Diagnóstico de Red */}
      {dropdownAbierto && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white text-slate-800 shadow-2xl border border-slate-200 z-50 p-4 space-y-3.5 animate-fadeIn">
          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${esOnlineReal ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {renderIcono('w-4 h-4')}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Diagnóstico de Red</h4>
                <p className="text-[10px] text-slate-500">Detección automática de hardware</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onReverificar}
              disabled={reverificando}
              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Volver a diagnosticar la red"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reverificando ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>

          {/* Estado General */}
          <div
            className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              esOnlineReal
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}
          >
            {esOnlineReal ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <p className="font-bold">
                {forzarOffline
                  ? 'Modo Offline Forzado Manualmente'
                  : estadoRed.online
                  ? estadoRed.mensaje
                  : 'Sin Red Detectada (Modo Offline Seguro)'}
              </p>
              <p className="text-[11px] opacity-80">
                {forzarOffline
                  ? 'La detección automática está en pausa. Las solicitudes se encriptan y guardan en cola local SQLite.'
                  : estadoRed.online
                  ? 'La estación detecta enlace de red activo para comunicación con CompilaRC.'
                  : 'No se detecta cable de red ni red Wi-Fi activa. El sistema opera de forma 100% autónoma.'}
              </p>
            </div>
          </div>

          {/* Grilla de Detalles Técnicos */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 block font-medium">Tecnología:</span>
              <span className="font-semibold text-slate-800">
                {estadoRed.tipo_conexion === 'CABLEADA'
                  ? '🔌 Cableada (Ethernet)'
                  : estadoRed.tipo_conexion === 'INALAMBRICA'
                  ? '📶 Inalámbrica (Wi-Fi)'
                  : estadoRed.tipo_conexion === 'CELULAR'
                  ? '📱 Móvil / 4G'
                  : 'Desconectado'}
              </span>
            </div>

            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 block font-medium">Adaptador:</span>
              <span className="font-semibold text-slate-800 truncate block" title={estadoRed.nombre_interfaz || 'N/A'}>
                {estadoRed.nombre_interfaz || 'Ninguno'}
              </span>
            </div>

            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 block font-medium">Dirección IP Local:</span>
              <span className="font-semibold font-mono text-slate-800">
                {estadoRed.ip_local || 'Sin IP'}
              </span>
            </div>

            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-slate-400 block font-medium">Puerta de Enlace:</span>
              <span className="font-semibold font-mono text-slate-800">
                {estadoRed.gateway || 'N/A'}
              </span>
            </div>

            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 col-span-2 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block font-medium">Salida a Internet / Central:</span>
                <span className="font-semibold text-slate-800">
                  {estadoRed.tiene_internet
                    ? `Acceso Verificado (${estadoRed.latencia_ms}ms)`
                    : estadoRed.online
                    ? 'Red Local Intranet (Sin salida a Internet)'
                    : 'Sin Conexión'}
                </span>
              </div>
              {estadoRed.ultima_revision && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {estadoRed.ultima_revision}
                </span>
              )}
            </div>
          </div>

          {/* Toggle de Anulación Manual */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="space-y-0.5">
              <label htmlFor="forzar-offline-toggle" className="text-xs font-bold text-slate-800 cursor-pointer block">
                Forzar Modo Offline
              </label>
              <span className="text-[10px] text-slate-500 block">
                Ignorar la red detectada y guardar todo localmente
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="forzar-offline-toggle"
                type="checkbox"
                checked={forzarOffline}
                onChange={(e) => onToggleForzarOffline(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
