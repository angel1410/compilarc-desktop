import React, { useState, useEffect } from 'react';
import {
  FileText,
  Fingerprint,
  HardDrive,
  WifiOff,
  Wifi,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Send,
  Upload,
  Layers,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { FormSolicitante } from './components/actas/FormSolicitante';
import { FormAsociacionParentesco } from './components/actas/FormAsociacionParentesco';
import { FormMadre, type ErroresMadre } from './components/actas/FormMadre';
import { FormPadre, type ErroresPadre } from './components/actas/FormPadre';
import { FormPresentado } from './components/actas/FormPresentado';
import { FormConyugues } from './components/actas/FormConyugues';
import { FormFallecido, type ErroresFallecido } from './components/actas/FormFallecido';
import { FormActaUbicacion, type ErroresActaUbicacion } from './components/actas/FormActaUbicacion';
import { BiometricCaptureModal } from './components/biometric/BiometricCaptureModal';
import { NetworkStatusBadge } from './components/ui/NetworkStatusBadge';
import type { EstadoRed } from './types/network';
import {
  sanitizarTextoNombre,
  sanitizarCedula,
  sanitizarSoloNumeros,
  sanitizarCorreo,
  validarEmail,
  esCampoNombre,
  getFechaHoy
} from './utils/formatters';
import type {
  DatosSolicitante,
  DatosActa,
  DatosOficina,
  DatosMadre,
  DatosPadre,
  DatosPresentado,
  DatosConyugues,
  DatosFallecido
} from './types/actas';
import { CATALOGO_OURCS } from './data/catalogoGeo';

// Configuración visual oficial de trámites idéntica al Dashboard de CompilaRC
export const TRAMITES_CONFIG = {
  NACIMIENTO: {
    tipo: 'NACIMIENTO' as const,
    label: 'NACIMIENTO',
    sublabel: 'Partidas y Certificación',
    bgGradient: 'from-[#0f2a66] to-[#1e40af]',
    activeBg: 'bg-gradient-to-r from-[#0f2a66] to-[#1e40af] text-white shadow-md shadow-blue-950/30 border-[#0a1c44] ring-2 ring-blue-500/50',
    inactiveBg: 'bg-white text-slate-700 hover:bg-blue-50/60 border-slate-200 hover:border-blue-400',
    bannerGradient: 'from-[#0f2a66] to-[#1e40af]',
    badgeColor: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
    pillLote: 'bg-blue-100 text-blue-800 border border-blue-200',
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="6.5" r="3.6" />
        <path d="M12 2.9c.6-.7 1.4-.6 1.4 0" />
        <circle cx="10.8" cy="6.3" r="0.4" fill="currentColor" />
        <circle cx="13.2" cy="6.3" r="0.4" fill="currentColor" />
        <path d="M11.2 7.6c.5.3 1.1.3 1.6 0" />
        <path d="M8.8 11.2c-1.6.8-2.6 2-2 3.5.4.8 1.2.9 1.8.4" />
        <path d="M15.2 11.2c1.6.8 2.6 2 2 3.5-.4.8-1.2.9-1.8.4" />
        <path d="M9.5 10v4.5h5V10" />
        <path d="M7.5 14.5h9c.4 2-.3 4.2-1.8 5.2-1.2.8-3.2.8-4.4 0-1.5-1-2.2-3.2-1.8-5.2z" fill="currentColor" fillOpacity="0.25" />
      </svg>
    ),
  },
  MATRIMONIO: {
    tipo: 'MATRIMONIO' as const,
    label: 'MATRIMONIO',
    sublabel: 'Actas y Protocolos',
    bgGradient: 'from-[#881337] to-[#be123c]',
    activeBg: 'bg-gradient-to-r from-[#881337] to-[#be123c] text-white shadow-md shadow-rose-950/30 border-[#500724] ring-2 ring-rose-500/50',
    inactiveBg: 'bg-white text-slate-700 hover:bg-rose-50/60 border-slate-200 hover:border-rose-400',
    bannerGradient: 'from-[#881337] to-[#be123c]',
    badgeColor: 'bg-rose-500/20 text-rose-200 border-rose-400/30',
    pillLote: 'bg-rose-100 text-rose-800 border border-rose-200',
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8.5" cy="13.5" r="5" />
        <circle cx="15.5" cy="13.5" r="5" />
        <path d="M8.5 5.5l1.5-2h4l1.5 2l-3.5 3z" fill="currentColor" fillOpacity="0.25" strokeWidth="1.4" />
      </svg>
    ),
  },
  UNION_ESTABLE: {
    tipo: 'UNION_ESTABLE' as const,
    label: 'UNIÓN ESTABLE',
    sublabel: 'Constancia Oficial UEH',
    bgGradient: 'from-[#065f46] to-[#047857]',
    activeBg: 'bg-gradient-to-r from-[#065f46] to-[#047857] text-white shadow-md shadow-emerald-950/30 border-[#022c22] ring-2 ring-emerald-500/50',
    inactiveBg: 'bg-white text-slate-700 hover:bg-emerald-50/60 border-slate-200 hover:border-emerald-400',
    bannerGradient: 'from-[#065f46] to-[#047857]',
    badgeColor: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
    pillLote: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="7.2" cy="10.8" r="3" />
        <path d="M1.5 21c0-3.5 2.5-5.8 5.7-5.8s5.7 2.3 5.7 5.8H1.5z" />
        <circle cx="17" cy="11.5" r="2.8" />
        <path d="M11.6 21c0-3 2.2-5 5.4-5s5.4 2 5.4 5h-10.8z" />
      </svg>
    ),
  },
  DEFUNCION: {
    tipo: 'DEFUNCION' as const,
    label: 'DEFUNCIÓN',
    sublabel: 'Partidas y Verificación',
    bgGradient: 'from-[#0f172a] to-[#334155]',
    activeBg: 'bg-gradient-to-r from-[#0f172a] to-[#334155] text-white shadow-md shadow-slate-950/30 border-slate-950 ring-2 ring-slate-400/50',
    inactiveBg: 'bg-white text-slate-700 hover:bg-slate-50/80 border-slate-200 hover:border-slate-400',
    bannerGradient: 'from-[#0f172a] to-[#334155]',
    badgeColor: 'bg-slate-500/20 text-slate-200 border-slate-400/30',
    pillLote: 'bg-slate-100 text-slate-800 border border-slate-300',
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C9.5 2 7.5 4.1 7.5 6.7c0 2.2 1.4 4.2 3.5 4.9L5.4 20.3c-.3.5-.2 1.2.3 1.6.2.2.5.3.8.3.3 0 .7-.1.9-.4L12 13.5l4.6 8.3c.2.3.6.4.9.4.3 0 .6-.1.8-.3.5-.4.6-1.1.3-1.6l-5.6-8.7c2.1-.7 3.5-2.7 3.5-4.9C16.5 4.1 14.5 2 12 2zm0 3c1 0 1.8.8 1.8 1.8s-.8 1.8-1.8 1.8-1.8-.8-1.8-1.8S11 5 12 5z" />
      </svg>
    ),
  },
};

