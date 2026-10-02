import React from 'react';
import type { DatosSolicitante } from '../../types/actas';
import { useConsultaCiudadano } from '../../hooks/useConsultaCiudadano';
import { InputField } from '../ui/InputField';

interface ErroresSolicitante {
  cedula?: string;
  primer_nombre?: string;
  primer_apellido?: string;
  correo?: string;
}

interface Props {
  datos: DatosSolicitante;
  errores?: ErroresSolicitante;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onUpdateDatos?: (nuevosDatos: Partial<DatosSolicitante>) => void;
}

export const FormSolicitante: React.FC<Props> = ({ datos, errores = {}, onChange, onUpdateDatos }) => {
  const { cargando, bloqueado, noEncontrado } = useConsultaCiudadano(
    datos.nacionalidad,
    datos.cedula,
    (datosEncontrados) => {
      if (onUpdateDatos) onUpdateDatos(datosEncontrados);
    },
    () => {
      if (onUpdateDatos) {
        onUpdateDatos({
          primer_nombre: '',
          segundo_nombre: '',
          primer_apellido: '',
          segundo_apellido: '',
        });
      }
    }
  );

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center justify-between">
        <span className="flex items-center gap-2">👤 Datos del Solicitante</span>
        {cargando && <span className="text-xs text-amber-500 font-normal animate-pulse">Buscando en AC...</span>}
        {bloqueado && <span className="text-xs font-bold text-emerald-600 font-normal flex items-center gap-1">✓ Verificado en AC</span>}
        {noEncontrado && <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">⚠️ No indexada (Cédula reciente)</span>}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Nacionalidad <span className="text-red-600 font-bold ml-0.5">*</span>
          </label>
          <select 
            name="nacionalidad" 
            value={datos.nacionalidad} 
            onChange={onChange}
            className="w-full border border-gray-300 rounded-lg p-2 text-xs font-medium"
          >
            <option value="V">V - Venezolano</option>
            <option value="E">E - Extranjero</option>
            <option value="P">P - Pasaporte</option>
            <option value="O">O - Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Cédula <span className="text-red-600 font-bold ml-0.5">*</span>
          </label>
          <InputField 
            type="number" 
            maxLength={9}
            name="cedula" 
            value={datos.cedula} 
            onChange={onChange}
            placeholder="Ej: 15123456" 
            error={errores.cedula}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
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
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Segundo Nombre</label>
          <InputField 
            type="text" 
            maxLength={50} 
            name="segundo_nombre" 
            value={datos.segundo_nombre} 
            onChange={onChange}
            disabled={bloqueado}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
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
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Segundo Apellido</label>
          <InputField 
            type="text" 
            maxLength={50} 
            name="segundo_apellido" 
            value={datos.segundo_apellido} 
            onChange={onChange}
            disabled={bloqueado}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Correo Electrónico <span className="text-red-600 font-bold ml-0.5">*</span>
        </label>
        <InputField 
          type="email" 
          maxLength={100} 
          name="correo" 
          value={datos.correo} 
          onChange={onChange}
          placeholder="solicitante@email.com" 
          error={errores.correo}
        />
      </div>
    </div>
  );
};