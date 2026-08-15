import type { ReactNode } from "react";
import { IconoBuscar } from "@/shared/ui/Icono/Iconos";

interface Props {
  readonly filtro: string;
  readonly onFiltroChange: (valor: string) => void;
  readonly etiquetaBusqueda: string;
  readonly mostrando: number;
  readonly total: number;
  readonly children?: ReactNode;
}

/**
 * Barra sobre la tabla: busqueda de texto (filtra lo ya cargado, no pide al
 * servidor) + contador + hueco para filtros propios de cada pantalla
 * (p. ej. "Ver tambien inactivos" en Clientes).
 */
export function ToolbarTabla({
  filtro,
  onFiltroChange,
  etiquetaBusqueda,
  mostrando,
  total,
  children,
}: Props) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <IconoBuscar className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-tenue" />
          <input
            type="search"
            value={filtro}
            onChange={(e) => {
              onFiltroChange(e.target.value);
            }}
            placeholder={etiquetaBusqueda}
            aria-label={etiquetaBusqueda}
            className="w-64 rounded-full border border-line bg-paper py-2 pr-3 pl-9 text-sm text-ink placeholder:text-ink-tenue"
          />
        </div>
        {children}
      </div>
      <p className="text-xs text-ink-tenue">
        Mostrando {mostrando} de {total} {total === 1 ? "registro" : "registros"}
      </p>
    </div>
  );
}
