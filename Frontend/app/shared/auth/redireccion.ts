import { RUTAS } from "@/rutas";

/** Caracteres de control: nunca son legitimos en una ruta. */
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001F\u007F]/;

/**
 * Normaliza el parametro `next` a una ruta INTERNA segura.
 *
 * Sin esto, `/login?next=https://evil.example` seria un redirect abierto: el
 * usuario recien autenticado acaba en un sitio ajeno con la credibilidad de
 * haber salido de la aplicacion.
 *
 * Rechaza: URLs absolutas, protocol-relative ("//evil"), "/\evil" (que varios
 * navegadores normalizan a "//evil") y cadenas con caracteres de control.
 *
 * Doble comprobacion deliberada: los prefijos se rechazan antes de parsear
 * (barato y explicito) y `new URL` confirma el origen (cubre lo no anticipado).
 */
export function rutaInternaSegura(bruta: string | null | undefined): string {
  if (typeof bruta !== "string" || bruta === "") return RUTAS.inicio;
  if (!bruta.startsWith("/")) return RUTAS.inicio;
  if (bruta.startsWith("//") || bruta.startsWith("/\\")) return RUTAS.inicio;
  if (CONTROL.test(bruta)) return RUTAS.inicio;

  try {
    const url = new URL(bruta, window.location.origin);
    if (url.origin !== window.location.origin) return RUTAS.inicio;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return RUTAS.inicio;
  }
}

/**
 * Construye el destino de login conservando a donde iba el usuario.
 * Nunca se pone PII ni tokens en la query: quedan en el historial, en el
 * `Referer` y en los logs del servidor.
 */
export function urlDeLoginDesde(destino: string): string {
  const seguro = rutaInternaSegura(destino);
  if (seguro === RUTAS.inicio) return RUTAS.login;
  return `${RUTAS.login}?next=${encodeURIComponent(seguro)}`;
}
