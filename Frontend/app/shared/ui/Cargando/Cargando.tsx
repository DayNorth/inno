import { cx } from "@/shared/utils/cx";

interface Props {
  readonly mensaje?: string;
  /** Ocupa la pantalla: para el `HydrateFallback` del root. */
  readonly pantallaCompleta?: boolean;
}

export function Cargando({ mensaje = "Cargando…", pantallaCompleta }: Props) {
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center gap-3 px-4 py-12 text-ink-soft",
        pantallaCompleta === true && "min-h-[60vh]",
      )}
      role="status"
      aria-live="polite"
    >
      <span
        className="h-7 w-7 animate-spin rounded-full border-[3px] border-line border-t-marca"
        aria-hidden="true"
      />
      <p>{mensaje}</p>
    </div>
  );
}
