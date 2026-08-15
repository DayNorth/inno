import type { ReactNode } from "react";
import { cx } from "@/shared/utils/cx";
import "./Tabla.css";

/**
 * Clases de tabla, expuestas para que cada feature declare su `<colgroup>` y la
 * prioridad de sus columnas (frontend-ui.md §6) sin repetir CSS.
 *
 * `p2`/`p3` dependen de que un ancestro tenga `@container` (lo pone
 * `PanelTabla` en el contenedor con overflow-x, igual que antes con
 * `container-type: inline-size` en `.panel`): la prioridad reacciona al ancho
 * del PANEL, no al del viewport.
 */
export const t = {
  colId: "whitespace-nowrap",
  colNumero: "whitespace-nowrap text-right [font-variant-numeric:tabular-nums]",
  colFecha: "whitespace-nowrap",
  colEstado: "whitespace-nowrap",
  colAcciones: "whitespace-nowrap text-right",
  acciones: "flex justify-end gap-2",
  /** Se oculta bajo 44rem de contenedor. */
  p2: "@max-[44rem]:hidden",
  /** Se oculta bajo 60rem de contenedor. */
  p3: "@max-[60rem]:hidden",
  ancho5: "w-20",
  ancho6: "w-24",
  ancho7: "w-28",
  ancho8: "w-32",
  ancho9: "w-36",
  ancho10: "w-40",
  ancho11: "w-44",
  ancho12: "w-48",
  ancho14: "w-56",
  flexible: "w-auto",
} as const;

interface PanelProps {
  readonly children: ReactNode;
  readonly aviso?: string;
}

export function PanelTabla({ children, aviso }: PanelProps) {
  return (
    <div className="@container">
      <div className="overflow-x-auto rounded-md border border-line-soft bg-paper-raised shadow-1">
        {children}
      </div>
      {aviso !== undefined && (
        <p className="border-t border-line-soft px-4 py-2 text-xs text-ink-tenue">{aviso}</p>
      )}
    </div>
  );
}

interface TablaProps {
  readonly children: ReactNode;
  /** Para listas muy largas sin paginacion en el contrato (bitacora). */
  readonly filasDiferidas?: boolean;
  readonly etiqueta: string;
}

export function Tabla({ children, filasDiferidas, etiqueta }: TablaProps) {
  return (
    <table
      className={cx(
        "tabla-vp w-full table-fixed border-collapse text-sm",
        filasDiferidas === true && "tabla-vp--filas-diferidas",
      )}
      aria-label={etiqueta}
    >
      {children}
    </table>
  );
}
