import React from 'react';
import type { DatosActa } from '../../types/actas';
import { InputField } from '../ui/InputField';
import { Building2, FileText } from 'lucide-react';

export interface ErroresActaUbicacion {
  anio?: string;
  co_acta?: string;
  tomo?: string;
  folio?: string;
  dia?: string;
  mes?: string;
}

interface Props {
  datos: DatosActa;
  errores?: ErroresActaUbicacion;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  tipoActa?: string;
}

export const FormActaUbicacion: React.FC<Props> = ({
  datos,
  errores = {},
  onChange,
  tipoActa = 'NACIMIENTO',
}) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Datos del Acta a Certificar ({tipoActa.replace('_', ' ')})
        </span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <InputField
          label="Año del Acta"
          name="anio"
          type="number"
          maxLength={4}
          value={datos.anio}
          onChange={onChange}
          error={errores.anio}
          required
          placeholder="Ej: 2012"
        />

        <InputField
          label="N° de Acta (opcional)"
          name="co_acta"
          type="text"
          maxLength={10}
          value={datos.co_acta}
          onChange={onChange}
          error={errores.co_acta}
          placeholder="Ej: 0045"
        />

        <InputField
          label="Tomo (opcional)"
          name="tomo"
          type="text"
          maxLength={10}
          value={datos.tomo}
          onChange={onChange}
          error={errores.tomo}
          placeholder="Ej: 1"
          className="uppercase"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <InputField
          label="Folio"
          name="folio"
          type="text"
          maxLength={10}
          value={datos.folio || ''}
          onChange={onChange}
          error={errores.folio}
          placeholder="Ej: 89"
          className="uppercase"
        />

        <InputField
          label="Día del Acto"
          name="dia"
          type="number"
          maxLength={2}
          value={datos.dia}
          onChange={onChange}
          error={errores.dia}
          placeholder="DD (1-31)"
        />

        <InputField
          label="Mes del Acto"
          name="mes"
          type="number"
          maxLength={2}
          value={datos.mes}
          onChange={onChange}
          error={errores.mes}
          placeholder="MM (1-12)"
        />
      </div>

      {/* Oficina Registral Asignada a la Estación */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between text-slate-600">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>
            <strong>Oficina de Registro:</strong> 010101 - Registro Civil Parroquia Catedral (Oficina Local)
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
          Estación 01
        </span>
      </div>
    </div>
  );
};