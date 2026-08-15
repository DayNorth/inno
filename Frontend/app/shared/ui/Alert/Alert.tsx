import type { ReactNode } from "react";
import { cx } from "@/shared/utils/cx";

export type TonoAlert = "error" | "exito" | "aviso" | "info";

interface Props {
  readonly tono?: TonoAlert;
  readonly children: ReactNode;
  /** Identificador opaco para soporte. Nunca lleva PII. */
  readonly correlationId?: string | undefined;
}

const ICONO: Record<TonoAlert, string> = {
  error: "!",
  exito: "✓",
  aviso: "!",
  info: "i",
};

const CLASE: Record<TonoAlert, string> = {
  error: "bg-bad-suave border-bad",
  exito: "bg-ok-suave border-ok",
  aviso: "bg-warn-suave border-warn",
  info: "bg-info-suave border-info",
};

/** Los errores se anuncian solos; el resto no interrumpe al lector de pantalla. */
export function Alert({ tono = "error", children, correlationId }: Props) {
  return (
    <div
      className={cx(
        "flex items-start gap-3 rounded-md border py-3 px-4 text-sm text-ink",
        CLASE[tono],
      )}
      role={tono === "error" ? "alert" : "status"}
    >
      <span className="flex-none font-semibold leading-[1.4]" aria-hidden="true">
        {ICONO[tono]}
      </span>
      <div className="min-w-0 [overflow-wrap:anywhere]">
        {children}
        {correlationId !== undefined && (
          <span className="mt-1 block text-xs text-ink-soft">
            Referencia para soporte: <code>{correlationId}</code>
          </span>
        )}
      </div>
    </div>
  );
}
