/**
 * Endpoints de `/api/auth` (contrato-api.md §2).
 */
import { pedir } from "@/shared/api/cliente";
import * as v from "@/shared/verificar/primitivas";
import { esIdRol, type IdRol } from "@/shared/tipos/rol";
import { idUsuario, type IdUsuario } from "@/shared/tipos/marca";
import { ErrorDeContrato } from "@/shared/verificar/primitivas";

export interface UsuarioLogin {
  readonly id_usuario: IdUsuario;
  readonly nombre: string;
  readonly correo: string;
  readonly id_rol: IdRol;
  readonly rol: string;
}

export interface RespuestaLogin {
  readonly token: string;
  readonly usuario: UsuarioLogin;
}

function aIdRol(x: unknown, ruta: string): IdRol {
  const n = v.entero(x, ruta);
  if (!esIdRol(n)) throw new ErrorDeContrato(ruta);
  return n;
}

export function aRespuestaLogin(x: unknown, ruta = "login"): RespuestaLogin {
  const o = v.objeto(x, ruta);
  const u = v.objeto(o.usuario, `${ruta}.usuario`);
  return {
    token: v.texto(o.token, `${ruta}.token`),
    usuario: {
      id_usuario: idUsuario(v.entero(u.id_usuario, `${ruta}.usuario.id_usuario`)),
      nombre: v.texto(u.nombre, `${ruta}.usuario.nombre`),
      correo: v.texto(u.correo, `${ruta}.usuario.correo`),
      id_rol: aIdRol(u.id_rol, `${ruta}.usuario.id_rol`),
      rol: v.texto(u.rol, `${ruta}.usuario.rol`),
    },
  };
}

export interface Credenciales {
  readonly correo: string;
  readonly password: string;
}

export const iniciarSesionEnServidor = (
  credenciales: Credenciales,
): Promise<RespuestaLogin> =>
  pedir("/api/auth/login", aRespuestaLogin, {
    metodo: "POST",
    cuerpo: credenciales,
  });

/**
 * Revoca la familia del refresh token en el servidor.
 * Es idempotente por contrato (responde 200 aunque no haya cookie), pero si la
 * red falla no se puede dejar la sesion local abierta: el llamador limpia
 * igualmente. Por eso esta funcion no propaga el error.
 */
export async function cerrarSesionEnServidor(): Promise<void> {
  try {
    await pedir("/api/auth/logout", v.mensaje, { metodo: "POST" });
  } catch {
    // Intencionadamente silencioso: el cierre local ocurre pase lo que pase.
  }
}
