import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, ExternalLink } from 'lucide-react';

export interface ToastData {
  tipo: 'success' | 'info' | 'warning' | 'error';
  titulo: string;
  mensaje: string;
  accion?: () => void;
  textoAccion?: string;
  duracionMs?: number;
}

interface ToastProps {
  toast: ToastData | null;
  onCerrar: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onCerrar }) => {
  useEffect(() => {
    if (!toast) return;
    const duracion = toast.duracionMs || 6000;
    const timer = setTimeout(() => {
      onCerrar();
    }, duracion);
    return () => clearTimeout(timer);
  }, [toast, onCerrar]);

  if (!toast) return null;

  const getEstilos = () => {
    switch (toast.tipo) {
      case 'success':
        return {
          bg: 'bg-emerald-950/70 border-emerald-500/40 text-white shadow-emerald-950/40 ring-1 ring-emerald-400/20',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
          accent: 'text-emerald-300',
          btnBg: 'bg-emerald-600/80 hover:bg-emerald-500/90 text-white border border-emerald-400/30',
        };
      case 'error':
        return {
          bg: 'bg-rose-950/70 border-rose-500/40 text-white shadow-rose-950/40 ring-1 ring-rose-400/20',
          icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
          accent: 'text-rose-300',
          btnBg: 'bg-rose-600/80 hover:bg-rose-500/90 text-white border border-rose-400/30',
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/70 border-amber-500/40 text-white shadow-amber-950/40 ring-1 ring-amber-400/20',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
          accent: 'text-amber-300',
          btnBg: 'bg-amber-600/80 hover:bg-amber-500/90 text-white border border-amber-400/30',
        };
      default:
        return {
          bg: 'bg-slate-900/70 border-blue-500/40 text-white shadow-blue-950/40 ring-1 ring-blue-400/20',
          icon: <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />,
          accent: 'text-blue-300',
          btnBg: 'bg-blue-600/80 hover:bg-blue-500/90 text-white border border-blue-400/30',
        };
    }
  };

  const estilos = getEstilos();

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
      <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-start gap-3.5 ${estilos.bg}`}>
        {estilos.icon}
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-bold tracking-tight text-white">{toast.titulo}</h4>
          <p className="text-xs text-slate-100 leading-relaxed">{toast.mensaje}</p>
          {toast.accion && toast.textoAccion && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  toast.accion!();
                  onCerrar();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ${estilos.btnBg}`}
              >
                <span>{toast.textoAccion}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onCerrar}
          className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
