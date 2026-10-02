import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TablePaginationProps {
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  limitePorPagina: number;
  onCambiarPagina: (nuevaPagina: number) => void;
  onCambiarLimite: (nuevoLimite: number) => void;
  opcionesLimite?: number[];
  cargando?: boolean;
  etiquetaItem?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  paginaActual,
  totalPaginas,
  totalRegistros,
  limitePorPagina,
  onCambiarPagina,
  onCambiarLimite,
  opcionesLimite = [5, 10, 20, 50],
  cargando = false,
  etiquetaItem = 'registros',
}) => {
  if (totalRegistros <= 0) return null;

  const inicio = (paginaActual - 1) * limitePorPagina;
  const fin = Math.min(inicio + limitePorPagina, totalRegistros);

  const generarBotonesPagina = (actual: number, total: number): (number | string)[] => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const botones: (number | string)[] = [];
    if (actual <= 4) {
      for (let i = 1; i <= 5; i++) botones.push(i);
      botones.push('...');
      botones.push(total);
    } else if (actual >= total - 3) {
      botones.push(1);
      botones.push('...');
      for (let i = total - 4; i <= total; i++) botones.push(i);
    } else {
      botones.push(1);
      botones.push('...');
      botones.push(actual - 1);
      botones.push(actual);
      botones.push(actual + 1);
      botones.push('...');
      botones.push(total);
    }
    return botones;
  };

  return (
    <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      
      {/* Selector de límite y contador descriptivo */}
      <div className="flex flex-wrap items-center gap-3 text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium text-[11px]">Mostrar:</span>
          <select
            value={limitePorPagina}
            onChange={(e) => onCambiarLimite(Number(e.target.value))}
            disabled={cargando}
            aria-label={`Cantidad de ${etiquetaItem} por página`}
            className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {opcionesLimite.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion} por pág.
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-500">
          Mostrando <strong className="text-slate-800 font-semibold">{totalRegistros > 0 ? inicio + 1 : 0}</strong> a{' '}
          <strong className="text-slate-800 font-semibold">{fin}</strong> de{' '}
          <strong className="text-slate-800 font-semibold">{totalRegistros}</strong> {etiquetaItem} (Pág. {paginaActual} de {totalPaginas || 1})
        </div>
      </div>

      {/* Botones de navegación y páginas */}
      <div className="flex items-center gap-1">
        {/* Ir al inicio */}
        <button
          type="button"
          onClick={() => onCambiarPagina(1)}
          disabled={paginaActual <= 1 || cargando}
          title="Primera página"
          aria-label="Ir a la primera página"
          className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Página anterior */}
        <button
          type="button"
          onClick={() => onCambiarPagina(paginaActual - 1)}
          disabled={paginaActual <= 1 || cargando}
          title="Página anterior"
          aria-label="Ir a la página anterior"
          className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Números de página */}
        <div className="flex items-center gap-1 px-0.5">
          {generarBotonesPagina(paginaActual, totalPaginas || 1).map((item, idx) => {
            if (item === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1 text-slate-400 select-none font-bold text-xs">
                  ...
                </span>
              );
            }
            const num = Number(item);
            const esActivo = num === paginaActual;
            return (
              <button
                key={num}
                type="button"
                onClick={() => onCambiarPagina(num)}
                disabled={cargando || esActivo}
                className={`min-w-7 h-7 px-1.5 rounded-md font-semibold text-xs transition-all shadow-xs cursor-pointer ${
                  esActivo
                    ? 'bg-blue-950 text-white border border-blue-950 pointer-events-none'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Página siguiente */}
        <button
          type="button"
          onClick={() => onCambiarPagina(paginaActual + 1)}
          disabled={paginaActual >= totalPaginas || cargando}
          title="Página siguiente"
          aria-label="Ir a la página siguiente"
          className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Última página */}
        <button
          type="button"
          onClick={() => onCambiarPagina(totalPaginas)}
          disabled={paginaActual >= totalPaginas || cargando}
          title="Última página"
          aria-label="Ir a la última página"
          className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
