import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/shared/utils/cx";

export type VarianteBoton = "primario" | "secundario" | "fantasma" | "peligro";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variante?: VarianteBoton;
  readonly pequeno?: boolean;
  readonly soloIcono?: boolean;
  readonly children: ReactNode;
}

const CLASE: Record<VarianteBoton, string> = {
  primario: "border-transparent bg-marca text-marca-contraste enabled:hover:bg-marca-fuerte",
  secundario:
    "border-line bg-paper text-ink enabled:hover:border-marca enabled:hover:text-marca",
  fantasma:
    "border-transparent bg-transparent text-ink-soft enabled:hover:text-marca",
  peligro: "border-transparent bg-bad text-white enabled:hover:brightness-[0.92]",
};

export function Boton({
  variante = "secundario",
  pequeno,
  soloIcono,
  className,
  type = "button",
  children,
  ...resto
}: Props) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-[0.55]",
        CLASE[variante],
        pequeno === true && "min-h-[1.875rem] px-3 py-1 text-xs",
        soloIcono === true && "min-w-8 p-1",
        className,
      )}
      {...resto}
    >
      {children}
    </button>
  );
}
