import type { ReactNode } from "react";

interface Props {
  readonly titulo: string;
  readonly subtitulo?: string;
  readonly acciones?: ReactNode;
}

export function EncabezadoPagina({ titulo, subtitulo, acciones }: Props) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1>{titulo}</h1>
        {subtitulo !== undefined && <p className="mt-1 text-sm text-ink-soft">{subtitulo}</p>}
      </div>
      {acciones !== undefined && <div className="flex flex-wrap gap-3">{acciones}</div>}
    </header>
  );
}
