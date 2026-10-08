import React from 'react';
import type { DatosConyugues } from '../../types/actas';
import { useConsultaCiudadano } from '../../hooks/useConsultaCiudadano';
import { InputField } from '../ui/InputField';
import { Mail, CheckCircle2, UserCheck, Info } from 'lucide-react';

interface Props {
  datos: DatosConyugues;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onUpdateDatos?: (nuevosDatos: Partial<DatosConyugues>) => void;
  isCiudadano?: boolean;
  userSexo?: string; // 'F' | 'M'
  isOre?: boolean;
  userEmail?: string;
}

export const FormConyugues: React.FC<Props> = ({
  datos,
  onChange,
  onUpdateDatos,
  isCiudadano = false,
  userSexo = '',
  isOre = false,
  userEmail = '',
}) => {
  const sexoNormalizado = (userSexo || '').toUpperCase().trim();
  const esEllaSolicitante = isCiudadano && (sexoNormalizado === 'F' || sexoNormalizado === 'FEMENINO');
  const esElSolicitante = isCiudadano && (sexoNormalizado === 'M' || sexoNormalizado === 'MASCULINO');

  // Consulta SAIME para Cónyuge (Ella) - solo si no es la solicitante autenticada fija
  const { cargando: cargandoElla, bloqueado: bloqueadoElla, errorSexo: errorSexoElla } = useConsultaCiudadano(
    datos.nacionalidad_ella,
    esEllaSolicitante ? '' : datos.cedula_ella,
    (datosEncontrados) => {
      if (onUpdateDatos && !esEllaSolicitante) {
        onUpdateDatos({
          primer_nombre_ella: datosEncontrados.primer_nombre || '',
          segundo_nombre_ella: datosEncontrados.segundo_nombre || '',
          primer_apellido_ella: datosEncontrados.primer_apellido || '',
          segundo_apellido_ella: datosEncontrados.segundo_apellido || '',
        });
      }
    },
    () => {
      if (onUpdateDatos && !esEllaSolicitante) {
        onUpdateDatos({
          primer_nombre_ella: '',
          segundo_nombre_ella: '',
          primer_apellido_ella: '',
          segundo_apellido_ella: '',
        });
      }
    },
    {
      sexoEsperado: 'F',
      rolNombre: 'la Cónyuge (Ella)'
    }
  );

  // Consulta SAIME para Cónyuge (Él) - solo si no es el solicitante autenticado fijo
  const { cargando: cargandoEl, bloqueado: bloqueadoEl, errorSexo: errorSexoEl } = useConsultaCiudadano(
    datos.nacionalidad_el,
    esElSolicitante ? '' : datos.cedula_el,
    (datosEncontrados) => {
      if (onUpdateDatos && !esElSolicitante) {
        onUpdateDatos({
          primer_nombre_el: datosEncontrados.primer_nombre || '',
          segundo_nombre_el: datosEncontrados.segundo_nombre || '',
          primer_apellido_el: datosEncontrados.primer_apellido || '',
          segundo_apellido_el: datosEncontrados.segundo_apellido || '',
        });
      }
    },
    () => {
      if (onUpdateDatos && !esElSolicitante) {
        onUpdateDatos({
          primer_nombre_el: '',
          segundo_nombre_el: '',
          primer_apellido_el: '',
          segundo_apellido_el: '',
        });
      }
    },
    {
      sexoEsperado: 'M',
      rolNombre: 'el Cónyuge (Él)'
    }
  );

  const deshabilitarElla = esEllaSolicitante || bloqueadoElla;
  const deshabilitarEl = esElSolicitante || bloqueadoEl;

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4 font-sans">
      <div className="border-b border-gray-100 pb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-2">
          <span>💍</span> Datos del Acto y Cónyuges / Contrayentes
        </h3>
        {isCiudadano && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
            <UserCheck className="w-3.5 h-3.5" />
            Trámite Personal de Cónyuge
          </span>
        )}
      </div>

      {isOre && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Atención en Taquilla ORE:</strong> Ingrese los datos de ambos cónyuges y suministre el <strong>correo electrónico de al menos uno de ellos</strong> para la notificación y entrega del certificado digital.
          </p>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Fecha del Acto <span className="text-red-600 font-bold ml-0.5">*</span>
        </label>
        <InputField 
          type="date" 
          name="fecha_acto" 
          value={datos.fecha_acto} 
          onChange={onChange}
          className="w-full border border-gray-300 rounded-lg p-2 text-xs" 
          required 
        />
      </div>

      {/* ========================================================================= */}
      {/* CÓNYUGE ELLA */}
      {/* ========================================================================= */}
      <div className={`p-4 rounded-xl border space-y-3 transition-colors ${
        esEllaSolicitante ? 'bg-indigo-50/40 border-indigo-200' : 'bg-gray-50 border-gray-100'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-800 uppercase block">
              Cónyuge / Contrayente (Ella)
            </span>
            {esEllaSolicitante && (
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                <CheckCircle2 className="w-3 h-3" />
                Cónyuge Solicitante (Sesión)
              </span>
            )}
          </div>
          {!esEllaSolicitante && cargandoElla && <span className="text-xs text-amber-500 font-normal animate-pulse">Buscando datos CNE/SAIME...</span>}
          {!esEllaSolicitante && bloqueadoElla && <span className="text-xs text-emerald-600 font-semibold">✓ Verificado CNE/AC</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
              Nacionalidad <span className="text-red-600 font-bold ml-0.5">*</span>
            </label>
            <select 
              name="nacionalidad_ella" 
              value={datos.nacionalidad_ella} 
              onChange={onChange}
              disabled={esEllaSolicitante}
              className={`w-full border rounded-lg p-2 text-xs uppercase ${
                esEllaSolicitante ? 'bg-gray-100 text-gray-700 cursor-not-allowed border-gray-300 font-semibold' : 'border-gray-300'
              }`}
              required
            >
              <option value="V">V - VENEZOLANO</option>
              <option value="E">E - EXTRANJERO</option>
              <option value="P">P - PASAPORTE</option>
              <option value="O">O - OTRO</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
              Cédula <span className="text-red-600 font-bold ml-0.5">*</span>
            </label>
            <InputField 
              type="number" 
              maxLength={9}
              name="cedula_ella" 
              value={datos.cedula_ella} 
              onChange={onChange}
              disabled={esEllaSolicitante}
              placeholder="Ej: 12345678" 
              className={`w-full border rounded-lg p-2 text-xs font-mono ${
                esEllaSolicitante ? 'bg-gray-100 text-gray-700 cursor-not-allowed border-gray-300 font-bold' : 'border-gray-300'
              }`}
              required 
            />
          </div>
        </div>

        {errorSexoElla && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-2 animate-fadeIn">
            <span className="text-base leading-none">⚠️</span>
            <div className="flex-1">
              <span className="font-bold block">Inconsistencia de Género:</span>
              <span>{errorSexoElla}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Primer Nombre <span className="text-red-600 font-bold ml-0.5">*</span>
            </label>
            <InputField 
              type="text" 
              maxLength={50} 
              name="primer_nombre_ella" 
              value={datos.primer_nombre_ella} 
              onChange={onChange}
              disabled={deshabilitarElla}
              className={`w-full border rounded-lg p-2 text-xs uppercase ${deshabilitarElla ? 'bg-gray-100 text-gray-700 cursor-not-allowed font-medium' : 'border-gray-300'}`} 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Segundo Nombre</label>
            <InputField 
              type="text" 
              maxLength={50} 
              name="segundo_nombre_ella" 
              value={datos.segundo_nombre_ella || ''} 
              onChange={onChange}
              disabled={deshabilitarElla}
              className={`w-full border rounded-lg p-2 text-xs uppercase ${deshabilitarElla ? 'bg-gray-100 text-gray-700 cursor-not-allowed font-medium' : 'border-gray-300'}`} 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Primer Apellido <span className="text-red-600 font-bold ml-0.5">*</span>
            </label>
            <InputField 
              type="text" 
              maxLength={50} 
              name="primer_apellido_ella" 
              value={datos.primer_apellido_ella} 
              onChange={onChange}
              disabled={deshabilitarElla}
              className={`w-full border rounded-lg p-2 text-xs uppercase ${deshabilitarElla ? 'bg-gray-100 text-gray-700 cursor-not-allowed font-medium' : 'border-gray-300'}`} 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Segundo Apellido</label>
            <InputField 
              type="text" 
              maxLength={50} 
              name="segundo_apellido_ella" 
              value={datos.segundo_apellido_ella || ''} 
              onChange={onChange}
              disabled={deshabilitarElla}
              className={`w-full border rounded-lg p-2 text-xs uppercase ${deshabilitarElla ? 'bg-gray-100 text-gray-700 cursor-not-allowed font-medium' : 'border-gray-300'}`} 
            />
          </div>
        </div>

        {/* Campo de Correo Electrónico para Ella */}
        {esEllaSolicitante && (
          <div className="pt-2 border-t border-indigo-100">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-900 uppercase mb-1">
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              Correo del Solicitante (Para Entrega Digital) <span className="text-red-600 font-bold">*</span>
            </label>
            <InputField 
              type="email" 
              name="correo_ella" 
              value={datos.correo_ella || userEmail || ''} 
              onChange={onChange}
              disabled={true}
              className="w-full border border-indigo-200 bg-white rounded-lg p-2 text-xs font-mono text-indigo-900 font-semibold cursor-not-allowed"
              required 
            />
          </div>
        )}

        {isOre && (
          <div className="pt-2 border-t border-gray-200">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 uppercase mb-1">
              <Mail className="w-3.5 h-3.5 text-gray-500" />
              Correo Electrónico de la Cónyuge (Ella)
            </label>
            <InputField 
              type="email" 
              name="correo_ella" 
              value={datos.correo_ella || ''} 
              onChange={onChange}
              placeholder="ejemplo.ella@correo.com"
              className="w-full border border-gray-300 rounded-lg p-2 text-xs font-mono text-gray-800" 
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CÓNYUGE ÉL */}
      {/* ========================================================================= */}
      <div className={`p-4 rounded-xl border space-y-3 transition-colors ${
        esElSolicitante ? 'bg-indigo-50/40 border-indigo-200' : 'bg-gray-50 border-gray-100'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-800 uppercase block">
              Cónyuge / Contrayente (Él)
            </span>
            {esElSolicitante && (
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                <CheckCircle2 className="w-3 h-3" />
                Cónyuge Solicitante (Sesión)
              </span>
            )}
          </div>
          {!esElSolicitante && cargandoEl && <span className="text-xs text-amber-500 font-normal animate-pulse">Buscando datos CNE/SAIME...</span>}
          {!esElSolicitante && bloqueadoEl && <span className="text-xs text-emerald-600 font-semibold">✓ Verificado CNE/AC</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
              Nacionalidad <span className="text-red-600 font-bold ml-0.5">*</span>
            </label>
            <select 
              name="nacionalidad_el" 
              value={datos.nacionalidad_el} 
              onChange={onChange}
              disabled={esElSolicitante}
              className={`w-full border rounded-lg p-2 text-xs uppercase ${
                esElSolicitante ? 'bg-gray-100 text-gray-700 cursor-not-allowed border-gray-300 font-semibold' : 'border-gray-300'
              }`}
              required
            >
              <option value="V">V - VENEZOLANO</option>
              <option value="E">E - EXTRANJERO</option>
              <option value="P">P - PASAPORTE</option>
              <option value="O">O - OTRO</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
              Cédula <span className="text-red-600 font-bold ml-0.5">*</span>
            </label>
            <InputField 
              type="number" 
              maxLength={9}
              name="cedula_el" 
              value={datos.cedula_el} 
              onChange={onChange}
              disabled={esElSolicitante}
              placeholder="Ej: 12345678" 
              className={`w-full border rounded-lg p-2 text-xs font-mono ${
                esElSolicitante ? 'bg-gray-100 text-gray-700 cursor-not-allowed border-gray-300 font-bold' : 'border-gray-300'
              }`}
              required 
            />
          </div>
        </div>

        {errorSexoEl && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-2 animate-fadeIn">
            <span className="text-base leading-none">⚠️</span>
            <div className="flex-1">
              <span className="font-bold block">Inconsistencia de Género:</span>
              <span>{errorSexoEl}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Primer Nombre <span className="text-red-600 font-bold ml-0.5">*</span>
            </label>
            <InputField 
              type="text" 
              maxLength={50} 
              name="primer_nombre_el" 
              value={datos.primer_nombre_el} 
              onChange={onChange}
              disabled={deshabilitarEl}
              className={`w-full border rounded-lg p-2 text-xs uppercase ${deshabilitarEl ? 'bg-gray-100 text-gray-700 cursor-not-allowed font-medium' : 'border-gray-300'}`} 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Segundo Nombre</label>
            <InputField 
              type="text" 
              maxLength={50} 
              name="segundo_nombre_el" 
              value={datos.segundo_nombre_el || ''} 
              onChange={onChange}
              disabled={deshabilitarEl}
              className={`w-full border rounded-lg p-2 text-xs uppercase ${deshabilitarEl ? 'bg-gray-100 text-gray-700 cursor-not-allowed font-medium' : 'border-gray-300'}`} 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Primer Apellido <span className="text-red-600 font-bold ml-0.5">*</span>
            </label>
            <InputField 
              type="text" 
              maxLength={50} 
              name="primer_apellido_el" 
              value={datos.primer_apellido_el} 
              onChange={onChange}
              disabled={deshabilitarEl}
              className={`w-full border rounded-lg p-2 text-xs uppercase ${deshabilitarEl ? 'bg-gray-100 text-gray-700 cursor-not-allowed font-medium' : 'border-gray-300'}`} 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Segundo Apellido</label>
            <InputField 
              type="text" 
              maxLength={50} 
              name="segundo_apellido_el" 
              value={datos.segundo_apellido_el || ''} 
              onChange={onChange}
              disabled={deshabilitarEl}
              className={`w-full border rounded-lg p-2 text-xs uppercase ${deshabilitarEl ? 'bg-gray-100 text-gray-700 cursor-not-allowed font-medium' : 'border-gray-300'}`} 
            />
          </div>
        </div>

        {/* Campo de Correo Electrónico para Él */}
        {esElSolicitante && (
          <div className="pt-2 border-t border-indigo-100">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-900 uppercase mb-1">
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              Correo del Solicitante (Para Entrega Digital) <span className="text-red-600 font-bold">*</span>
            </label>
            <InputField 
              type="email" 
              name="correo_el" 
              value={datos.correo_el || userEmail || ''} 
              onChange={onChange}
              disabled={true}
              className="w-full border border-indigo-200 bg-white rounded-lg p-2 text-xs font-mono text-indigo-900 font-semibold cursor-not-allowed"
              required 
            />
          </div>
        )}

        {isOre && (
          <div className="pt-2 border-t border-gray-200">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 uppercase mb-1">
              <Mail className="w-3.5 h-3.5 text-gray-500" />
              Correo Electrónico del Cónyuge (Él)
            </label>
            <InputField 
              type="email" 
              name="correo_el" 
              value={datos.correo_el || ''} 
              onChange={onChange}
              placeholder="ejemplo.el@correo.com"
              className="w-full border border-gray-300 rounded-lg p-2 text-xs font-mono text-gray-800" 
            />
          </div>
        )}
      </div>

    </div>
  );
};