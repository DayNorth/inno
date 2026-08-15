/**
 * Lectura de los claims del access token.
 *
 * ATENCION: NO se verifica la firma. Es correcto —el cliente no tiene la
 * clave— y significa que estos claims solo valen para decidir que pinta la
 * interfaz. La autoridad de autorizacion es el backend (contrato-api.md §1.2).
 */
import * as v from "@/shared/verificar/primitivas";
import { esIdRol, type IdRol } from "@/shared/tipos/rol";
import { idUsuario, type IdUsuario } from "@/shared/tipos/marca";

export interface ClaimsAcceso {
  readonly id_usuario: IdUsuario;
  readonly correo: string;
  readonly id_rol: IdRol;
  readonly rol: string;
  readonly exp: number;
}

function base64UrlADecodificado(segmento: string): string {
  const base64 = segmento.replace(/-/g, "+").replace(/_/g, "/");
  const relleno = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  const binario = atob(relleno);
  const bytes = Uint8Array.from(binario, (c) => c.codePointAt(0) ?? 0);
  return new TextDecoder().decode(bytes);
}

/** Devuelve los claims, o `null` si el token no es legible o no cuadra. */
export function decodificarJwt(token: string): ClaimsAcceso | null {
  const partes = token.split(".");
  const carga = partes[1];
  if (partes.length !== 3 || carga === undefined) return null;

  try {
    const crudo: unknown = JSON.parse(base64UrlADecodificado(carga));
    const o = v.objeto(crudo, "claims");

    const rolNumerico = v.entero(o.id_rol, "claims.id_rol");
    if (!esIdRol(rolNumerico)) return null;

    return {
      id_usuario: idUsuario(v.entero(o.id_usuario, "claims.id_usuario")),
      correo: v.texto(o.correo, "claims.correo"),
      id_rol: rolNumerico,
      rol: v.texto(o.rol, "claims.rol"),
      exp: v.entero(o.exp, "claims.exp"),
    };
  } catch {
    return null;
  }
}
