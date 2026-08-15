import { useEffect, useId, useRef, type ReactNode } from "react";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";
import { cx } from "@/shared/utils/cx";

export type TamanoModal = "estrecho" | "normal" | "ancho";

interface Props {
  readonly abierto: boolean;
  readonly titulo: string;
  readonly descripcion?: string | undefined;
  readonly tamano?: TamanoModal;
  readonly onCerrar: () => void;
  readonly children: ReactNode;
}

const CLASE_TAMANO: Record<TamanoModal, string> = {
  estrecho: "max-w-[28rem]",
  normal: "max-w-[44rem]",
  ancho: "max-w-[62rem]",
};

/**
 * Dialogo modal con foco encerrado, cierre por `Esc` y devolucion del foco al
 * disparador (lo hace `useFocusTrap` al desmontar).
 */
export function Modal({
  abierto,
  titulo,
  descripcion,
  tamano = "normal",
  onCerrar,
  children,
}: Props) {
  const dialogo = useRef<HTMLDivElement>(null);
  const idTitulo = useId();
  const idDescripcion = useId();

  useFocusTrap(dialogo, abierto);

  useEffect(() => {
    if (!abierto) return;

    const alPulsar = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCerrar();
      }
    };
    document.addEventListener("keydown", alPulsar);

    // Bloquea el scroll del documento mientras el dialogo esta abierto.
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", alPulsar);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    // El fondo es decorativo: cerrar pulsando fuera es un atajo, no la unica
    // via. `Esc` y el boton de cierre cubren teclado y lector de pantalla.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgb(8_20_18_/_55%)] px-4 py-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div
        ref={dialogo}
        className={cx(
          "@container m-auto w-full rounded-lg border border-line-soft bg-paper-raised shadow-3",
          CLASE_TAMANO[tamano],
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={descripcion === undefined ? undefined : idDescripcion}
        tabIndex={-1}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line-soft px-6 pt-6 pb-3">
          <div>
            <h2 id={idTitulo} className="font-titulos text-lg">
              {titulo}
            </h2>
            {descripcion !== undefined && (
              <p id={idDescripcion} className="mt-1 text-sm text-ink-soft">
                {descripcion}
              </p>
            )}
          </div>
          <button
            type="button"
            className="h-8 w-8 flex-none rounded-md text-lg leading-none text-ink-soft hover:bg-paper-sutil hover:text-ink"
            onClick={onCerrar}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
