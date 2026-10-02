import React from 'react';
import { UserCheck, Info, AlertTriangle, Users } from 'lucide-react';
import type { DatosSolicitante } from '../../types/actas';

interface Props {
  tipoActa: string; // 'NACIMIENTO' | 'DEFUNCION' | 'NAC' | 'DEF'
  parentesco: string;
  parentescoOtro: string;
  onChangeParentesco: (nuevoParentesco: string) => void;
  onChangeParentescoOtro: (otro: string) => void;
  solicitante?: DatosSolicitante;
}

const OPCIONES_NACIMIENTO = [
  { value: 'YO', label: 'YO (Titular / Presentado)', desc: 'El solicitante es el propio presentado' },
  { value: 'MADRE', label: 'MADRE', desc: 'La solicitante es la madre del presentado' },
  { value: 'PADRE', label: 'PADRE', desc: 'El solicitante es el padre del presentado' },
  { value: 'HIJO', label: 'HIJO / HIJA', desc: 'Hijo(a) del presentado' },
  { value: 'ABUELO', label: 'ABUELO / ABUELA', desc: 'Ascendente de segundo grado' },
  { value: 'HERMANO', label: 'HERMANO / HERMANA', desc: 'Hermano(a) del presentado' },
  { value: 'REPRESENTANTE LEGAL', label: 'REPRESENTANTE LEGAL / TUTOR', desc: 'Custodia o tutela legal certificada' },
  { value: 'OTRO', label: 'OTRO (ESPECIFIQUE)', desc: 'Indicar parentesco o afinidad específica' }
];

const OPCIONES_DEFUNCION = [
  { value: 'CONYUGE', label: 'CÓNYUGE / PAREJA', desc: 'Esposo(a) o pareja en unión de hecho' },
  { value: 'HIJO/HIJA', label: 'HIJO / HIJA', desc: 'Descendiente directo del fallecido' },
  { value: 'PADRE/MADRE', label: 'PADRE / MADRE', desc: 'Progenitor del fallecido' },
  { value: 'HERMANO/HERMANA', label: 'HERMANO / HERMANA', desc: 'Hermano(a) del fallecido' },
  { value: 'FAMILIAR DIRECTO', label: 'FAMILIAR DIRECTO', desc: 'Tío, primo, sobrino u otro consanguíneo' },
  { value: 'OTRO', label: 'OTRO (ESPECIFIQUE)', desc: 'Indicar relación legal o familiar' }
];

export const FormAsociacionParentesco: React.FC<Props> = ({
  tipoActa,
  parentesco,
  parentescoOtro,
  onChangeParentesco,
  onChangeParentescoOtro,
  solicitante
}) => {
  const isDefuncion = tipoActa === 'DEF' || tipoActa === 'DEFUNCION';
  const opciones = isDefuncion ? OPCIONES_DEFUNCION : OPCIONES_NACIMIENTO;

  const sexoNormalizado = (solicitante?.sexo || '').toUpperCase().trim();
  const isMasculino = sexoNormalizado === 'M' || sexoNormalizado === 'MASCULINO';
  const isFemenino = sexoNormalizado === 'F' || sexoNormalizado === 'FEMENINO';
  const tieneCedula = Boolean(solicitante?.cedula && String(solicitante.cedula).trim() !== '');

  return (
    <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs space-y-4">
      <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
        <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span>Asociación / Parentesco con el Trámite</span>
        </h3>
        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
          Requisito CNE
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Indique el parentesco o vínculo del solicitante con {isDefuncion ? 'el Fallecido' : 'el Presentado'} <span className="text-red-600">*</span>
          </label>
          <select
            value={parentesco}
            onChange={(e) => onChangeParentesco(e.target.value)}
            className="w-full border border-blue-200 bg-blue-50/30 hover:bg-white rounded-xl p-2.5 text-xs font-bold uppercase text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
            required
          >
            <option value="">-- SELECCIONE PARENTESCO / ASOCIACIÓN --</option>
            {opciones.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>

        {/* Campo dinámico cuando se selecciona "OTRO" */}
        {parentesco === 'OTRO' && (
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5 animate-fadeIn">
            <label className="block text-xs font-bold text-amber-950">
              Especifique el Parentesco o Relación <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={parentescoOtro}
              onChange={(e) => onChangeParentescoOtro(e.target.value.toUpperCase())}
              placeholder="EJ: PRIMO HERMANO, APODERADO LEGAL, VECINO..."
              className="w-full border border-amber-300 bg-white rounded-lg p-2 text-xs font-semibold uppercase text-slate-800 focus:ring-2 focus:ring-amber-500"
              required
            />
            <p className="text-[11px] text-amber-800">
              Describa el vínculo de afinidad, consanguinidad o representación con el titular del acta.
            </p>
          </div>
        )}

        {/* Notificaciones y Feedback de Autocompletado */}
        {parentesco === 'YO' && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-fadeIn">
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Autocompletado Activo:</strong> Se han cargado automáticamente los datos de la persona <strong>Solicitante</strong> en la sección del <strong>Presentado</strong>.
            </span>
          </div>
        )}

        {!isDefuncion && parentesco === 'MADRE' && (
          tieneCedula ? (
            isMasculino ? (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Inconsistencia de Género:</span>
                  <span>La persona solicitante está registrada como sexo <strong>MASCULINO</strong> y no puede ser asignada como Madre. Complete los datos de la Madre directamente en el formulario inferior.</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-fadeIn">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Autocompletado Activo:</strong> Se han cargado automáticamente los datos de la solicitante en la sección de la <strong>Madre</strong>.
                </span>
              </div>
            )
          ) : (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2 animate-fadeIn">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Sugerencia:</strong> Ingrese la cédula de la solicitante arriba para autocompletar la sección de la Madre, o llénela directamente abajo.
              </span>
            </div>
          )
        )}

        {!isDefuncion && parentesco === 'PADRE' && (
          tieneCedula ? (
            isFemenino ? (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Inconsistencia de Género:</span>
                  <span>La persona solicitante está registrada como sexo <strong>FEMENINO</strong> y no puede ser asignada como Padre. Complete los datos del Padre directamente en el formulario inferior.</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-fadeIn">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Autocompletado Activo:</strong> Se han cargado automáticamente los datos del solicitante en la sección del <strong>Padre</strong>.
                </span>
              </div>
            )
          ) : (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2 animate-fadeIn">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Sugerencia:</strong> Ingrese la cédula del solicitante arriba para autocompletar la sección del Padre, o llénela directamente abajo.
              </span>
            </div>
          )
        )}

        {isDefuncion && parentesco && parentesco !== 'OTRO' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2 animate-fadeIn">
            <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Vínculo Registrado:</strong> Se asoció al solicitante con el rol <strong>{opciones.find(o => o.value === parentesco)?.label || parentesco}</strong>. Complete los datos del acta y del fallecido a continuación.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
