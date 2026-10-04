import React, { useMemo, useEffect } from 'react';
import type { DatosActa, DatosOficina } from '../../types/actas';
import { InputField } from '../ui/InputField';
import { SelectField } from '../ui/SelectField';
import { Building2, FileText, MapPin } from 'lucide-react';
import {
  ESTADOS_VENEZUELA,
  filtrarOficinasCascada,
} from '../../data/catalogoGeo';

export interface ErroresActaUbicacion {
  anio?: string;
  co_acta?: string;
  tomo?: string;
  folio?: string;
  dia?: string;
  mes?: string;
  estado_id?: string;
  ourc_id?: string;
}

interface Props {
  datos: DatosActa;
  oficina: DatosOficina;
  errores?: ErroresActaUbicacion;
  onChangeActa: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeOficina: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  tipoActa?: string;
}

export const FormActaUbicacion: React.FC<Props> = ({
  datos,
  oficina,
  errores = {},
  onChangeActa,
  onChangeOficina,
  tipoActa = 'NACIMIENTO',
}) => {
  // Cascadas Geográficas
  const estadoSeleccionado = ESTADOS_VENEZUELA.find(
    (e) => String(e.nu_geografico) === String(oficina.estado_id)
  );
  const municipiosDisponibles = estadoSeleccionado?.municipios || [];
  const municipioSeleccionado = municipiosDisponibles.find(
    (m) => String(m.nu_geografico) === String(oficina.municipio_id)
  );
  const parroquiasDisponibles = municipioSeleccionado?.parroquias || [];

  // Filtrado de OURC en cascada: Estado -> Municipio -> Parroquia (opcional)
  const oficinasDisponibles = useMemo(() => {
    return filtrarOficinasCascada(
      oficina.estado_id,
      oficina.municipio_id,
      oficina.parroquia_id
    );
  }, [oficina.estado_id, oficina.municipio_id, oficina.parroquia_id]);

  // Si la lista de oficinas cambia y la oficina seleccionada no pertenece a la lista, auto-seleccionar la primera
  useEffect(() => {
    if (oficinasDisponibles.length > 0) {
      const existe = oficinasDisponibles.some(
        (o) => String(o.co_oficina) === String(oficina.ourc_id)
      );
      if (!existe) {
        onChangeOficina({
          target: { name: 'ourc_id', value: String(oficinasDisponibles[0].co_oficina) },
        } as any);
      }
    }
  }, [oficinasDisponibles, oficina.ourc_id]);

  const oficinaActual = oficinasDisponibles.find(
    (o) => String(o.co_oficina) === String(oficina.ourc_id)
  ) || oficinasDisponibles[0];

  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoEstado = e.target.value;
    onChangeOficina(e);

    // Reiniciar municipio, parroquia y oficina al cambiar de estado
    const est = ESTADOS_VENEZUELA.find((item) => String(item.nu_geografico) === nuevoEstado);
    const primerMun = est?.municipios[0]?.nu_geografico || '';
    onChangeOficina({
      target: { name: 'municipio_id', value: String(primerMun) },
    } as any);
    onChangeOficina({
      target: { name: 'parroquia_id', value: '' },
    } as any);
  };

  const handleMunicipioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeOficina(e);
    // Reiniciar parroquia al cambiar municipio
    onChangeOficina({
      target: { name: 'parroquia_id', value: '' },
    } as any);
  };

  const handleParroquiaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevaParroquia = e.target.value;
    onChangeOficina(e);

    // Calcular las oficinas filtradas con la nueva parroquia de inmediato
    const filtradas = filtrarOficinasCascada(
      oficina.estado_id,
      oficina.municipio_id,
      nuevaParroquia
    );

    // Si la oficina seleccionada previamente no pertenece a la nueva parroquia, auto-seleccionar la primera
    if (filtradas.length > 0) {
      const existe = filtradas.some(
        (o) => String(o.co_oficina) === String(oficina.ourc_id)
      );
      if (!existe) {
        onChangeOficina({
          target: { name: 'ourc_id', value: String(filtradas[0].co_oficina) },
        } as any);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Datos del Registro del Acta */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Datos del Registro del Acta ({tipoActa.replace('_', ' ')})
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InputField
            label="Año del Acta *"
            name="anio"
            type="number"
            maxLength={4}
            value={datos.anio}
            onChange={onChangeActa}
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
            onChange={onChangeActa}
            error={errores.co_acta}
            placeholder="Ej: 0045"
          />

          <InputField
            label="Tomo (opcional)"
            name="tomo"
            type="text"
            maxLength={10}
            value={datos.tomo}
            onChange={onChangeActa}
            error={errores.tomo}
            placeholder="Ej: 1"
            className="uppercase"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InputField
            label="Folio (opcional)"
            name="folio"
            type="text"
            maxLength={10}
            value={datos.folio || ''}
            onChange={onChangeActa}
            error={errores.folio}
            placeholder="Ej: 89"
            className="uppercase"
          />

          <InputField
            label="Día del Acto (opcional)"
            name="dia"
            type="number"
            maxLength={2}
            value={datos.dia}
            onChange={onChangeActa}
            error={errores.dia}
            placeholder="DD (1-31)"
          />

          <InputField
            label="Mes del Acto (opcional)"
            name="mes"
            type="number"
            maxLength={2}
            value={datos.mes}
            onChange={onChangeActa}
            error={errores.mes}
            placeholder="MM (1-12)"
          />
        </div>
      </div>

      {/* 2. Oficina de Registro Civil (OURC) en Cascada */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Oficina de Registro Civil (OURC)
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Estado */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Entidad Federal (Estado) <span className="text-red-500">*</span>
            </label>
            <SelectField
              name="estado_id"
              value={oficina.estado_id}
              onChange={handleEstadoChange}
              error={errores.estado_id}
            >
              {ESTADOS_VENEZUELA.map((e) => (
                <option key={e.nu_geografico} value={e.nu_geografico}>
                  {e.nb_geografico}
                </option>
              ))}
            </SelectField>
          </div>

          {/* Municipio */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Municipio <span className="text-red-500">*</span>
            </label>
            <SelectField
              name="municipio_id"
              value={oficina.municipio_id}
              onChange={handleMunicipioChange}
            >
              {municipiosDisponibles.map((m) => (
                <option key={m.nu_geografico} value={m.nu_geografico}>
                  {m.nb_geografico}
                </option>
              ))}
            </SelectField>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Parroquia (Opcional - Filtra OURC) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Parroquia <span className="text-slate-400 font-normal lowercase">(opcional - filtra oficinas)</span>
            </label>
            <SelectField
              name="parroquia_id"
              value={oficina.parroquia_id}
              onChange={handleParroquiaChange}
            >
              <option value="">-- Todas las Parroquias (Sin filtrar) --</option>
              {parroquiasDisponibles.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </SelectField>
          </div>

          {/* Oficina Registral (OURC) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Oficina Registral (OURC) <span className="text-red-500">*</span>{' '}
              <span className="text-blue-700 font-mono text-[10px] font-bold">
                ({oficinasDisponibles.length} disponible{oficinasDisponibles.length === 1 ? '' : 's'})
              </span>
            </label>
            <SelectField
              name="ourc_id"
              value={oficina.ourc_id}
              onChange={onChangeOficina}
              error={errores.ourc_id}
            >
              {oficinasDisponibles.map((o) => (
                <option key={o.co_oficina} value={o.co_oficina}>
                  {o.nb_oficina} ({o.co_ourc})
                </option>
              ))}
            </SelectField>
          </div>
        </div>

        {/* Resumen institucional de la oficina seleccionada */}
        {oficinaActual && (
          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs flex items-center justify-between text-blue-900">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Destino Registral:</strong> {oficinaActual.nb_oficina}
                {oficinaActual.nb_parroquia ? ` • Parroquia ${oficinaActual.nb_parroquia}` : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};