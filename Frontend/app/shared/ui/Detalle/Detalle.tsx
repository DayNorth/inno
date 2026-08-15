import type { ReactNode } from "react";

/**
 * Excepcion a "la tabla manda": en las pantallas de detalle si hay dos
 * columnas, porque el formulario edita el objeto que se esta viendo
 * (frontend-ui.md §3.2). Colapsa a una columna por MEDIA query real (no de
 * contenedor): es la estructura global de la pagina, no un componente que
 * pueda vivir en varios contextos de ancho.
 */
export function RejillaDetalle({ children }: { readonly children: ReactNode }) {
  return (
    <div className="grid items-start gap-8 [grid-template-columns:minmax(0,2fr)_minmax(22rem,1fr)] max-[1100px]:grid-cols-1">
      {children}
    </div>
  );
}

export function ColumnaDetalle({ children }: { readonly children: ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-6">{children}</div>;
}

interface PanelProps {
  readonly titulo: string;
  readonly children: ReactNode;
}

export function PanelDetalle({ titulo, children }: PanelProps) {
  return (
    <section className="@container rounded-lg border border-line-soft bg-paper-raised p-6 shadow-1">
      <h2 className="mb-4 font-titulos text-lg">{titulo}</h2>
      {children}
    </section>
  );
}

export function ListaDatos({ children }: { readonly children: ReactNode }) {
  return (
    <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-4">{children}</dl>
  );
}

interface DatoProps {
  readonly etiqueta: string;
  readonly children: ReactNode;
}

export function Dato({ etiqueta, children }: DatoProps) {
  return (
    <div>
      <dt className="text-xs font-semibold text-ink-soft uppercase [letter-spacing:0.04em]">
        {etiqueta}
      </dt>
      <dd className="m-0 [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

export function ListaItems({ children }: { readonly children: ReactNode }) {
  return <div className="flex flex-col gap-3">{children}</div>;
}

interface ItemProps {
  readonly fecha: string;
  readonly cabecera: ReactNode;
  readonly children: ReactNode;
}

export function ItemDetalle({ fecha, cabecera, children }: ItemProps) {
  return (
    <article className="rounded-md border border-line-soft bg-paper p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>{cabecera}</div>
        <span className="text-xs text-ink-tenue">{fecha}</span>
      </div>
      <div className="text-sm [overflow-wrap:anywhere]">{children}</div>
    </article>
  );
}
