import React, { useState } from 'react';
import { Fingerprint, CheckCircle2, ShieldCheck, RefreshCw, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onHuellaCapturada: (huella: any) => void;
  nombreTitular?: string;
  cedulaTitular?: string;
}

export const BiometricCaptureModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onHuellaCapturada,
  nombreTitular = 'Ciudadano Solicitante',
  cedulaTitular = 'V-XXXXXXXX',
}) => {
  const [dedoSeleccionado, setDedoSeleccionado] = useState<string>('Pulgar Derecho');
  const [capturando, setCapturando] = useState<boolean>(false);
  const [huellaData, setHuellaData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCapturar = async () => {
    setCapturando(true);
    setError(null);
    try {
      const wailsApp = (window as any).go?.main?.App;
      let resultado: any = null;

      if (wailsApp && typeof wailsApp.CapturarHuella === 'function') {
        resultado = await wailsApp.CapturarHuella(dedoSeleccionado);
      } else {
        // Simulación en navegador dev
        await new Promise((resolve) => setTimeout(resolve, 800));
        resultado = {
          capturado: true,
          calidad: 96,
          lfd_detectado: true,
          template_minucias_b64: 'TUlCR0RBSUJBQ...[ISO 19794-2 Template]',
          imagen_preview_b64: '',
          dedo_nombre: dedoSeleccionado,
          dispositivo_nombre: 'Futronic FS88H (USB 2.0 PIV)',
          timestamp: new Date().toISOString(),
        };
      }

      setHuellaData(resultado);
    } catch (err: any) {
      setError(err?.message || 'Error al comunicarse con el sensor Futronic FS88H.');
    } finally {
      setCapturando(false);
    }
  };

  const handleConfirmar = () => {
    if (huellaData) {
      onHuellaCapturada(huellaData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Cabecera Modal */}
        <div className="bg-[#0f2a66] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Fingerprint className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Captura Biométrica Dactilar</h3>
              <p className="text-xs text-blue-200">Dispositivo: Futronic FS88H (FIPS 201 / PIV)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 space-y-5">
          {/* Identificación del Ciudadano */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Titular</span>
              <span className="text-xs font-bold text-slate-800 block">{nombreTitular}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Cédula</span>
              <span className="text-xs font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {cedulaTitular}
              </span>
            </div>
          </div>

          {/* Selector de Dedo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Dedo a Capturar:
            </label>
            <select
              value={dedoSeleccionado}
              onChange={(e) => setDedoSeleccionado(e.target.value)}
              className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="Pulgar Derecho">Pulgar Derecho (Predeterminado CNE)</option>
              <option value="Índice Derecho">Índice Derecho</option>
              <option value="Medio Derecho">Medio Derecho</option>
              <option value="Pulgar Izquierdo">Pulgar Izquierdo</option>
              <option value="Índice Izquierdo">Índice Izquierdo</option>
            </select>
          </div>

          {/* Área de Visualización del Sensor */}
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50/50 min-h-[180px]">
            {capturando ? (
              <div className="flex flex-col items-center space-y-3">
                <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
                <span className="text-xs font-bold text-slate-700">Coloque el dedo sobre el sensor Futronic...</span>
                <span className="text-[11px] text-slate-500">Detectando dedo vivo (LFD Infrarrojo)...</span>
              </div>
            ) : huellaData ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-20 h-24 rounded-xl border border-blue-200 bg-blue-50/80 flex items-center justify-center p-2 shadow-inner">
                  {huellaData.imagen_preview_b64 ? (
                    <img src={huellaData.imagen_preview_b64} alt="Huella" className="max-h-full object-contain" />
                  ) : (
                    <Fingerprint className="w-14 h-14 text-blue-600 animate-pulse" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Calidad de Imagen: {huellaData.calidad}% (500 DPI)
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Minucias extraídas conforme a norma ISO/IEC 19794-2
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2 text-center">
                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs text-slate-400">
                  <Fingerprint className="w-12 h-12" />
                </div>
                <span className="text-xs font-semibold text-slate-600">Presione 'Capturar Huella' para iniciar</span>
                <span className="text-[11px] text-slate-400">Verifique que el sensor FS88H esté conectado por USB</span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCapturar}
              disabled={capturando}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${capturando ? 'animate-spin' : ''}`} />
              {huellaData ? 'Volver a Escanear' : 'Capturar Huella'}
            </button>

            <button
              onClick={handleConfirmar}
              disabled={!huellaData || capturando}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0f2a66] hover:bg-[#0a1c44] text-white transition-all shadow-sm cursor-pointer disabled:opacity-40"
            >
              Vincular a la Solicitud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
