import React, { useState, useEffect } from 'react';
import type { DatosPresentado } from '../../types/actas';
import { InputField } from '../ui/InputField';
import {
  ESTADOS_VENEZUELA,
  PAISES_CATALOGO,
  obtenerCentrosSaludPorUbicacion,
} from '../../data/catalogoGeo';
import { Baby, MapPin } from 'lucide-react';

interface ErroresPresentado {
  primer_nombre?: string;
  primer_apellido?: string;
  fecha_nacimiento?: string;
  sexo?: string;
  estado_id?: string;
  municipio_id?: string;
}

interface Props {
  datos: DatosPresentado;
  errores?: ErroresPresentado;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  bloqueadoPorYo?: boolean;
}

export const FormPresentado: React.FC<Props> = ({
  datos,
  errores = {},
  onChange,
  bloqueadoPorYo = false,
}) => {
  const esVenezuela = !datos.pais_nacimiento || datos.pais_nacimiento === 'VENEZUELA';

  // ID actual de estado y municipio
  const estadoIdActual = esVenezuela ? (datos.estado_id || '1490') : '';
  const municipioIdActual = esVenezuela ? (datos.municipio_id || '1491') : '';

  // Buscar estado en el catálogo local offline
  const estadoSeleccionado = ESTADOS_VENEZUELA.find(e => String(e.nu_geografico) === String(estadoIdActual));
  const municipiosDisponibles = estadoSeleccionado ? estadoSeleccionado.municipios : [];
  const municipioSeleccionado = municipiosDisponibles.find(m => String(m.nu_geografico) === String(municipioIdActual));
  const parroquiasDisponibles = municipioSeleccionado?.parroquias || [];

  // Centros de salud clasificados por parroquia y estado
  const { centrosParroquia, otrosCentros } = obtenerCentrosSaludPorUbicacion(
    estadoIdActual,
    datos.parroquia || datos.parroquia_id
  );
  const listaCentrosSalud = [...centrosParroquia, ...otrosCentros];

  const [esOtroCentro, setEsOtroCentro] = useState<boolean>(() => {
    return Boolean(datos.centro_salud && !listaCentrosSalud.includes(datos.centro_salud.toUpperCase()));
  });

  // Asegurar defaults iniciales para Venezuela si están vacíos
  useEffect(() => {
    if (esVenezuela) {
      if (!datos.estado_id) {
        onChange({ target: { name: 'estado_id', value: '1490' } } as any);
        onChange({ target: { name: 'estado', value: 'EDO. LA GUAIRA' } } as any);
      }
      if (!datos.municipio_id) {
        onChange({ target: { name: 'municipio_id', value: '1491' } } as any);
        onChange({ target: { name: 'municipio', value: 'MP. VARGAS' } } as any);
      }
    }
  }, [esVenezuela, datos.estado_id, datos.municipio_id]);

  useEffect(() => {
    if (datos.centro_salud && !listaCentrosSalud.includes(datos.centro_salud.toUpperCase())) {
      setEsOtroCentro(true);
    }
  }, [datos.centro_salud, listaCentrosSalud]);

  const handlePaisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange(e);
    if (val !== 'VENEZUELA') {
      onChange({ target: { name: 'estado_id', value: '' } } as any);
      onChange({ target: { name: 'estado', value: '' } } as any);
      onChange({ target: { name: 'municipio_id', value: '' } } as any);
      onChange({ target: { name: 'municipio', value: '' } } as any);
      onChange({ target: { name: 'parroquia_id', value: '' } } as any);
      onChange({ target: { name: 'parroquia', value: '' } } as any);
      onChange({ target: { name: 'centro_salud', value: '' } } as any);
    } else {
      onChange({ target: { name: 'estado_id', value: '1490' } } as any);
      onChange({ target: { name: 'estado', value: 'EDO. LA GUAIRA' } } as any);
      onChange({ target: { name: 'municipio_id', value: '1491' } } as any);
      onChange({ target: { name: 'municipio', value: 'MP. VARGAS' } } as any);
    }
  };

  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoId = e.target.value;
    const item = ESTADOS_VENEZUELA.find(est => String(est.nu_geografico) === nuevoId);
    onChange({ target: { name: 'estado_id', value: nuevoId } } as any);
    onChange({ target: { name: 'estado', value: item ? item.nb_geografico : '' } } as any);
    
    // Seleccionar primer municipio por defecto
    const primerMun = item && item.municipios.length > 0 ? item.municipios[0] : null;
    onChange({ target: { name: 'municipio_id', value: primerMun ? String(primerMun.nu_geografico) : '' } } as any);
    onChange({ target: { name: 'municipio', value: primerMun ? primerMun.nb_geografico : '' } } as any);
    onChange({ target: { name: 'parroquia_id', value: '' } } as any);
    onChange({ target: { name: 'parroquia', value: '' } } as any);
    onChange({ target: { name: 'centro_salud', value: '' } } as any);
  };

  const handleMunicipioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoId = e.target.value;
    const item = municipiosDisponibles.find(m => String(m.nu_geografico) === nuevoId);
    onChange({ target: { name: 'municipio_id', value: nuevoId } } as any);
    onChange({ target: { name: 'municipio', value: item ? item.nb_geografico : '' } } as any);
    onChange({ target: { name: 'parroquia_id', value: '' } } as any);
    onChange({ target: { name: 'parroquia', value: '' } } as any);
  };

  const handleParroquiaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange({ target: { name: 'parroquia_id', value: val } } as any);
    onChange({ target: { name: 'parroquia', value: val } } as any);

    // Al seleccionar una parroquia, si tiene un centro de salud específico (ej. Macuto -> Hospital Materno Infantil),
    // preseleccionarlo automáticamente para mayor agilidad del operador
    const { centrosParroquia: centrosFiltrados } = obtenerCentrosSaludPorUbicacion(
      estadoIdActual,
      val
    );
    if (centrosFiltrados.length > 0) {
      onChange({ target: { name: 'centro_salud', value: centrosFiltrados[0] } } as any);
      setEsOtroCentro(false);
    }
  };

  const handleSelectCentro = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'OTRO') {
      setEsOtroCentro(true);
      onChange({ target: { name: 'centro_salud', value: '' } } as any);
    } else {
      setEsOtroCentro(false);
      onChange({ target: { name: 'centro_salud', value: val } } as any);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
        <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
          <Baby className="w-4 h-4 text-blue-600" />
          <span>Datos del Presentado (Titular)</span>
        </h3>
        {bloqueadoPorYo && (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            ✓ Autocompletado con Solicitante (YO)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Primer Nombre <span className="text-red-600 font-bold ml-0.5">*</span>
          </label>
          <InputField 
            type="text" 
            maxLength={50} 
            name="primer_nombre" 
            value={datos.primer_nombre} 
            onChange={onChange}
            disabled={bloqueadoPorYo}
            error={errores.primer_nombre}
            className={`w-full border rounded-lg p-2 text-xs uppercase ${bloqueadoPorYo ? 'bg-slate-100 text-slate-600 font-semibold' : 'border-slate-300'}`}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Segundo Nombre</label>
          <InputField 
            type="text" 
            maxLength={50} 
            name="segundo_nombre" 
            value={datos.segundo_nombre} 
            onChange={onChange}
            disabled={bloqueadoPorYo}
            className={`w-full border rounded-lg p-2 text-xs uppercase ${bloqueadoPorYo ? 'bg-slate-100 text-slate-600 font-semibold' : 'border-slate-300'}`}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Primer Apellido <span className="text-red-600 font-bold ml-0.5">*</span>
          </label>
          <InputField 
            type="text" 
            maxLength={50} 
            name="primer_apellido" 
            value={datos.primer_apellido} 
            onChange={onChange}
            disabled={bloqueadoPorYo}
            error={errores.primer_apellido}
            className={`w-full border rounded-lg p-2 text-xs uppercase ${bloqueadoPorYo ? 'bg-slate-100 text-slate-600 font-semibold' : 'border-slate-300'}`}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Segundo Apellido</label>
          <InputField 
            type="text" 
            maxLength={50} 
            name="segundo_apellido" 
            value={datos.segundo_apellido} 
            onChange={onChange}
            disabled={bloqueadoPorYo}
            className={`w-full border rounded-lg p-2 text-xs uppercase ${bloqueadoPorYo ? 'bg-slate-100 text-slate-600 font-semibold' : 'border-slate-300'}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Fecha de Nacimiento <span className="text-red-600 font-bold ml-0.5">*</span>
          </label>
          <InputField 
            type="date" 
            name="fecha_nacimiento" 
            value={datos.fecha_nacimiento} 
            onChange={onChange}
            error={errores.fecha_nacimiento}
            className="w-full border border-slate-300 rounded-lg p-2 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Sexo <span className="text-red-600 font-bold ml-0.5">*</span>
          </label>
          <select 
            name="sexo" 
            value={datos.sexo} 
            onChange={onChange}
            disabled={bloqueadoPorYo}
            className={`w-full border rounded-lg p-2 text-xs uppercase cursor-pointer ${bloqueadoPorYo ? 'bg-slate-100 font-semibold text-slate-600' : 'border-slate-300 bg-white'}`}
          >
            <option value="">Seleccione...</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            País de Nacimiento <span className="text-red-600 font-bold ml-0.5">*</span>
          </label>
          <select
            name="pais_nacimiento"
            value={datos.pais_nacimiento || 'VENEZUELA'}
            onChange={handlePaisChange}
            className="w-full border border-slate-300 rounded-lg p-2 text-xs uppercase bg-white cursor-pointer"
          >
            {PAISES_CATALOGO.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {esVenezuela && (
        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Lugar de Nacimiento y Centro de Salud (Padrón Nacional Offline)</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Estado <span className="text-red-600 font-bold">*</span>
              </label>
              <select
                name="estado_id"
                value={estadoIdActual}
                onChange={handleEstadoChange}
                className="w-full border border-slate-300 bg-white rounded-lg p-2 text-xs font-semibold cursor-pointer"
                required
              >
                <option value="">-- Seleccione Estado --</option>
                {ESTADOS_VENEZUELA.map(item => (
                  <option key={item.nu_geografico} value={item.nu_geografico}>
                    {item.nb_geografico}
                  </option>
                ))}
              </select>
              {errores.estado_id && <p className="text-[10px] text-red-600 font-bold mt-1">{errores.estado_id}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Municipio <span className="text-red-600 font-bold">*</span>
              </label>
              <select
                name="municipio_id"
                value={municipioIdActual}
                onChange={handleMunicipioChange}
                disabled={!estadoIdActual || municipiosDisponibles.length === 0}
                className="w-full border border-slate-300 bg-white rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                required
              >
                <option value="">-- Seleccione Municipio --</option>
                {municipiosDisponibles.map(item => (
                  <option key={item.nu_geografico} value={item.nu_geografico}>
                    {item.nb_geografico}
                  </option>
                ))}
              </select>
              {errores.municipio_id && <p className="text-[10px] text-red-600 font-bold mt-1">{errores.municipio_id}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Parroquia <span className="text-slate-400 text-[10px] font-normal">(Opcional)</span>
              </label>
              <select
                name="parroquia_id"
                value={datos.parroquia_id || ''}
                onChange={handleParroquiaChange}
                disabled={!municipioIdActual || parroquiasDisponibles.length === 0}
                className="w-full border border-slate-300 bg-white rounded-lg p-2 text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
              >
                <option value="">-- Seleccione Parroquia --</option>
                {parroquiasDisponibles.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Centro de Salud Filtrado según Estado y Parroquia */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center justify-between">
              <span>Centro de Salud de Nacimiento</span>
              {datos.parroquia && centrosParroquia.length > 0 && (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Parroquia {datos.parroquia} ({centrosParroquia.length})
                </span>
              )}
            </label>
            <select
              value={esOtroCentro ? 'OTRO' : (datos.centro_salud || '')}
              onChange={handleSelectCentro}
              className="w-full border border-slate-300 bg-white rounded-lg p-2 text-xs font-semibold uppercase cursor-pointer"
            >
              <option value="">-- SELECCIONE CENTRO DE SALUD --</option>
              {centrosParroquia.length > 0 && (
                <optgroup label={`🏥 CENTROS EN PARROQUIA ${datos.parroquia || ''} (${centrosParroquia.length})`}>
                  {centrosParroquia.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
              )}
              {otrosCentros.length > 0 && (
                <optgroup label={centrosParroquia.length > 0 ? "🏛️ OTROS CENTROS DEL ESTADO" : "🏥 CENTROS DE SALUD DISPONIBLES"}>
                  {otrosCentros.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
              )}
              <option value="OTRO">OTRO / CENTRO PERSONALIZADO</option>
            </select>

            {esOtroCentro && (
              <div className="mt-2 animate-fadeIn">
                <InputField 
                  type="text" 
                  name="centro_salud" 
                  value={datos.centro_salud} 
                  onChange={onChange}
                  placeholder="Indique el nombre del Centro de Salud, Maternidad o Clínica..." 
                  className="w-full border border-blue-300 bg-blue-50/20 rounded-lg p-2 text-xs uppercase"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
