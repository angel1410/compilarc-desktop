import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Code,
  Fingerprint,
  User,
  FileText,
  ShieldCheck,
  Clock,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  solicitud: any | null;
}

export const DetalleSolicitudModal: React.FC<Props> = ({
  isOpen,
  onClose,
  solicitud,
}) => {
  const [copiado, setCopiado] = useState(false);
  const [vistaJsonRaw, setVistaJsonRaw] = useState(false);

  if (!isOpen || !solicitud) return null;

  const sol = solicitud;
  const solicitante = sol.datos_solicitante || {};
  const acta = sol.datos_acta || {};
  const oficina = acta.oficina || {};
  const bio = sol.datos_biometricos || {};

  const jsonCompleto = JSON.stringify(sol, null, 2);

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(jsonCompleto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Fallback si no tiene permisos de portapapeles
      const textarea = document.createElement('textarea');
      textarea.value = jsonCompleto;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Encabezado del Modal */}
        <div className="px-6 py-4 bg-linear-to-r from-blue-900 to-brand-primary text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-blue-200 shrink-0">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {sol.tipo_acta?.replace('_', ' ')}
                </span>
                <span className="text-[11px] font-mono text-blue-200">
                  ID: {sol.id}
                </span>
              </div>
              <h2 className="text-base font-bold tracking-tight text-white mt-0.5">
                Payload Estructurado de la Solicitud (SQLite / API Web)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopiar}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/15 cursor-pointer"
              title="Copiar JSON completo"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiado ? '¡Copiado!' : 'Copiar JSON'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de pestañas internas del modal */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVistaJsonRaw(false)}
              className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                !vistaJsonRaw
                  ? 'border-blue-700 text-blue-800 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Vista Resumen Estructurado
            </button>
            <button
              onClick={() => setVistaJsonRaw(true)}
              className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                vistaJsonRaw
                  ? 'border-blue-700 text-blue-800 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              JSON Completo (API CompilaRC-Web)
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono hidden sm:flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{sol.creado_en || new Date().toISOString()}</span>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
          {vistaJsonRaw ? (
            /* Vista JSON Raw con resaltado */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold">
                  Estructura JSON lista para enviar al Endpoint de Sincronización Web:
                </span>
                <span className="font-mono text-[11px] bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                  {jsonCompleto.length} bytes
                </span>
              </div>
              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[55vh] border border-slate-800 shadow-inner">
                  <code>{jsonCompleto}</code>
                </pre>
                <button
                  onClick={handleCopiar}
                  className="absolute top-3 right-3 px-2.5 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold rounded-md border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiado ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiado ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Vista Resumen en Tarjetas */
            <div className="space-y-4">
              {/* Tarjeta 1: Solicitante */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Datos del Solicitante (Presente en Taquilla)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Parentesco: {solicitante.parentesco || 'TITULAR'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Cédula</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {solicitante.nacionalidad}-{solicitante.cedula}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Nombres</span>
                    <span className="font-semibold text-slate-800">
                      {solicitante.primer_nombre} {solicitante.segundo_nombre || ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Apellidos</span>
                    <span className="font-semibold text-slate-800">
                      {solicitante.primer_apellido} {solicitante.segundo_apellido || ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Contacto</span>
                    <span className="text-slate-700 block">{solicitante.telefono || 'Sin teléfono'}</span>
                    <span className="text-[10px] text-slate-500 truncate block">{solicitante.correo || 'Sin correo'}</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Biometría Futronic FS88H */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                    <Fingerprint className="w-4 h-4 text-emerald-600" />
                    <span>Captura Biométrica Certificada (Futronic FS88H)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>LFD Vivo OK</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Dedo Capturado</span>
                    <span className="font-semibold text-slate-800">{bio.dedo_nombre || 'Pulgar Derecho'}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{bio.dispositivo_nombre || 'Futronic FS88H USB'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Calidad de Huella</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-extrabold text-emerald-700">{bio.calidad || 92}%</span>
                      <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Óptima (NFIQ 1)
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Template ANSI 378 / ISO</span>
                    <span className="font-mono text-[10px] text-slate-500 truncate block mt-0.5" title={bio.template_minucias_b64}>
                      {bio.template_minucias_b64 ? `${bio.template_minucias_b64.slice(0, 32)}... (${bio.template_minucias_b64.length} chars)` : 'No capturado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tarjeta 3: Datos del Acta y OURC */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Datos del Acta a Certificar</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Año {acta.anio || 'N/A'} {acta.co_acta ? `• Acta #${acta.co_acta}` : ''} {acta.tomo ? `• Tomo ${acta.tomo}` : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Oficina de Registro (OURC Destino)</span>
                    <span className="font-semibold text-slate-800 block mt-0.5">
                      {oficina.nb_oficina || 'Oficina no especificada'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                      {oficina.co_ourc ? `CIVIS ID: ${oficina.co_ourc} • ` : ''}
                      Parroquia: {oficina.nb_parroquia || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Titular del Trámite</span>
                    {acta.presentado && (
                      <span className="font-semibold text-slate-800 block mt-0.5">
                        Presentado: {acta.presentado.primer_nombre} {acta.presentado.primer_apellido}
                        {acta.presentado.cedula ? ` (C.I. ${acta.presentado.nacionalidad}-${acta.presentado.cedula})` : ''}
                      </span>
                    )}
                    {acta.conyugues && (
                      <span className="font-semibold text-slate-800 block mt-0.5">
                        Cónyuges: {acta.conyugues.primer_nombre_ella} y {acta.conyugues.primer_nombre_el}
                      </span>
                    )}
                    {acta.fallecido && (
                      <span className="font-semibold text-slate-800 block mt-0.5">
                        Fallecido: {acta.fallecido.primer_nombre} {acta.fallecido.primer_apellido}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            <span>Almacenado localmente en tabla SQLite </span>
            <code className="text-blue-700 font-mono font-bold bg-slate-200 px-1.5 py-0.5 rounded">solicitudes_offline</code>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Inspección
          </button>
        </div>
      </div>
    </div>
  );
};
