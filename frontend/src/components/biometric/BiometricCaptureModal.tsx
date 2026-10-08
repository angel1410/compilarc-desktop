import React, { useState } from 'react';
import { Fingerprint, CheckCircle2, ShieldCheck, RefreshCw, X, AlertTriangle, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onHuellaCapturada: (huella: any) => void;
  nombreTitular?: string;
  cedulaTitular?: string;
  modoOnline?: boolean;
  servidorURL?: string;
  onAbrirConfigServidor?: () => void;
  sensorConectado?: boolean;
}

export const BiometricCaptureModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onHuellaCapturada,
  nombreTitular = 'Ciudadano Solicitante',
  cedulaTitular = 'V-XXXXXXXX',
  modoOnline = true,
  servidorURL = 'http://192.168.213.42:8080',
  onAbrirConfigServidor,
  sensorConectado = true,
}) => {
  const [dedoSeleccionado, setDedoSeleccionado] = useState<string>('Pulgar Derecho');
  const [capturando, setCapturando] = useState<boolean>(false);
  const [validandoPIAC, setValidandoPIAC] = useState<boolean>(false);
  const [huellaData, setHuellaData] = useState<any>(null);
  const [validacionPIAC, setValidacionPIAC] = useState<{
    status: 'idle' | 'verified' | 'rejected' | 'offline' | 'error';
    score?: number;
    mensaje?: string;
    transaccion_id?: string;
  }>({ status: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const [fondoBlanco, setFondoBlanco] = useState<boolean>(true);

  const cedulaInvalida = !cedulaTitular || cedulaTitular === 'V-XXXXXXXX' || cedulaTitular.includes('XXXXXXXX') || cedulaTitular.trim() === '';

  if (!isOpen) return null;

  const verificarConPIAC = async (muestra: any) => {
    if (!modoOnline) {
      setValidacionPIAC({
        status: 'offline',
        mensaje: 'Estación en Modo Offline: la huella se resguardará localmente con cifrado AES-256 para validación diferida al sincronizar el lote.',
      });
      setHuellaData({
        ...muestra,
        offline: true,
        verificado_piac: false,
      });
      return;
    }

    setValidandoPIAC(true);
    setError(null);
    try {
      const wailsApp = (window as any).go?.main?.App;
      let res: any = null;

      if (wailsApp && typeof wailsApp.VerificarHuellaOnline === 'function') {
        res = await wailsApp.VerificarHuellaOnline(cedulaTitular, muestra.sample_wsq, muestra.dedo);
      } else {
        // Fallback para entorno de desarrollo en navegador
        const resp = await fetch('/api/v1/desktop/biometric/verificar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'P!Y2lFcqAiV1E][p',
          },
          body: JSON.stringify({
            cedula: cedulaTitular,
            sample_wsq: muestra.sample_wsq,
            dedo: muestra.dedo,
          }),
        });
        res = await resp.json();
      }

      if (res && res.match === true) {
        setValidacionPIAC({
          status: 'verified',
          score: res.score,
          transaccion_id: res.transaccion_id,
          mensaje: res.mensaje || 'Identidad dactilar verificada con éxito ante CNE/PIAC.',
        });
        setHuellaData({
          ...muestra,
          verificado_piac: true,
          score_piac: res.score,
          transaccion_piac: res.transaccion_id,
          offline: false,
        });
      } else if (res && res.online === false) {
        setValidacionPIAC({
          status: 'offline',
          mensaje: res.mensaje || 'Estación en Modo Offline.',
        });
        setHuellaData({
          ...muestra,
          offline: true,
          verificado_piac: false,
        });
      } else if (res && res.resultado === 'ERROR_CNE_SERVICIO') {
        setValidacionPIAC({
          status: 'error',
          mensaje: res.mensaje || 'El servicio del CNE/PIAC reportó un error temporal. Por favor intente capturar nuevamente.',
        });
        setHuellaData({
          ...muestra,
          verificado_piac: false,
        });
      } else if (res && (res.resultado === 'ERROR_COMUNICACION' || (res.error && !res.resultado))) {
        const errorMsg = res.mensaje || res.error || '';
        const esFalloConexionLocal = errorMsg.includes('connection refused') ||
                                     errorMsg.includes('no route to host') ||
                                     errorMsg.includes('cliente de sincronización no inicializado');

        setValidacionPIAC({
          status: 'error',
          mensaje: esFalloConexionLocal
            ? `No se pudo conectar con el Servidor Central (${servidorURL}). Verifique que la IP del servidor esté configurada correctamente.`
            : `Servidor Central conectado, pero CNE/PIAC reportó: ${errorMsg}`,
        });
        setHuellaData({
          ...muestra,
          verificado_piac: false,
        });
      } else {
        setValidacionPIAC({
          status: 'rejected',
          score: res?.score ?? 0,
          mensaje: res?.mensaje || `Puntaje bajo (${res?.score ?? 0}/100): Presión o superficie insuficiente ante el CNE. Por favor apoye con mayor firmeza el pulpejo del dedo en el centro del cristal.`,
        });
        setHuellaData({
          ...muestra,
          verificado_piac: false,
          score_piac: res?.score ?? 0,
          offline: false,
        });
      }
    } catch (err: any) {
      setValidacionPIAC({
        status: 'error',
        mensaje: err?.message || 'Error de comunicación con el servicio biométrico CNE/PIAC.',
      });
      setHuellaData({
        ...muestra,
        verificado_piac: false,
      });
    } finally {
      setValidandoPIAC(false);
    }
  };

  const handleCapturar = async () => {
    if (cedulaInvalida) {
      setError('Cédula no válida: Se requiere una cédula válida del solicitante verificada en Archivo Cedular (AC) para capturar y certificar la huella con CNE/PIAC.');
      return;
    }
    if (!sensorConectado) {
      setError('El sensor biométrico Futronic FS88H no está detectado. Conéctelo a un puerto USB para capturar.');
      return;
    }
    setCapturando(true);
    setError(null);
    setValidacionPIAC({ status: 'idle' });
    try {
      const wailsApp = (window as any).go?.main?.App;
      let resultado: any = null;

      if (wailsApp && typeof wailsApp.CapturarHuella === 'function') {
        resultado = await wailsApp.CapturarHuella(dedoSeleccionado, cedulaTitular);
      } else {
        // Simulación en navegador dev
        await new Promise((resolve) => setTimeout(resolve, 800));
        resultado = {
          capturado: true,
          calidad: 96,
          lfd_detectado: true,
          template_minucias_b64: 'TUlCR0RBSUJBQ...[ISO 19794-2 Template]',
          sample_wsq: '',
          imagen_preview_b64: '',
          dedo_nombre: dedoSeleccionado,
          dedo: dedoSeleccionado === 'Índice Derecho'
            ? 'RightIndex'
            : dedoSeleccionado === 'Pulgar Izquierdo'
            ? 'LeftThumb'
            : dedoSeleccionado === 'Índice Izquierdo'
            ? 'LeftIndex'
            : 'RightThumb',
          dispositivo_nombre: 'Futronic FS88H (USB 2.0 PIV)',
          timestamp: new Date().toISOString(),
        };
      }

      setHuellaData(resultado);
      await verificarConPIAC(resultado);
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

  const puedeContinuar =
    Boolean(huellaData) &&
    !capturando &&
    !validandoPIAC &&
    (!modoOnline || validacionPIAC.status === 'verified' || validacionPIAC.status === 'offline');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md sm:max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] my-auto">
        {/* Cabecera Modal - Fija */}
        <div className="bg-brand-primary text-white px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-white/10 text-white">
              <Fingerprint className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight">Captura y Validación Biométrica</h3>
              <p className="text-[11px] sm:text-xs text-blue-200">
                Sensor: Futronic FS88H (PIV 500 DPI) • {modoOnline ? 'Validación Online CNE/PIAC' : 'Modo Offline'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal - Con scroll si la pantalla es pequeña */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
          {/* Identificación del Ciudadano */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
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

          {cedulaInvalida && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5 shadow-2xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold block">Cédula no Validada por Archivo Cedular</span>
                <span className="text-[11px] text-amber-700">
                  La nacionalidad y cédula son datos obligatorios para la verificación biométrica con CNE/PIAC. Debe ingresar y validar la cédula del solicitante en el formulario antes de capturar la muestra.
                </span>
              </div>
            </div>
          )}

          {!sensorConectado && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 shadow-2xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <span className="font-bold block">Sensor Futronic FS88H Desconectado</span>
                <span className="text-[11px] text-rose-700">
                  El sistema no detecta el escáner biométrico en los puertos USB. Conecte el lector para habilitar la captura dactilar.
                </span>
              </div>
            </div>
          )}

          {/* Selector de Dedo */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Dedo a Capturar:
            </label>
            <select
              value={dedoSeleccionado}
              onChange={(e) => setDedoSeleccionado(e.target.value)}
              disabled={capturando || validandoPIAC}
              className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
            >
              <option value="Pulgar Derecho">Pulgar Derecho (Predeterminado CNE)</option>
              <option value="Índice Derecho">Índice Derecho</option>
              <option value="Pulgar Izquierdo">Pulgar Izquierdo</option>
              <option value="Índice Izquierdo">Índice Izquierdo</option>
            </select>
          </div>

          {/* Área de Visualización del Sensor y Estado de Validación */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center bg-slate-50/50 min-h-36">
            {capturando ? (
              <div className="flex flex-col items-center space-y-2 py-4">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <span className="text-xs font-bold text-slate-700">Coloque el dedo sobre el sensor Futronic...</span>
                <span className="text-[11px] text-slate-500">Detectando dedo vivo (LFD Infrarrojo)...</span>
              </div>
            ) : validandoPIAC ? (
              <div className="flex flex-col items-center space-y-2 py-4">
                <ShieldCheck className="w-8 h-8 text-blue-600 animate-pulse" />
                <span className="text-xs font-bold text-blue-900">Validando identidad con CNE / PIAC en tiempo real...</span>
                <span className="text-[11px] text-slate-500">Consultando base biométrica electoral central...</span>
              </div>
            ) : huellaData ? (
              <div className="flex flex-col items-center space-y-2 w-full">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-36 h-48 sm:w-40 sm:h-52 rounded-xl border-2 flex items-center justify-center p-2 shadow-md overflow-hidden transition-all ${
                      fondoBlanco
                        ? 'bg-white border-slate-300 ring-2 ring-slate-100'
                        : 'bg-slate-950 border-slate-700 ring-2 ring-slate-800'
                    }`}
                  >
                    {huellaData.imagen_preview_b64 ? (
                      <img
                        src={huellaData.imagen_preview_b64}
                        alt="Huella Dactilar"
                        className={`max-h-full max-w-full object-contain rounded-md shadow-2xs transition-all ${
                          !fondoBlanco ? 'filter invert' : ''
                        }`}
                      />
                    ) : (
                      <Fingerprint className="w-16 h-16 text-blue-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFondoBlanco(!fondoBlanco)}
                    className="text-[10px] text-slate-500 hover:text-blue-700 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                    title="Alternar entre Fondo Blanco (Estándar CNE) y Fondo Oscuro"
                  >
                    <span>{fondoBlanco ? '✓ Invert Color: Fondo Blanco (CNE)' : 'Fondo Oscuro'}</span>
                    <span className="text-blue-600 underline">Cambiar</span>
                  </button>
                </div>

                {/* Badge de Validación CNE PIAC */}
                {validacionPIAC.status === 'verified' && (
                  <div className="w-full bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 flex items-start gap-2 text-left">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-900">Huella Verificada con Éxito (CNE PIAC)</span>
                        <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded">
                          Score: {validacionPIAC.score}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-700 leading-tight">
                        La huella capturada coincide plenamente con el titular electoral. Puede continuar la solicitud del acta.
                      </p>
                    </div>
                  </div>
                )}

                {validacionPIAC.status === 'rejected' && (
                  <div className="w-full bg-red-50 border border-red-300 rounded-xl p-2.5 flex items-start gap-2 text-left">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-red-900">No Verificado por CNE PIAC</span>
                        <span className="text-[10px] font-bold bg-red-200 text-red-900 px-1.5 py-0.2 rounded">
                          Score: {validacionPIAC.score}
                        </span>
                      </div>
                      <p className="text-[11px] text-red-700 leading-tight">
                        {validacionPIAC.mensaje || 'Discrepancia dactilar: la muestra no coincide con la cédula del titular.'}
                      </p>
                      <span className="text-[10px] font-semibold text-red-600 block mt-0.5">
                        Por favor vuelva a escanear o verifique que el número de cédula sea correcto.
                      </span>
                    </div>
                  </div>
                )}

                {validacionPIAC.status === 'offline' && (
                  <div className="w-full bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-start gap-2 text-left">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-blue-900 block">Modo Offline Activo</span>
                      <p className="text-[11px] text-blue-700 leading-tight">
                        Muestra dactilar capturada y resguardada con cifrado seguro para transmisión diferida.
                      </p>
                    </div>
                  </div>
                )}

                {validacionPIAC.status === 'error' && (
                  <div className="w-full bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-start gap-2 text-left">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <span className="text-xs font-bold text-amber-900 block">
                        {validacionPIAC.mensaje?.includes('CNE') || validacionPIAC.mensaje?.includes('PIAC')
                          ? 'Aviso del Servicio Biométrico CNE / PIAC'
                          : 'Fallo de Comunicación con Servidor Central'}
                      </span>
                      <p className="text-[11px] text-amber-800 leading-tight">
                        {validacionPIAC.mensaje}
                      </p>
                      {onAbrirConfigServidor && !validacionPIAC.mensaje?.includes('CNE') && !validacionPIAC.mensaje?.includes('PIAC') && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onAbrirConfigServidor();
                          }}
                          className="mt-1 px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg text-[10px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          Configurar Dirección IP del Servidor
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2.5 text-[10px] text-slate-500 pt-0.5">
                  <span className="font-semibold text-slate-700">Calidad: {huellaData.calidad}% (500 DPI)</span>
                  <span>•</span>
                  <span>Norma ISO/IEC 19794-2</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-1.5 text-center py-4">
                <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-xs text-slate-400">
                  <Fingerprint className="w-10 h-10" />
                </div>
                <span className="text-xs font-semibold text-slate-600">Presione 'Capturar Huella' para iniciar</span>
                <span className="text-[10px] text-slate-400">
                  {modoOnline
                    ? 'Al capturar, se validará de inmediato contra el registro electoral CNE'
                    : 'La huella se guardará en lote seguro local'}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Botones de Acción - Fijos abajo */}
        <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCapturar}
              disabled={!sensorConectado || capturando || validandoPIAC || cedulaInvalida}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                sensorConectado && !capturando && !validandoPIAC && !cedulaInvalida
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
              }`}
              title={
                cedulaInvalida
                  ? 'Cédula no validada en Archivo Cedular (AC)'
                  : sensorConectado
                  ? 'Capturar huella dactilar'
                  : 'Sensor Futronic FS88H desconectado en puerto USB'
              }
            >
              <RefreshCw className={`w-3.5 h-3.5 ${capturando || validandoPIAC ? 'animate-spin' : ''}`} />
              {!sensorConectado
                ? 'Sensor Desconectado'
                : cedulaInvalida
                ? 'Cédula Requerida'
                : huellaData
                ? 'Volver a Escanear'
                : 'Capturar Huella'}
            </button>

            <button
              onClick={handleConfirmar}
              disabled={!puedeContinuar}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
                puedeContinuar
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-300 text-slate-500 opacity-50 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {validacionPIAC.status === 'verified'
                ? 'Continuar Solicitud de Acta'
                : validacionPIAC.status === 'offline'
                ? 'Continuar (Modo Offline)'
                : 'Vincular a la Solicitud'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