export default function App() {
  const [tabActiva, setTabActiva] = useState<'nueva' | 'lotes' | 'ac'>('nueva');
  const [tipoActa, setTipoActa] = useState<'NACIMIENTO' | 'MATRIMONIO' | 'DEFUNCION' | 'UNION_ESTABLE'>('NACIMIENTO');

  // Estado de Red (Detección automática de hardware y conectividad)
  const [estadoRed, setEstadoRed] = useState<EstadoRed>({
    online: false,
    tipo_conexion: 'DESCONECTADO',
    nombre_interfaz: '',
    ip_local: '',
    gateway: '',
    tiene_internet: false,
    latencia_ms: 0,
    mensaje: 'Iniciando diagnóstico de red...',
    ultima_revision: '',
  });
  const [forzarModoOffline, setForzarModoOffline] = useState<boolean>(false);
  const [reverificandoRed, setReverificandoRed] = useState<boolean>(false);

  // Modo online determinado automáticamente por la conexión de red activa
  const modoOnline = estadoRed.online && !forzarModoOffline;

  const [modalHuellaAbierto, setModalHuellaAbierto] = useState<boolean>(false);
  const [huellaCapturada, setHuellaCapturada] = useState<any>(null);
  const [cargandoGuardado, setCargandoGuardado] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [alertaInconsistencia, setAlertaInconsistencia] = useState<string | null>(null);

  // Estadísticas del AC
  const [acStats, setAcStats] = useState({
    total_registros: 36620512,
    version_corte: '146',
    fecha_corte: '2026-10-01',
    lotes_pendientes: 0,
    estacion_id: 'ESTACION-RC-01',
  });

  // Lista de solicitudes offline
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<any[]>([]);

  // Estados de los Formularios
  const [parentesco, setParentesco] = useState<string>('');
  const [parentescoOtro, setParentescoOtro] = useState<string>('');

  const [datosSolicitante, setDatosSolicitante] = useState<DatosSolicitante>({
    parentesco: '',
    nacionalidad: 'V',
    cedula: '',
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    correo: '',
    sexo: '',
    fe_nacimiento: '',
  });

  const [datosMadre, setDatosMadre] = useState<DatosMadre>({
    nacionalidad: 'V',
    cedula: '',
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
  });

  const [datosPadre, setDatosPadre] = useState<DatosPadre>({
    nacionalidad: 'V',
    cedula: '',
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
  });

  const [datosPresentado, setDatosPresentado] = useState<DatosPresentado>({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    fecha_nacimiento: '',
    sexo: '',
    pais_nacimiento: 'VENEZUELA',
    estado_id: '1490',
    estado: 'EDO. LA GUAIRA',
    municipio_id: '1491',
    municipio: 'MP. VARGAS',
    parroquia_id: '',
    parroquia: '',
    centro_salud: '',
    filiacion: '',
  });

  const [datosConyugues, setDatosConyugues] = useState<DatosConyugues>({
    fecha_acto: '',
    nacionalidad_ella: 'V',
    cedula_ella: '',
    primer_nombre_ella: '',
    segundo_nombre_ella: '',
    primer_apellido_ella: '',
    segundo_apellido_ella: '',
    correo_ella: '',
    nacionalidad_el: 'V',
    cedula_el: '',
    primer_nombre_el: '',
    segundo_nombre_el: '',
    primer_apellido_el: '',
    segundo_apellido_el: '',
    correo_el: '',
  });

  const [datosFallecido, setDatosFallecido] = useState<DatosFallecido>({
    fecha_defuncion: '',
    nacionalidad: 'V',
    cedula: '',
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    sexo: '',
    filiacion: '',
  });

  const [datosActa, setDatosActa] = useState<DatosActa>({
    dia: '',
    mes: '',
    anio: '',
    tomo: '',
    folio: '',
    co_acta: '',
  });

  const [datosOficina, setDatosOficina] = useState<DatosOficina>({
    estado_id: '1490',
    municipio_id: '1491',
    parroquia_id: '',
    ourc_id: '1',
  });

  // Estados de Errores Inline
  const [erroresSolicitante, setErroresSolicitante] = useState<Record<string, string>>({});
  const [erroresMadre, setErroresMadre] = useState<ErroresMadre>({});
  const [erroresPadre, setErroresPadre] = useState<ErroresPadre>({});
  const [erroresPresentado, setErroresPresentado] = useState<Record<string, string>>({});
  const [erroresFallecido, setErroresFallecido] = useState<ErroresFallecido>({});
  const [erroresActa, setErroresActa] = useState<ErroresActaUbicacion>({});

  // Cargar estadísticas iniciales y monitoreo de red desde Wails
  useEffect(() => {
    cargarStats();
    cargarSolicitudes();
    cargarEstadoRed();

    // Suscribirse al evento en tiempo real emitido por el backend Go en Wails
    const runtime = (window as any).runtime;
    if (runtime && typeof runtime.EventsOn === 'function') {
      runtime.EventsOn('red:estado_cambiado', (nuevo: EstadoRed) => {
        setEstadoRed(nuevo);
      });
    }

    // Eventos nativos del navegador como respaldo
    const handleBrowserOnline = () => cargarEstadoRed();
    const handleBrowserOffline = () => cargarEstadoRed();
    window.addEventListener('online', handleBrowserOnline);
    window.addEventListener('offline', handleBrowserOffline);

    return () => {
      if (runtime && typeof runtime.EventsOff === 'function') {
        runtime.EventsOff('red:estado_cambiado');
      }
      window.removeEventListener('online', handleBrowserOnline);
      window.removeEventListener('offline', handleBrowserOffline);
    };
  }, []);

  const cargarEstadoRed = async () => {
    try {
      const wailsApp = (window as any).go?.main?.App;
      if (wailsApp && typeof wailsApp.ObtenerEstadoRed === 'function') {
        const estado = await wailsApp.ObtenerEstadoRed();
        if (estado) {
          setEstadoRed(estado);
        }
      } else {
        // Fallback para pruebas en navegador estándar
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
        setEstadoRed({
          online: isOnline,
          tipo_conexion: isOnline ? 'INALAMBRICA' : 'DESCONECTADO',
          nombre_interfaz: isOnline ? 'Wi-Fi (Web)' : '',
          ip_local: isOnline ? '127.0.0.1' : '',
          gateway: isOnline ? '192.168.1.1' : '',
          tiene_internet: isOnline,
          latencia_ms: 15,
          mensaje: isOnline ? 'Conectado a Red (Detección Web)' : 'Modo Offline (Sin red)',
          ultima_revision: new Date().toLocaleTimeString(),
        });
      }
    } catch (e) {
      console.warn('Error consultando estado de red:', e);
    }
  };

  const handleReverificarRed = async () => {
    setReverificandoRed(true);
    try {
      const wailsApp = (window as any).go?.main?.App;
      if (wailsApp && typeof wailsApp.ForzarVerificacionRed === 'function') {
        const estado = await wailsApp.ForzarVerificacionRed();
        if (estado) {
          setEstadoRed(estado);
        }
      } else {
        await cargarEstadoRed();
      }
    } catch (e) {
      console.warn('Error forzando verificación de red:', e);
    } finally {
      setReverificandoRed(false);
    }
  };

  const cargarStats = async () => {
    try {
      const wailsApp = (window as any).go?.main?.App;
      if (wailsApp && typeof wailsApp.ObtenerEstadisticasAC === 'function') {
        const stats = await wailsApp.ObtenerEstadisticasAC();
        setAcStats(stats);
      }
    } catch (e) {
      console.log('Modo Dev Wails');
    }
  };

  const cargarSolicitudes = async () => {
    try {
      const wailsApp = (window as any).go?.main?.App;
      if (wailsApp && typeof wailsApp.ListarSolicitudesPendientes === 'function') {
        const lista = await wailsApp.ListarSolicitudesPendientes();
        setSolicitudesPendientes(lista || []);
      }
    } catch (e) {
      console.log('Modo Dev Wails');
    }
  };

  // Handlers con sanitización estricta idéntica a CompilaRC Web
  const handleSolicitanteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'cedula') {
      const limpia = sanitizarCedula(value);
      if (!limpia) {
        setDatosSolicitante((prev) => ({
          ...prev,
          cedula: '',
          primer_nombre: '',
          segundo_nombre: '',
          primer_apellido: '',
          segundo_apellido: '',
        }));
        return;
      }
      setDatosSolicitante((prev) => ({ ...prev, cedula: limpia }));
      return;
    }

    if (name === 'nacionalidad') {
      setDatosSolicitante((prev) => ({
        ...prev,
        nacionalidad: value as any,
        primer_nombre: '',
        segundo_nombre: '',
        primer_apellido: '',
        segundo_apellido: '',
      }));
      return;
    }

    let valLimpio = value;
    if (name === 'correo') {
      valLimpio = sanitizarCorreo(value);
    } else if (esCampoNombre(name)) {
      valLimpio = sanitizarTextoNombre(value);
    } else if (name !== 'parentesco') {
      valLimpio = value.toUpperCase();
    }

    setDatosSolicitante((prev) => ({
      ...prev,
      [name]: valLimpio,
    }));
  };

  // Sincronización al consultar y obtener datos de la cédula del solicitante
  const handleUpdateSolicitante = (nuevos: Partial<DatosSolicitante>) => {
    const actualizado = { ...datosSolicitante, ...nuevos };
    setDatosSolicitante(actualizado);

    // Sincronizar automáticamente si el parentesco ya estaba seleccionado
    if (tipoActa === 'NACIMIENTO') {
      const sexo = (actualizado.sexo || '').toUpperCase();
      if (parentesco === 'MADRE') {
        if (sexo === 'M' || sexo === 'MASCULINO') {
          setAlertaInconsistencia('Inconsistencia de Género: La persona solicitante está registrada con sexo MASCULINO y no puede ser asignada como MADRE.');
        } else {
          setAlertaInconsistencia(null);
          setDatosMadre({
            nacionalidad: (actualizado.nacionalidad as any) || 'V',
            cedula: actualizado.cedula || '',
            primer_nombre: actualizado.primer_nombre || '',
            segundo_nombre: actualizado.segundo_nombre || '',
            primer_apellido: actualizado.primer_apellido || '',
            segundo_apellido: actualizado.segundo_apellido || '',
          });
          // Propagar segundo apellido al presentado
          if (actualizado.primer_apellido) {
            setDatosPresentado((prev) => ({
              ...prev,
              segundo_apellido: sanitizarTextoNombre(actualizado.primer_apellido || ''),
            }));
          }
        }
      } else if (parentesco === 'PADRE') {
        if (sexo === 'F' || sexo === 'FEMENINO') {
          setAlertaInconsistencia('Inconsistencia de Género: La persona solicitante está registrada con sexo FEMENINO y no puede ser asignada como PADRE.');
        } else {
          setAlertaInconsistencia(null);
          setDatosPadre({
            nacionalidad: (actualizado.nacionalidad as any) || 'V',
            cedula: actualizado.cedula || '',
            primer_nombre: actualizado.primer_nombre || '',
            segundo_nombre: actualizado.segundo_nombre || '',
            primer_apellido: actualizado.primer_apellido || '',
            segundo_apellido: actualizado.segundo_apellido || '',
          });
          // Propagar primer apellido al presentado
          if (actualizado.primer_apellido) {
            setDatosPresentado((prev) => ({
              ...prev,
              primer_apellido: sanitizarTextoNombre(actualizado.primer_apellido || ''),
            }));
          }
        }
      } else if (parentesco === 'YO') {
        setAlertaInconsistencia(null);
        setDatosPresentado((prev) => ({
          ...prev,
          primer_nombre: actualizado.primer_nombre || '',
          segundo_nombre: actualizado.segundo_nombre || '',
          primer_apellido: actualizado.primer_apellido || '',
          segundo_apellido: actualizado.segundo_apellido || '',
          sexo: (sexo === 'F' || sexo === 'M' ? sexo : prev.sexo) as any,
          fecha_nacimiento: actualizado.fe_nacimiento || prev.fecha_nacimiento,
          filiacion: 'YO',
        }));
      }
    }
  };

  // Regla de autocompletado y validación de parentesco
  const handleParentescoChange = (nuevoParentesco: string) => {
    setParentesco(nuevoParentesco);
    if (nuevoParentesco !== 'OTRO') {
      setParentescoOtro('');
    }

    if (tipoActa === 'NACIMIENTO') {
      if (nuevoParentesco === 'YO') {
        if (datosSolicitante.cedula) {
          setAlertaInconsistencia(null);
          setDatosPresentado((prev) => ({
            ...prev,
            primer_nombre: datosSolicitante.primer_nombre || '',
            segundo_nombre: datosSolicitante.segundo_nombre || '',
            primer_apellido: datosSolicitante.primer_apellido || '',
            segundo_apellido: datosSolicitante.segundo_apellido || '',
            sexo: (datosSolicitante.sexo === 'F' || datosSolicitante.sexo === 'M' ? datosSolicitante.sexo : prev.sexo) as any,
            fecha_nacimiento: datosSolicitante.fe_nacimiento || prev.fecha_nacimiento,
            filiacion: 'YO',
          }));
        }
      } else if (nuevoParentesco === 'MADRE') {
        if (datosSolicitante.cedula) {
          const sexo = (datosSolicitante.sexo || '').toUpperCase();
          if (sexo === 'M' || sexo === 'MASCULINO') {
            setAlertaInconsistencia('Inconsistencia de Género: La persona solicitante está registrada con sexo MASCULINO y no puede ser asignada como MADRE.');
          } else {
            setAlertaInconsistencia(null);
            setDatosMadre({
              nacionalidad: (datosSolicitante.nacionalidad as any) || 'V',
              cedula: datosSolicitante.cedula,
              primer_nombre: datosSolicitante.primer_nombre || '',
              segundo_nombre: datosSolicitante.segundo_nombre || '',
              primer_apellido: datosSolicitante.primer_apellido || '',
              segundo_apellido: datosSolicitante.segundo_apellido || '',
            });
            if (datosSolicitante.primer_apellido) {
              setDatosPresentado((prev) => ({
                ...prev,
                segundo_apellido: sanitizarTextoNombre(datosSolicitante.primer_apellido),
              }));
            }
          }
        }
      } else if (nuevoParentesco === 'PADRE') {
        if (datosSolicitante.cedula) {
          const sexo = (datosSolicitante.sexo || '').toUpperCase();
          if (sexo === 'F' || sexo === 'FEMENINO') {
            setAlertaInconsistencia('Inconsistencia de Género: La persona solicitante está registrada con sexo FEMENINO y no puede ser asignada como PADRE.');
          } else {
            setAlertaInconsistencia(null);
            setDatosPadre({
              nacionalidad: (datosSolicitante.nacionalidad as any) || 'V',
              cedula: datosSolicitante.cedula,
              primer_nombre: datosSolicitante.primer_nombre || '',
              segundo_nombre: datosSolicitante.segundo_nombre || '',
              primer_apellido: datosSolicitante.primer_apellido || '',
              segundo_apellido: datosSolicitante.segundo_apellido || '',
            });
            if (datosSolicitante.primer_apellido) {
              setDatosPresentado((prev) => ({
                ...prev,
                primer_apellido: sanitizarTextoNombre(datosSolicitante.primer_apellido),
              }));
            }
          }
        }
      } else {
        setAlertaInconsistencia(null);
      }
    } else if (tipoActa === 'DEFUNCION') {
      setDatosFallecido((prev) => ({
        ...prev,
        filiacion: nuevoParentesco as any,
      }));
    }
  };

  // Madre Change + Propagación Automática de Segundo Apellido al Presentado
  const handleMadreChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'cedula') {
      const limpia = sanitizarCedula(value);
      setDatosMadre((prev) => ({
        ...prev,
        cedula: limpia,
        primer_nombre: '',
        segundo_nombre: '',
        primer_apellido: '',
        segundo_apellido: '',
      }));
      setDatosPresentado((prev) => ({ ...prev, segundo_apellido: '' }));
      return;
    }
    if (name === 'nacionalidad') {
      setDatosMadre((prev) => ({
        ...prev,
        nacionalidad: value as any,
        primer_nombre: '',
        segundo_nombre: '',
        primer_apellido: '',
        segundo_apellido: '',
      }));
      setDatosPresentado((prev) => ({ ...prev, segundo_apellido: '' }));
      return;
    }

    const valLimpio = esCampoNombre(name) ? sanitizarTextoNombre(value) : value.toUpperCase();
    setDatosMadre((prev) => ({ ...prev, [name]: valLimpio }));

    // Regla de Registro Civil: El primer apellido de la madre propaga al segundo apellido del presentado
    if (name === 'primer_apellido') {
      setDatosPresentado((prev) => ({ ...prev, segundo_apellido: valLimpio }));
    }
  };

  const handleUpdateMadre = (nuevos: Partial<DatosMadre>) => {
    setDatosMadre((prev) => ({ ...prev, ...nuevos }));
    if (nuevos.primer_apellido !== undefined) {
      const ape = nuevos.primer_apellido ? sanitizarTextoNombre(nuevos.primer_apellido) : '';
      setDatosPresentado((prev) => ({ ...prev, segundo_apellido: ape }));
    }
  };

  // Padre Change + Propagación Automática de Primer Apellido al Presentado
  const handlePadreChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'cedula') {
      const limpia = sanitizarCedula(value);
      setDatosPadre((prev) => ({
        ...prev,
        cedula: limpia,
        primer_nombre: '',
        segundo_nombre: '',
        primer_apellido: '',
        segundo_apellido: '',
      }));
      setDatosPresentado((prev) => ({ ...prev, primer_apellido: '' }));
      return;
    }
    if (name === 'nacionalidad') {
      setDatosPadre((prev) => ({
        ...prev,
        nacionalidad: value as any,
        primer_nombre: '',
        segundo_nombre: '',
        primer_apellido: '',
        segundo_apellido: '',
      }));
      setDatosPresentado((prev) => ({ ...prev, primer_apellido: '' }));
      return;
    }

    const valLimpio = esCampoNombre(name) ? sanitizarTextoNombre(value) : value.toUpperCase();
    setDatosPadre((prev) => ({ ...prev, [name]: valLimpio }));

    // Regla de Registro Civil: El primer apellido del padre propaga al primer apellido del presentado
    if (name === 'primer_apellido') {
      setDatosPresentado((prev) => ({ ...prev, primer_apellido: valLimpio }));
    }
  };

  const handleUpdatePadre = (nuevos: Partial<DatosPadre>) => {
    setDatosPadre((prev) => ({ ...prev, ...nuevos }));
    if (nuevos.primer_apellido !== undefined) {
      const ape = nuevos.primer_apellido ? sanitizarTextoNombre(nuevos.primer_apellido) : '';
      setDatosPresentado((prev) => ({ ...prev, primer_apellido: ape }));
    }
  };

  // Presentado Change
  const handlePresentadoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const valLimpio = esCampoNombre(name) ? sanitizarTextoNombre(value) : (name === 'sexo' ? value : value.toUpperCase());
    setDatosPresentado((prev) => ({ ...prev, [name]: valLimpio }));
  };

  // Cónyuges Change
  const handleConyuguesChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'cedula_ella') {
      const limpia = sanitizarCedula(value);
      setDatosConyugues((prev) => ({
        ...prev,
        cedula_ella: limpia,
        primer_nombre_ella: '',
        segundo_nombre_ella: '',
        primer_apellido_ella: '',
        segundo_apellido_ella: '',
      }));
      return;
    }
    if (name === 'cedula_el') {
      const limpia = sanitizarCedula(value);
      setDatosConyugues((prev) => ({
        ...prev,
        cedula_el: limpia,
        primer_nombre_el: '',
        segundo_nombre_el: '',
        primer_apellido_el: '',
        segundo_apellido_el: '',
      }));
      return;
    }
    if (name === 'correo_ella' || name === 'correo_el') {
      setDatosConyugues((prev) => ({ ...prev, [name]: sanitizarCorreo(value) }));
      return;
    }
    const valLimpio = esCampoNombre(name) ? sanitizarTextoNombre(value) : value.toUpperCase();
    setDatosConyugues((prev) => ({ ...prev, [name]: valLimpio }));
  };

  // Fallecido Change
  const handleFallecidoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'cedula') {
      const limpia = sanitizarCedula(value);
      setDatosFallecido((prev) => ({
        ...prev,
        cedula: limpia,
        primer_nombre: '',
        segundo_nombre: '',
        primer_apellido: '',
        segundo_apellido: '',
      }));
      return;
    }
    const valLimpio = esCampoNombre(name) ? sanitizarTextoNombre(value) : (name === 'sexo' ? value : value.toUpperCase());
    setDatosFallecido((prev) => ({ ...prev, [name]: valLimpio }));
  };

  // Acta Change con máscaras numéricas estrictas
  const handleActaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'co_acta') {
      setDatosActa((prev) => ({ ...prev, [name]: sanitizarSoloNumeros(value) }));
      return;
    }
    if (name === 'anio') {
      const anioMax = new Date().getFullYear();
      let limpia = sanitizarSoloNumeros(value, 4);
      if (limpia.length === 4 && parseInt(limpia, 10) > anioMax) {
        limpia = String(anioMax);
      }
      setDatosActa((prev) => ({ ...prev, [name]: limpia }));
      return;
    }
    if (name === 'mes') {
      let limpia = sanitizarSoloNumeros(value, 2);
      if (limpia !== '' && parseInt(limpia, 10) > 12) {
        limpia = '12';
      }
      setDatosActa((prev) => ({ ...prev, [name]: limpia }));
      return;
    }
    if (name === 'dia') {
      let limpia = sanitizarSoloNumeros(value, 2);
      if (limpia !== '' && parseInt(limpia, 10) > 31) {
        limpia = '31';
      }
      setDatosActa((prev) => ({ ...prev, [name]: limpia }));
      return;
    }
    setDatosActa((prev) => ({ ...prev, [name]: value.toUpperCase() }));
  };

  const handleOficinaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDatosOficina((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCambioTipoActa = (nuevo: 'NACIMIENTO' | 'MATRIMONIO' | 'DEFUNCION' | 'UNION_ESTABLE') => {
    setTipoActa(nuevo);
    setParentesco('');
    setParentescoOtro('');
    setAlertaInconsistencia(null);
    setErroresSolicitante({});
    setErroresMadre({});
    setErroresPadre({});
    setErroresPresentado({});
    setErroresFallecido({});
    setErroresActa({});
  };

  const handleLimpiarFormulario = () => {
    setParentesco('');
    setParentescoOtro('');
    setAlertaInconsistencia(null);
    setHuellaCapturada(null);
    setErroresSolicitante({});
    setErroresMadre({});
    setErroresPadre({});
    setErroresPresentado({});
    setErroresFallecido({});
    setErroresActa({});

    setDatosSolicitante({
      parentesco: '',
      nacionalidad: 'V',
      cedula: '',
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      correo: '',
      sexo: '',
      fe_nacimiento: '',
    });
    setDatosMadre({
      nacionalidad: 'V',
      cedula: '',
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
    });
    setDatosPadre({
      nacionalidad: 'V',
      cedula: '',
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
    });
    setDatosPresentado({
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      fecha_nacimiento: '',
      sexo: '',
      pais_nacimiento: 'VENEZUELA',
      estado_id: '1490',
      estado: 'EDO. LA GUAIRA',
      municipio_id: '1491',
      municipio: 'MP. VARGAS',
      parroquia_id: '',
      parroquia: '',
      centro_salud: '',
      filiacion: '',
    });
    setDatosConyugues({
      fecha_acto: '',
      nacionalidad_ella: 'V',
      cedula_ella: '',
      primer_nombre_ella: '',
      segundo_nombre_ella: '',
      primer_apellido_ella: '',
      segundo_apellido_ella: '',
      correo_ella: '',
      nacionalidad_el: 'V',
      cedula_el: '',
      primer_nombre_el: '',
      segundo_nombre_el: '',
      primer_apellido_el: '',
      segundo_apellido_el: '',
      correo_el: '',
    });
    setDatosFallecido({
      fecha_defuncion: '',
      nacionalidad: 'V',
      cedula: '',
      primer_nombre: '',
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      sexo: '',
      filiacion: '',
    });
    setDatosActa({
      dia: '',
      mes: '',
      anio: '',
      tomo: '',
      folio: '',
      co_acta: '',
    });
    setDatosOficina({
      estado_id: '1490',
      municipio_id: '1491',
      parroquia_id: '',
      ourc_id: '1',
    });
  };

  const handleGuardarSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    const hoy = getFechaHoy();
    const anioActual = new Date().getFullYear();

    // Limpiar errores previos
    const errSol: Record<string, string> = {};
    const errMad: ErroresMadre = {};
    const errPres: Record<string, string> = {};
    const errFall: ErroresFallecido = {};
    const errAct: ErroresActaUbicacion = {};

    let hayErrores = false;

    // 1. Validar Solicitante (Atención en Taquilla)
    if (!datosSolicitante.cedula) {
      errSol.cedula = 'La cédula del solicitante es obligatoria.';
      hayErrores = true;
    }
    if (!datosSolicitante.primer_nombre) {
      errSol.primer_nombre = 'El primer nombre del solicitante es obligatorio.';
      hayErrores = true;
    }
    if (!datosSolicitante.primer_apellido) {
      errSol.primer_apellido = 'El primer apellido del solicitante es obligatorio.';
      hayErrores = true;
    }
    if (!datosSolicitante.correo) {
      errSol.correo = 'El correo electrónico es obligatorio para entrega del certificado.';
      hayErrores = true;
    } else if (!validarEmail(datosSolicitante.correo)) {
      errSol.correo = 'El formato del correo electrónico no es válido.';
      hayErrores = true;
    }

    // 2. Validar según Tipo de Acta
    if (tipoActa === 'NACIMIENTO') {
      if (!parentesco) {
        alert('Debe indicar el Parentesco o Asociación del solicitante con el Presentado.');
        return;
      }
      if (parentesco === 'OTRO' && !parentescoOtro.trim()) {
        alert('Especifique el Parentesco con el Presentado.');
        return;
      }

      // Validar Madre
      if (!datosMadre.primer_nombre) {
        errMad.primer_nombre = 'El primer nombre de la Madre es obligatorio.';
        hayErrores = true;
      }
      if (!datosMadre.primer_apellido) {
        errMad.primer_apellido = 'El primer apellido de la Madre es obligatorio.';
        hayErrores = true;
      }

      // Validar Presentado
      if (!datosPresentado.primer_nombre) {
        errPres.primer_nombre = 'El primer nombre del Presentado es obligatorio.';
        hayErrores = true;
      }
      if (!datosPresentado.primer_apellido) {
        errPres.primer_apellido = 'El primer apellido del Presentado es obligatorio.';
        hayErrores = true;
      }
      if (!datosPresentado.fecha_nacimiento) {
        errPres.fecha_nacimiento = 'La fecha de nacimiento es obligatoria.';
        hayErrores = true;
      } else if (datosPresentado.fecha_nacimiento > hoy) {
        errPres.fecha_nacimiento = 'La fecha de nacimiento no puede ser futura.';
        hayErrores = true;
      }
      if (!datosPresentado.sexo) {
        errPres.sexo = 'El sexo del Presentado es obligatorio.';
        hayErrores = true;
      }
      if ((!datosPresentado.pais_nacimiento || datosPresentado.pais_nacimiento === 'VENEZUELA') && !datosPresentado.estado_id) {
        errPres.estado_id = 'El Estado de nacimiento es obligatorio.';
        hayErrores = true;
      }
      if ((!datosPresentado.pais_nacimiento || datosPresentado.pais_nacimiento === 'VENEZUELA') && !datosPresentado.municipio_id) {
        errPres.municipio_id = 'El Municipio de nacimiento es obligatorio.';
        hayErrores = true;
      }
    } else if (tipoActa === 'MATRIMONIO' || tipoActa === 'UNION_ESTABLE') {
      if (!datosConyugues.fecha_acto) {
        alert('Debe ingresar la fecha del acto.');
        return;
      }
      if (datosConyugues.fecha_acto > hoy) {
        alert('La fecha del acto no puede ser una fecha futura.');
        return;
      }
      if (!datosConyugues.primer_nombre_ella || !datosConyugues.primer_apellido_ella) {
        alert('Complete los datos obligatorios de la Cónyuge (Ella).');
        return;
      }
      if (!datosConyugues.primer_nombre_el || !datosConyugues.primer_apellido_el) {
        alert('Complete los datos obligatorios del Cónyuge (Él).');
        return;
      }
    } else if (tipoActa === 'DEFUNCION') {
      if (!parentesco) {
        alert('Debe indicar el Parentesco o Asociación con el Fallecido.');
        return;
      }
      if (!datosFallecido.fecha_defuncion) {
        errFall.fecha_defuncion = 'La fecha de defunción es obligatoria.';
        hayErrores = true;
      } else if (datosFallecido.fecha_defuncion > hoy) {
        errFall.fecha_defuncion = 'La fecha de defunción no puede ser una fecha futura.';
        hayErrores = true;
      }
      if (!datosFallecido.cedula) {
        errFall.cedula = 'La cédula del fallecido es obligatoria.';
        hayErrores = true;
      }
      if (!datosFallecido.primer_nombre) {
        errFall.primer_nombre = 'El primer nombre del fallecido es obligatorio.';
        hayErrores = true;
      }
      if (!datosFallecido.primer_apellido) {
        errFall.primer_apellido = 'El primer apellido del fallecido es obligatorio.';
        hayErrores = true;
      }
      if (!datosFallecido.sexo) {
        errFall.sexo = 'El sexo del fallecido es obligatorio.';
        hayErrores = true;
      }
    }

    // 3. Validar Datos del Acta
    if (!datosActa.anio) {
      errAct.anio = 'El Año del acta es obligatorio.';
      hayErrores = true;
    } else {
      const anioNum = parseInt(datosActa.anio, 10);
      if (isNaN(anioNum) || anioNum < 1900 || anioNum > anioActual || datosActa.anio.length !== 4) {
        errAct.anio = `El año debe ser de 4 dígitos entre 1900 y ${anioActual}.`;
        hayErrores = true;
      }
    }

    if (datosActa.dia) {
      const diaNum = parseInt(datosActa.dia, 10);
      if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
        errAct.dia = 'El día debe estar entre 1 y 31.';
        hayErrores = true;
      }
    }

    if (datosActa.mes) {
      const mesNum = parseInt(datosActa.mes, 10);
      if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
        errAct.mes = 'El mes debe estar entre 1 y 12.';
        hayErrores = true;
      }
    }

    if (!datosOficina.estado_id) {
      errAct.estado_id = 'El Estado es obligatorio.';
      hayErrores = true;
    }

    if (!datosOficina.ourc_id) {
      errAct.ourc_id = 'La Oficina de Registro Civil (OURC) es obligatoria.';
      hayErrores = true;
    }

    setErroresSolicitante(errSol);
    setErroresMadre(errMad);
    setErroresPresentado(errPres);
    setErroresFallecido(errFall);
    setErroresActa(errAct);

    if (hayErrores) {
      alert('Por favor revise los campos señalados con error en el formulario.');
      return;
    }

    // 4. Validar Biometría Obligatoria Futronic FS88H
    if (!huellaCapturada) {
      alert('La captura de huella dactilar mediante el sensor Futronic FS88H es OBLIGATORIA para certificar la solicitud con PIAC.');
      setModalHuellaAbierto(true);
      return;
    }

    setCargandoGuardado(true);
    setMensajeExito(null);

    // Armar el payload estructurado completo
    const oficinaObj = CATALOGO_OURCS.find((o) => String(o.co_oficina) === String(datosOficina.ourc_id));
    const payloadActaData: any = {
      ...datosActa,
      oficina: {
        ...datosOficina,
        co_ourc: oficinaObj?.co_ourc || '',
        nb_oficina: oficinaObj?.nb_oficina || '',
        nb_parroquia: oficinaObj?.nb_parroquia || '',
      },
      parentesco: parentesco,
      parentesco_otro: parentescoOtro,
    };

    if (tipoActa === 'NACIMIENTO') {
      payloadActaData.madre = datosMadre;
      payloadActaData.padre = datosPadre;
      payloadActaData.presentado = datosPresentado;
    } else if (tipoActa === 'MATRIMONIO' || tipoActa === 'UNION_ESTABLE') {
      payloadActaData.conyugues = datosConyugues;
    } else if (tipoActa === 'DEFUNCION') {
      payloadActaData.fallecido = datosFallecido;
    }

    const payload = {
      tipo_acta: tipoActa,
      operador: 'operador.taquilla',
      cedula_verificacion_central: false,
      datos_solicitante: {
        ...datosSolicitante,
        parentesco: parentesco,
      },
      datos_acta: payloadActaData,
      datos_biometricos: huellaCapturada,
    };

    try {
      const wailsApp = (window as any).go?.main?.App;
      if (wailsApp && typeof wailsApp.GuardarSolicitud === 'function') {
        await wailsApp.GuardarSolicitud(payload);
      } else {
        setSolicitudesPendientes((prev) => [
          {
            id: 'SOL-' + Date.now(),
            tipo_acta: tipoActa,
            operador: 'operador.taquilla',
            datos_solicitante: datosSolicitante,
            datos_acta: payloadActaData,
            datos_biometricos: huellaCapturada,
            estado: 'PENDIENTE',
            creado_en: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      setMensajeExito(`¡Solicitud de ${tipoActa.replace('_', ' ')} almacenada con éxito en el lote local seguro (SQLite)!`);
      handleLimpiarFormulario();
      cargarStats();
      cargarSolicitudes();
    } catch (err: any) {
      alert('Error guardando solicitud: ' + (err?.message || err));
    } finally {
      setCargandoGuardado(false);
    }
  };

  const handleTransmitirLote = async () => {
    if (!modoOnline) {
      alert('La estación se encuentra en Modo Offline. Para transmitir solicitudes a CompilaRC-Web se requiere una conexión de red activa (cableada o Wi-Fi).');
      return;
    }
    const wailsApp = (window as any).go?.main?.App;
    if (wailsApp && typeof wailsApp.SimularSincronizacionLote === 'function') {
      const res = await wailsApp.SimularSincronizacionLote();
      alert(res.mensaje);
      cargarSolicitudes();
      cargarStats();
    } else {
      alert('Simulación: 100% de los lotes transmitidos de forma segura a CompilaRC-Web (PIAC/CIVIS).');
      setSolicitudesPendientes([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Top Header Corporativo CNE / CompilaRC */}
      <header className="bg-[#0f2a66] text-white border-b border-blue-900 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo y Título */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
              <img src="/favicon.png" alt="CompilaRC" className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Consejo Nacional Electoral
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CompilaRC Desktop v1.0
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Estación de Captura y Registro Civil (Modo Híbrido)
              </h1>
            </div>
          </div>

          {/* Barra de Estado Rápido del Hardware y AC */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Pill Sensor Futronic */}
            <div className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5 shadow-inner">
              <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
              <span>Futronic FS88H (USB OK)</span>
            </div>

            {/* Pill AC SQLite Local */}
            <div className="px-2.5 py-1 rounded-lg bg-blue-950/70 border border-blue-500/40 text-blue-300 flex items-center gap-1.5 shadow-inner">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>AC Local: v{acStats.version_corte} (&lt;3ms)</span>
            </div>

            {/* Indicador Automático de Red (Ethernet / Wi-Fi / Offline) */}
            <NetworkStatusBadge
              estadoRed={estadoRed}
              forzarOffline={forzarModoOffline}
              onToggleForzarOffline={setForzarModoOffline}
              onReverificar={handleReverificarRed}
              reverificando={reverificandoRed}
            />
          </div>
        </div>
      </header>

      {/* Barra de Navegación de Pestañas */}
      <nav className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center space-x-1 sm:space-x-4 overflow-x-auto py-2">
          <button
            onClick={() => setTabActiva('nueva')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              tabActiva === 'nueva'
                ? 'bg-[#0f2a66] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Nueva Solicitud de Certificación</span>
          </button>

          <button
            onClick={() => setTabActiva('lotes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
              tabActiva === 'lotes'
                ? 'bg-[#0f2a66] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Lotes Offline</span>
            {solicitudesPendientes.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {solicitudesPendientes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setTabActiva('ac')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              tabActiva === 'ac'
                ? 'bg-[#0f2a66] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualizar Archivo Cedular (Deltas)</span>
          </button>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {mensajeExito && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-emerald-800 text-xs font-semibold animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{mensajeExito}</span>
            </div>
            <button onClick={() => setMensajeExito(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">
              Cerrar
            </button>
          </div>
        )}

        {/* PESTAÑA 1: NUEVA SOLICITUD */}
        {tabActiva === 'nueva' && (
          <form onSubmit={handleGuardarSolicitud} className="space-y-6">
            {/* Selector de Tipo de Acta con Colores Oficiales del Dashboard CompilaRC */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[11px] uppercase font-bold text-blue-700 tracking-wider">
                  Trámite Registral
                </span>
                <h2 className="text-sm font-bold text-slate-900">Seleccione el Tipo de Acta a Solicitar</h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 w-full md:w-auto">
                {/* 1. Trámite: NACIMIENTO */}
                <button
                  type="button"
                  onClick={() => handleCambioTipoActa('NACIMIENTO')}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-2.5 justify-center sm:justify-start ${
                    tipoActa === 'NACIMIENTO'
                      ? TRAMITES_CONFIG.NACIMIENTO.activeBg
                      : TRAMITES_CONFIG.NACIMIENTO.inactiveBg
                  }`}
                >
                  <div className={`p-1 rounded-lg ${tipoActa === 'NACIMIENTO' ? 'bg-white/15 text-white' : 'text-blue-700 bg-blue-50'}`}>
                    {TRAMITES_CONFIG.NACIMIENTO.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-extrabold leading-tight">NACIMIENTO</div>
                    <div className={`text-[10px] ${tipoActa === 'NACIMIENTO' ? 'text-blue-100' : 'text-slate-500'}`}>Partidas</div>
                  </div>
                </button>

                {/* 2. Trámite: MATRIMONIO (Se mantendrá activo para pruebas, y se comentará luego) */}
                <button
                  type="button"
                  onClick={() => handleCambioTipoActa('MATRIMONIO')}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-2.5 justify-center sm:justify-start ${
                    tipoActa === 'MATRIMONIO'
                      ? TRAMITES_CONFIG.MATRIMONIO.activeBg
                      : TRAMITES_CONFIG.MATRIMONIO.inactiveBg
                  }`}
                >
                  <div className={`p-1 rounded-lg ${tipoActa === 'MATRIMONIO' ? 'bg-white/15 text-white' : 'text-rose-700 bg-rose-50'}`}>
                    {TRAMITES_CONFIG.MATRIMONIO.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-extrabold leading-tight">MATRIMONIO</div>
                    <div className={`text-[10px] ${tipoActa === 'MATRIMONIO' ? 'text-rose-100' : 'text-slate-500'}`}>Actas Civiles</div>
                  </div>
                </button>

                {/* 3. Trámite: UNIÓN ESTABLE DE HECHO (Se mantendrá activo para pruebas, y se comentará luego) */}
                <button
                  type="button"
                  onClick={() => handleCambioTipoActa('UNION_ESTABLE')}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-2.5 justify-center sm:justify-start ${
                    tipoActa === 'UNION_ESTABLE'
                      ? TRAMITES_CONFIG.UNION_ESTABLE.activeBg
                      : TRAMITES_CONFIG.UNION_ESTABLE.inactiveBg
                  }`}
                >
                  <div className={`p-1 rounded-lg ${tipoActa === 'UNION_ESTABLE' ? 'bg-white/15 text-white' : 'text-emerald-700 bg-emerald-50'}`}>
                    {TRAMITES_CONFIG.UNION_ESTABLE.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-extrabold leading-tight">UNIÓN ESTABLE</div>
                    <div className={`text-[10px] ${tipoActa === 'UNION_ESTABLE' ? 'text-emerald-100' : 'text-slate-500'}`}>Constancia UEH</div>
                  </div>
                </button>

                {/* 4. Trámite: DEFUNCIÓN */}
                <button
                  type="button"
                  onClick={() => handleCambioTipoActa('DEFUNCION')}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-2.5 justify-center sm:justify-start ${
                    tipoActa === 'DEFUNCION'
                      ? TRAMITES_CONFIG.DEFUNCION.activeBg
                      : TRAMITES_CONFIG.DEFUNCION.inactiveBg
                  }`}
                >
                  <div className={`p-1 rounded-lg ${tipoActa === 'DEFUNCION' ? 'bg-white/15 text-white' : 'text-slate-800 bg-slate-100'}`}>
                    {TRAMITES_CONFIG.DEFUNCION.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-extrabold leading-tight">DEFUNCIÓN</div>
                    <div className={`text-[10px] ${tipoActa === 'DEFUNCION' ? 'text-slate-300' : 'text-slate-500'}`}>Partidas</div>
                  </div>
                </button>
              </div>
            </div>

            {/* SECCIÓN 1: SOLICITANTE (Atención en Taquilla) */}
            <div className="space-y-2">
              <div className="bg-[#0f2a66] text-white p-3 rounded-xl flex items-center justify-between shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <span>🏛️</span> Paso 1: Datos del Solicitante (Atención Presencial en Taquilla)
                </span>
                <span className="text-[10px] text-blue-200">
                  Verificación instantánea con Archivo Cedular local (&lt;3ms)
                </span>
              </div>
              <FormSolicitante
                datos={datosSolicitante}
                errores={erroresSolicitante}
                onChange={handleSolicitanteChange}
                onUpdateDatos={handleUpdateSolicitante}
              />
            </div>

            {/* SECCIÓN 2: PARENTESCO Y FORMULARIOS ESPECÍFICOS SEGÚN EL TRÁMITE */}
            <div className="space-y-4">
              <div className={`bg-gradient-to-r ${TRAMITES_CONFIG[tipoActa].bannerGradient} text-white p-3.5 rounded-xl flex items-center justify-between shadow-xs transition-all`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-lg bg-white/15 text-white">
                    {TRAMITES_CONFIG[tipoActa].icon}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Paso 2: Titulares y Datos de {TRAMITES_CONFIG[tipoActa].label}
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${TRAMITES_CONFIG[tipoActa].badgeColor}`}>
                  {TRAMITES_CONFIG[tipoActa].sublabel}
                </span>
              </div>

              {/* Inconsistencia de género alert */}
              {alertaInconsistencia && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2 animate-fadeIn">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Alerta de Inconsistencia de Género:</span>
                    <span>{alertaInconsistencia}</span>
                  </div>
                </div>
              )}

              {/* FORMS PARA NACIMIENTO */}
              {tipoActa === 'NACIMIENTO' && (
                <div className="space-y-4">
                  {/* Parentesco con el Presentado */}
                  <FormAsociacionParentesco
                    tipoActa="NACIMIENTO"
                    parentesco={parentesco}
                    parentescoOtro={parentescoOtro}
                    onChangeParentesco={handleParentescoChange}
                    onChangeParentescoOtro={setParentescoOtro}
                    solicitante={datosSolicitante}
                  />

                  {/* Madre y Padre */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormMadre
                      datos={datosMadre}
                      errores={erroresMadre}
                      onChange={handleMadreChange}
                      onUpdateDatos={handleUpdateMadre}
                    />

                    <FormPadre
                      datos={datosPadre}
                      errores={erroresPadre}
                      onChange={handlePadreChange}
                      onUpdateDatos={handleUpdatePadre}
                    />
                  </div>

                  {/* Datos del Presentado */}
                  <FormPresentado
                    datos={datosPresentado}
                    errores={erroresPresentado}
                    bloqueadoPorYo={parentesco === 'YO'}
                    onChange={handlePresentadoChange}
                  />
                </div>
              )}

              {/* FORMS PARA MATRIMONIO Y UNION ESTABLE */}
              {(tipoActa === 'MATRIMONIO' || tipoActa === 'UNION_ESTABLE') && (
                <FormConyugues
                  datos={datosConyugues}
                  isOre={true}
                  onChange={handleConyuguesChange}
                  onUpdateDatos={(nuevos) =>
                    setDatosConyugues((prev) => ({
                      ...prev,
                      ...nuevos,
                    }))
                  }
                />
              )}

              {/* FORMS PARA DEFUNCION */}
              {tipoActa === 'DEFUNCION' && (
                <div className="space-y-4">
                  <FormAsociacionParentesco
                    tipoActa="DEFUNCION"
                    parentesco={parentesco}
                    parentescoOtro={parentescoOtro}
                    onChangeParentesco={handleParentescoChange}
                    onChangeParentescoOtro={setParentescoOtro}
                    solicitante={datosSolicitante}
                  />

                  <FormFallecido
                    datos={datosFallecido}
                    errores={erroresFallecido}
                    onChange={handleFallecidoChange}
                    onUpdateDatos={(nuevos) =>
                      setDatosFallecido((prev) => ({
                        ...prev,
                        ...nuevos,
                      }))
                    }
                  />
                </div>
              )}
            </div>

            {/* SECCIÓN 3: UBICACIÓN DEL ACTA Y BIOMETRÍA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formulario de Ubicación del Acta */}
              <div className="space-y-4">
                <div className="bg-[#0f2a66] text-white p-3 rounded-xl shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <span>📖</span> Paso 3: Ubicación y Datos del Acta
                  </span>
                </div>
                <FormActaUbicacion
                  datos={datosActa}
                  oficina={datosOficina}
                  errores={erroresActa}
                  tipoActa={tipoActa}
                  onChangeActa={handleActaChange}
                  onChangeOficina={handleOficinaChange}
                />
              </div>

              {/* Tarjeta de Captura Biométrica Obligatoria Futronic */}
              <div className="space-y-4">
                <div className="bg-[#0f2a66] text-white p-3 rounded-xl shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <span>🛡️</span> Paso 4: Validación Biométrica (PIAC)
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                        <Fingerprint className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Sensor Futronic FS88H
                      </h3>
                    </div>
                    {huellaCapturada ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Huella Vinculada ({huellaCapturada.calidad}%)
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        Huella Requerida
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Es requisito indispensable capturar la huella del solicitante mediante el sensor <strong>Futronic FS88H</strong> para transmitir el paquete a validación central en <strong>PIAC</strong>.
                  </p>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {huellaCapturada
                        ? `Dedo: ${huellaCapturada.dedo_nombre} • Calidad Óptima`
                        : 'Sensor Listo en USB 2.0'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalHuellaAbierto(true)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        huellaCapturada
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-[#0f2a66] hover:bg-[#0a1c44] text-white shadow-sm'
                      }`}
                    >
                      <Fingerprint className="w-4 h-4" />
                      {huellaCapturada ? 'Volver a Capturar' : 'Escanear Huella'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de Acciones Inferior */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Modo de Almacenamiento:</span> Encriptación local y resguardo seguro en SQLite para despacho offline.
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleLimpiarFormulario}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpiar Formulario
                </button>
                <button
                  type="submit"
                  disabled={cargandoGuardado}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0f2a66] hover:bg-[#0a1c44] text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <HardDrive className="w-4 h-4" />
                  {cargandoGuardado ? 'Guardando...' : 'Guardar en Lote Offline'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* PESTAÑA 2: LOTES OFFLINE */}
        {tabActiva === 'lotes' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] uppercase font-bold text-blue-700 tracking-wider">
                  Almacenamiento Local Seguro
                </span>
                <h2 className="text-base font-bold text-slate-900">Solicitudes en Cola para Transmisión</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Las solicitudes permanecen cifradas en la base local SQLite hasta detectar conexión con CompilaRC-Web.
                </p>
              </div>

              <button
                onClick={handleTransmitirLote}
                disabled={solicitudesPendientes.length === 0 || !modoOnline}
                title={!modoOnline ? 'Se requiere conexión a la red de CompilaRC-Web' : 'Transmitir solicitudes a la central'}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-40 ${
                  modoOnline
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{modoOnline ? 'Transmitir Lote a CompilaRC-Web' : 'Sin Red (Lotes Protegidos)'}</span>
              </button>
            </div>

            {!modoOnline && solicitudesPendientes.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Estación en Modo Offline:</strong> Los {solicitudesPendientes.length} paquetes se mantendrán cifrados y seguros en la base SQLite local. La transmisión se habilitará de forma automática en cuanto se conecte el cable de red o Wi-Fi.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReverificarRed}
                  disabled={reverificandoRed}
                  className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-semibold text-[11px] transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                >
                  Comprobar Red
                </button>
              </div>
            )}

            {solicitudesPendientes.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Layers className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No hay solicitudes pendientes en la cola local.</p>
                <p className="text-[11px] text-slate-400">Las nuevas solicitudes registradas aparecerán aquí.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                      <th className="py-3 px-4">ID Paquete</th>
                      <th className="py-3 px-4">Tipo Trámite</th>
                      <th className="py-3 px-4">Solicitante</th>
                      <th className="py-3 px-4">Cédula Solicitante</th>
                      <th className="py-3 px-4">Detalle / Titular</th>
                      <th className="py-3 px-4">Biometría</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Fecha Creación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {solicitudesPendientes.map((sol, index) => (
                      <tr key={sol.id || index} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">{sol.id.slice(0, 13)}...</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                            (TRAMITES_CONFIG as any)[sol.tipo_acta]?.pillLote || 'bg-slate-100 text-slate-800'
                          }`}>
                            {sol.tipo_acta?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {sol.datos_solicitante?.primer_nombre} {sol.datos_solicitante?.primer_apellido}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold">
                          {sol.datos_solicitante?.nacionalidad}-{sol.datos_solicitante?.cedula}
                        </td>
                        <td className="py-3 px-4">
                          {sol.tipo_acta === 'NACIMIENTO' && sol.datos_acta?.presentado?.primer_nombre && (
                            <div>
                              <div>Presentado: <strong>{sol.datos_acta.presentado.primer_nombre} {sol.datos_acta.presentado.primer_apellido}</strong></div>
                              {sol.datos_acta?.oficina?.co_ourc && (
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  OURC: {sol.datos_acta.oficina.co_ourc} ({sol.datos_acta.oficina.nb_oficina})
                                </div>
                              )}
                            </div>
                          )}
                          {(sol.tipo_acta === 'MATRIMONIO' || sol.tipo_acta === 'UNION_ESTABLE') && (
                            <div>
                              <div>Cónyuges: <strong>{sol.datos_acta?.conyugues?.primer_nombre_ella}</strong> y <strong>{sol.datos_acta?.conyugues?.primer_nombre_el}</strong></div>
                              {sol.datos_acta?.oficina?.co_ourc && (
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  OURC: {sol.datos_acta.oficina.co_ourc} ({sol.datos_acta.oficina.nb_oficina})
                                </div>
                              )}
                            </div>
                          )}
                          {sol.tipo_acta === 'DEFUNCION' && sol.datos_acta?.fallecido?.primer_nombre && (
                            <div>
                              <div>Fallecido: <strong>{sol.datos_acta.fallecido.primer_nombre} {sol.datos_acta.fallecido.primer_apellido}</strong></div>
                              {sol.datos_acta?.oficina?.co_ourc && (
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  OURC: {sol.datos_acta.oficina.co_ourc} ({sol.datos_acta.oficina.nb_oficina})
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ✓ FS88H OK
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            {sol.estado}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{sol.creado_en?.slice(0, 19)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 3: ACTUALIZAR ARCHIVO CEDULAR (DELTAS) */}
        {tabActiva === 'ac' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[11px] uppercase font-bold text-blue-700 tracking-wider">
                Mantenimiento de Padrón Local
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Sincronización Incremental ("Deltas") de Nuevos Cedulados
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Actualice el Archivo Cedular local de forma silenciosa por red o mediante paquete firmado en memoria USB.
              </p>
            </div>

            {/* Resumen del Archivo Cedular */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block font-semibold">Versión de Corte Actual</span>
                <span className="text-lg font-bold text-blue-700 font-mono">v{acStats.version_corte}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block font-semibold">Total Registros Locales</span>
                <span className="text-lg font-bold text-slate-800 font-mono">
                  {acStats.total_registros.toLocaleString('es-VE')}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block font-semibold">Velocidad de Búsqueda</span>
                <span className="text-lg font-bold text-emerald-700 font-mono">&lt; 3 milisegundos</span>
              </div>
            </div>

            {/* Opciones de Actualización */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Canal 1: Red */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                      <Wifi className="w-4 h-4" />
                    </div>
                    Canal 1: Sincronización Automática por Red
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Consulta el endpoint central <code>GET /api/v1/ac/deltas</code> y descarga el paquete incremental de los últimos nuevos cedulados (~800 KB).
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => alert('Sincronización por red: El Archivo Cedular ya se encuentra en la versión más reciente (v146).')}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#0f2a66] hover:bg-[#0a1c44] text-white transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Comprobar Nuevos Deltas
                  </button>
                </div>
              </div>

              {/* Canal 2: USB */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                      <Upload className="w-4 h-4" />
                    </div>
                    Canal 2: Carga Manual desde Pendrive USB
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Para estaciones en zonas aisladas sin conexión. Importa un archivo de actualización firmado con extensión <code>.upd</code> o <code>.delta</code>.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => alert('Seleccione el archivo delta_ac_v146.upd desde la unidad USB conectada.')}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Cargar Archivo Delta (.upd)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Captura Biométrica Futronic */}
      <BiometricCaptureModal
        isOpen={modalHuellaAbierto}
        onClose={() => setModalHuellaAbierto(false)}
        nombreTitular={
          datosSolicitante.primer_nombre
            ? `${datosSolicitante.primer_nombre} ${datosSolicitante.primer_apellido}`
            : 'Ciudadano Solicitante'
        }
        cedulaTitular={
          datosSolicitante.cedula
            ? `${datosSolicitante.nacionalidad}-${datosSolicitante.cedula}`
            : 'V-XXXXXXXX'
        }
        onHuellaCapturada={(huella) => {
          setHuellaCapturada(huella);
          setModalHuellaAbierto(false);
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CompilaRC Desktop © 2026 - Registro Civil - Consejo Nacional Electoral (CNE)</span>
          <span className="font-mono text-[11px] text-slate-400">Estación: {acStats.estacion_id} • Cifrado Activo: AES-256</span>
        </div>
      </footer>
    </div>
  );
}
