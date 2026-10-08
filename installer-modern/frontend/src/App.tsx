import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Folder,
  ArrowRight,
  ShieldCheck,
  Fingerprint,
  Database,
  X,
  Play,
} from 'lucide-react';

export default function App() {
  const [estado, setEstado] = useState<'inicio' | 'instalando' | 'completado'>('inicio');
  const [porcentaje, setPorcentaje] = useState(0);
  const [mensajeProgreso, setMensajeProgreso] = useState('Iniciando instalación...');
  const [rutaDestino, setRutaDestino] = useState('C:\\CompilaRC');
  const [crearAcceso, setCrearAcceso] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Obtener ruta por defecto desde Go
    const wailsApp = (window as any).go?.main?.App;
    if (wailsApp && typeof wailsApp.ObtenerRutaDefecto === 'function') {
      wailsApp.ObtenerRutaDefecto().then((r: string) => {
        if (r) setRutaDestino(r);
      });
    }

    // Escuchar eventos de progreso emitidos desde Go
    const wailsRuntime = (window as any).runtime;
    if (wailsRuntime && typeof wailsRuntime.EventsOn === 'function') {
      wailsRuntime.EventsOn('progreso_instalacion', (data: any) => {
        if (data.porcentaje !== undefined) setPorcentaje(data.porcentaje);
        if (data.mensaje) setMensajeProgreso(data.mensaje);
        if (data.error) setErrorMsg(data.error);
        if (data.completado) {
          setEstado('completado');
        }
      });
    }
  }, []);

  const handleInstalar = async () => {
    setEstado('instalando');
    setPorcentaje(10);
    setMensajeProgreso('Inicializando componentes...');
    setErrorMsg(null);

    const wailsApp = (window as any).go?.main?.App;
    if (wailsApp && typeof wailsApp.IniciarInstalacion === 'function') {
      try {
        await wailsApp.IniciarInstalacion(rutaDestino, crearAcceso);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Error durante la instalación');
      }
    } else {
      // Modo simulación web/dev
      let p = 15;
      const interval = setInterval(() => {
        p += 25;
        if (p >= 100) {
          clearInterval(interval);
          setPorcentaje(100);
          setMensajeProgreso('¡Instalación completada exitosamente!');
          setTimeout(() => setEstado('completado'), 400);
        } else {
          setPorcentaje(p);
          setMensajeProgreso(
            p === 40
              ? 'Desplegando componentes del ejecutable...'
              : p === 65
              ? 'Configurando base de datos SQLite y padrón...'
              : 'Generando acceso directo en el Escritorio...'
          );
        }
      }, 500);
    }
  };

  const handleIniciarApp = () => {
    const wailsApp = (window as any).go?.main?.App;
    if (wailsApp && typeof wailsApp.EjecutarAppIniciada === 'function') {
      wailsApp.EjecutarAppIniciada(rutaDestino);
    } else {
      alert('Iniciando CompilaRC Desktop en ' + rutaDestino);
    }
  };

  const handleCerrar = () => {
    const wailsApp = (window as any).go?.main?.App;
    if (wailsApp && typeof wailsApp.CerrarInstalador === 'function') {
      wailsApp.CerrarInstalador();
    } else {
      window.close();
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-[#091838] via-[#0f2a66] to-[#0a1c44] flex flex-col justify-between p-6 text-white select-none">
      {/* Barra superior con cierre e identificación institucional */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-blue-200">
            CNE • República Bolivariana de Venezuela
          </span>
        </div>
        <button
          onClick={handleCerrar}
          className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Cerrar instalador"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Cuerpo Principal */}
      <div className="flex-1 flex flex-col items-center justify-center my-4 text-center">
        {/* Isotipo 'C' CompilaRC con halo de luz */}
        <div className="relative mb-3">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-125 pointer-events-none"></div>
          <div className="w-20 h-20 rounded-2xl bg-white p-3 shadow-2xl border border-white/20 flex items-center justify-center relative z-10 mx-auto">
            <img src="/favicon.png" alt="CompilaRC" className="max-h-full max-w-full object-contain" />
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 justify-center">
          <span>CompilaRC</span>
          <span className="text-blue-300 font-light">Desktop</span>
        </h1>
        <p className="text-xs text-blue-200/80 font-medium mt-0.5">
          Estación Oficial de Captura y Registro Civil (Modo Híbrido)
        </p>

        {/* CONTENIDO VARIABLE SEGÚN ESTADO */}
        {estado === 'inicio' && (
          <div className="w-full max-w-md mt-6 space-y-4 animate-in fade-in duration-300">
            {/* Tarjeta de Destino */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 text-left flex items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Folder className="w-4 h-4 text-blue-300 shrink-0" />
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-blue-300 block font-bold">
                    Carpeta de Instalación
                  </span>
                  <span className="font-mono text-xs text-white truncate block font-semibold">
                    {rutaDestino}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-blue-200 bg-white/10 px-2 py-0.5 rounded shrink-0 font-medium">
                Listo
              </span>
            </div>

            {/* Checkbox de Acceso Directo */}
            <label className="flex items-center gap-2 text-xs text-blue-100 cursor-pointer justify-center">
              <input
                type="checkbox"
                checked={crearAcceso}
                onChange={(e) => setCrearAcceso(e.target.checked)}
                className="rounded border-white/30 text-blue-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
              />
              <span>Crear acceso directo oficial en el Escritorio de Windows</span>
            </label>

            {/* Pills de Capacidades */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-blue-200/90 pt-1">
              <span className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                <Database className="w-3 h-3 text-blue-400" /> SQLite Local
              </span>
              <span className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                <Fingerprint className="w-3 h-3 text-emerald-400" /> Futronic FS88H
              </span>
              <span className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3 text-sky-400" /> Offline 100%
              </span>
            </div>

            {/* Botón Principal de Instalación */}
            <button
              onClick={handleInstalar}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-2"
            >
              <span>Instalar Estación de Registro Civil</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {estado === 'instalando' && (
          <div className="w-full max-w-md mt-6 space-y-4 animate-in fade-in duration-300">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-blue-200">
                <span className="font-medium animate-pulse">{mensajeProgreso}</span>
                <span className="font-mono font-bold">{porcentaje}%</span>
              </div>

              {/* Barra de progreso animada */}
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/15">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 via-sky-400 to-emerald-400 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${porcentaje}%` }}
                ></div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs text-rose-200 text-left">
                <strong>Error:</strong> {errorMsg}
              </div>
            )}
          </div>
        )}

        {estado === 'completado' && (
          <div className="w-full max-w-md mt-6 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs flex items-center gap-3 text-left">
              <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
              <div>
                <strong className="block text-white font-bold text-sm">¡Instalación Completada!</strong>
                <span>CompilaRC Desktop quedó configurado y listo en <code>{rutaDestino}</code></span>
                <span className="block text-[11px] text-emerald-300/90 mt-1">
                  Acceso directo creado en el Escritorio. Puede transferir bases de datos o padrones en <code>{rutaDestino}\data</code> cuando lo requiera.
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleIniciarApp}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Iniciar CompilaRC Desktop</span>
              </button>
              <button
                onClick={handleCerrar}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all cursor-pointer"
              >
                Salir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer del Instalador */}
      <div className="text-center text-[10px] text-blue-300/60 border-t border-white/10 pt-2 flex items-center justify-between">
        <span>Consejo Nacional Electoral © 2026</span>
        <span>Oficina Nacional de Registro Civil</span>
      </div>
    </div>
  );
}
