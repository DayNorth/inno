/**
 * Propagacion del cierre de sesion entre pestanas (frontend-seguridad.md §6.1).
 *
 * El access token vive en memoria POR PESTANA. Sin esto, cerrar sesion en una
 * deja a las demas operando con su propio token hasta que expire (15 min) y con
 * su cache de datos intacta.
 *
 * `BroadcastChannel` es same-origin por definicion, que es exactamente el
 * alcance deseado.
 */

export type MotivoCierre =
  | "manual"
  | "inactividad"
  | "expiracion"
  | "otraPestana";

interface MensajeSesion {
  readonly tipo: "cierre";
  readonly motivo: MotivoCierre;
}

const NOMBRE_CANAL = "vinkaplant-sesion";

const canal: BroadcastChannel | null =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel(NOMBRE_CANAL)
    : null;

/** Avisa a las demas pestanas. Al recibir NO se re-emite: evita el bucle. */
export function anunciarCierre(motivo: MotivoCierre): void {
  canal?.postMessage({ tipo: "cierre", motivo } satisfies MensajeSesion);
}

export function alCerrarEnOtraPestana(
  manejador: (motivo: MotivoCierre) => void,
): () => void {
  if (canal === null) return () => {};

  const escucha = (e: MessageEvent<MensajeSesion>): void => {
    if (e.data.tipo === "cierre") manejador(e.data.motivo);
  };

  canal.addEventListener("message", escucha);
  return () => {
    canal.removeEventListener("message", escucha);
  };
}

export const MENSAJE_POR_MOTIVO: Record<MotivoCierre, string> = {
  manual: "Sesion cerrada correctamente.",
  inactividad: "Se cerro la sesion por inactividad.",
  expiracion: "Se alcanzo la duracion maxima de la sesion.",
  otraPestana: "Se cerro la sesion desde otra pestana.",
};
