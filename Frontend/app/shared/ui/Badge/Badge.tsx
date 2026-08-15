import { cx } from "@/shared/utils/cx";

export type TonoBadge = "ok" | "aviso" | "malo" | "info" | "neutro";

interface Props {
  readonly tono: TonoBadge;
  readonly children: string;
}

/*
 * Ningun estado se comunica solo por color: el badge siempre lleva texto.
 * (frontend-ui.md §8.13)
 */
const CLASE: Record<TonoBadge, string> = {
  ok: "bg-ok-suave border-ok/30 text-ok",
  aviso: "bg-warn-suave border-warn/30 text-warn",
  malo: "bg-bad-suave border-bad/30 text-bad",
  info: "bg-info-suave border-info/30 text-info",
  neutro: "bg-neutro-suave border-neutro/30 text-neutro",
};

const PUNTO: Record<TonoBadge, string> = {
  ok: "bg-ok",
  aviso: "bg-warn",
  malo: "bg-bad",
  info: "bg-info",
  neutro: "bg-neutro",
};

export function Badge({ tono, children }: Props) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs leading-[1.6] font-semibold",
        CLASE[tono],
      )}
    >
      <span aria-hidden="true" className={cx("h-1.5 w-1.5 flex-none rounded-full", PUNTO[tono])} />
      {children}
    </span>
  );
}
