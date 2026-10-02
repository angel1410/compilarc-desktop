import React from 'react';
import type { DatosFallecido } from '../../types/actas';
import { useConsultaCiudadano } from '../../hooks/useConsultaCiudadano';
import { InputField } from '../ui/InputField';

export interface ErroresFallecido {
  fecha_defuncion?: string;
  nacionalidad?: string;
  cedula?: string;
  primer_nombre?: string;
  primer_apellido?: string;
  sexo?: string;
}

interface Props {
  datos: DatosFallecido;
  errores?: ErroresFallecido;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onUpdateDatos?: (nuevosDatos: Partial<DatosFallecido>) => void;
}

export const FormFallecido: React.FC<Props> = ({ datos, errores = {}, onChange, onUpdateDatos }) => {
  const { cargando, bloqueado } = useConsultaCiudadano(
    datos.nacionalidad,
    datos.cedula,
    (datosEncontrados) => {
      if (onUpdateDatos) onUpdateDatos(datosEncontrados);
    },
    // Callback para vaciar los campos cuando la cédula no existe en BD
    () => {
      if (onUpdateDatos) {
        onUpdateDatos({
          primer_nombre: '',
          segundo_nombre: '',
          primer_apellido: '',
          segundo_apellido: '',
          sexo: '',
        });
      }
    }
  );

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span>⚰️</span> Datos del Fallecido <span className="text-red-500 font-bold">*</span>
        </span>
        <div className="flex items-center gap-2">
          {cargando && <span className="text-xs text-amber-500 font-normal animate-pulse">Buscando en AC...</span>}
          {bloqueado && <span className="text-xs text-emerald-600 font-bold">✓ Verificado en AC</span>}
        </div>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Fecha Defunción <span className="text-red-600 font-bold ml-0.5">*</span>
          </label>
          <InputField 
            type="date" 
            name="fecha_defuncion" 
            value={datos.fecha_defuncion} 
            onChange={onChange}
            error={errores.fecha_defuncion}
            className="w-full border border-slate-300 rounded-lg p-2 text-xs" 
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nacionalidad <span className="text-red-600 font-bold ml-0.5">*</span>
          </label>
          <select 
            name="nacionalidad" 
            value={datos.nacionalidad} 
            onChange={onChange}
            className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold uppercase bg-white cursor-pointer"
          >
            <option value="">-- Seleccione --</option>
            <option value="V">V - VENEZOLANO</option>
            <option value="E">E - EXTRANJERO</option>
            <option value="P">P - PASAPORTE</option>
            <option value="O">O - OTRO</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Cédula <span className="text-red-600 font-bold ml-0.5">*</span>
          </label>
          <InputField 
            type="number" 
            maxLength={9}
            name="cedula" 
            value={datos.cedula} 
            onChange={onChange}
            error={errores.cedula}
            placeholder="Ej: 12345678" 
            className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono"
          />
        </div>
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
            disabled={bloqueado}
            error={errores.primer_nombre}
            className={`w-full border rounded-lg p-2 text-xs uppercase ${bloqueado ? 'bg-slate-100 text-slate-600 font-semibold cursor-not-allowed' : 'border-slate-300'}`}
            required 
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
            disabled={bloqueado}
            className={`w-full border rounded-lg p-2 text-xs uppercase ${bloqueado ? 'bg-slate-100 text-slate-600 font-semibold cursor-not-allowed' : 'border-slate-300'}`}
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
            disabled={bloqueado}
            error={errores.primer_apellido}
            className={`w-full border rounded-lg p-2 text-xs uppercase ${bloqueado ? 'bg-slate-100 text-slate-600 font-semibold cursor-not-allowed' : 'border-slate-300'}`}
            required 
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
            disabled={bloqueado}
            className={`w-full border rounded-lg p-2 text-xs uppercase ${bloqueado ? 'bg-slate-100 text-slate-600 font-semibold cursor-not-allowed' : 'border-slate-300'}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Sexo <span className="text-red-600 font-bold ml-0.5">*</span>
          </label>
          <select 
            name="sexo" 
            value={datos.sexo} 
            onChange={onChange}
            disabled={bloqueado}
            className={`w-full border rounded-lg p-2 text-xs uppercase cursor-pointer ${bloqueado ? 'bg-slate-100 font-semibold text-slate-600 cursor-not-allowed' : 'border-slate-300 bg-white'}`}
            required
          >
            <option value="">-- SELECCIONE SEXO --</option>
            <option value="F">FEMENINO</option>
            <option value="M">MASCULINO</option>
          </select>
          {errores.sexo && <p className="text-[11px] font-semibold text-red-600 mt-1">⚠️ {errores.sexo}</p>}
        </div>
      </div>
    </div>
  );
};