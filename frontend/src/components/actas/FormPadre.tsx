import React from 'react';
import type { DatosPadre } from '../../types/actas';
import { useConsultaCiudadano } from '../../hooks/useConsultaCiudadano';
import { InputField } from '../ui/InputField';

export interface ErroresPadre {
  cedula?: string;
  primer_nombre?: string;
  primer_apellido?: string;
}

interface Props {
  datos: DatosPadre;
  errores?: ErroresPadre;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  // Callback para actualizar múltiples campos del estado padre al autocompletar
  onUpdateDatos?: (nuevosDatos: Partial<DatosPadre>) => void; 
}

export const FormPadre: React.FC<Props> = ({ datos, errores = {}, onChange, onUpdateDatos }) => {

  const { cargando, bloqueado, errorSexo } = useConsultaCiudadano(
    datos.nacionalidad,
    datos.cedula,
    (datosEncontrados) => {
      if (onUpdateDatos) {
        onUpdateDatos(datosEncontrados);
      }
    },
    // Callback para vaciar los campos cuando la cédula no existe en BD o el sexo no coincide
    () => {
      if (onUpdateDatos) {
        onUpdateDatos({
          primer_nombre: '',
          segundo_nombre: '',
          primer_apellido: '',
          segundo_apellido: '',
        });
      }
    },
    {
      sexoEsperado: 'M',
      rolNombre: 'el Padre'
    }
  );

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span>👨</span> Datos del Padre <span className="text-slate-400 font-normal text-[11px]">(Opcional)</span>
        </span>
        <div className="flex items-center gap-2">
          {cargando && <span className="text-xs text-amber-500 font-normal animate-pulse">Buscando en AC...</span>}
          {bloqueado && <span className="text-xs text-emerald-600 font-bold">✓ Verificado en AC</span>}
        </div>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Nacionalidad</label>
          <select 
            name="nacionalidad" 
            value={datos.nacionalidad} 
            onChange={onChange}
            className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold uppercase bg-white cursor-pointer"
          >
            <option value="V">V - VENEZOLANO</option>
            <option value="E">E - EXTRANJERO</option>
            <option value="P">P - PASAPORTE</option>
            <option value="O">O - OTRO</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Cédula</label>
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

      {errorSexo && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2 animate-fadeIn">
          <span className="text-base leading-none">⚠️</span>
          <div className="flex-1">
            <span className="font-bold block">Inconsistencia de Género:</span>
            <span>{errorSexo}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Primer Nombre</label>
          <InputField 
            type="text" 
            maxLength={50} 
            name="primer_nombre" 
            value={datos.primer_nombre} 
            onChange={onChange}
            disabled={bloqueado}
            error={errores.primer_nombre}
            className={`w-full border rounded-lg p-2 text-xs uppercase ${bloqueado ? 'bg-slate-100 text-slate-600 font-semibold cursor-not-allowed' : 'border-slate-300'}`} 
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
          <label className="block text-xs font-semibold text-slate-700 mb-1">Primer Apellido</label>
          <InputField 
            type="text" 
            maxLength={50} 
            name="primer_apellido" 
            value={datos.primer_apellido} 
            onChange={onChange}
            disabled={bloqueado}
            error={errores.primer_apellido}
            className={`w-full border rounded-lg p-2 text-xs uppercase ${bloqueado ? 'bg-slate-100 text-slate-600 font-semibold cursor-not-allowed' : 'border-slate-300'}`} 
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
    </div>
  );
};