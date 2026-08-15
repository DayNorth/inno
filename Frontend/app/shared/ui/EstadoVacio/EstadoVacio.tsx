import type { ReactNode } from "react";

interface Props {
  readonly titulo: string;
  readonly detalle?: string;
  readonly children?: ReactNode;
}

export function EstadoVacio({ titulo, detalle, children }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-ink-soft">
      <p className="font-titulos text-lg text-ink">{titulo}</p>
      {detalle !== undefined && <p className="max-w-[42ch] text-sm">{detalle}</p>}
      {children}
    </div>
  );
}
