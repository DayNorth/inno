import * as v from "@/shared/verificar/primitivas";
import { idUsuario, type IdUsuario } from "@/shared/tipos/marca";
import { esIdRol, type IdRol } from "@/shared/tipos/rol";

/**
 * Usuario para la pantalla de administracion (rol Administrador). Incluye los
 * campos de deteccion de comportamiento anomalo (mejora del modelo ER):
 * intentos_fallidos, ultimo_acceso, mfa_activado.
 */
export interface UsuarioAdmin {
  readonly id_usuario: IdUsuario;
  readonly nombre: string;
  readonly correo: string;
  readonly rol: string;
  readonly id_rol: IdRol;
  readonly estado: string;
  readonly mfa_activado: boolean;
  readonly intentos_fallidos: number;
  readonly ultimo_acceso: string | null;
}

function idRolDesde(n: number, ruta: string): IdRol {
  if (!esIdRol(n)) throw new Error(`${ruta}: rol fuera de catalogo (${n})`);
  return n;
}

export function aUsuarioAdmin(x: unknown, ruta = "usuario"): UsuarioAdmin {
  const o = v.objeto(x, ruta);
  return {
    id_usuario: idUsuario(v.entero(o.id_usuario, `${ruta}.id_usuario`)),
    nombre: v.texto(o.nombre, `${ruta}.nombre`),
    correo: v.texto(o.correo, `${ruta}.correo`),
    rol: v.texto(o.rol, `${ruta}.rol`),
    id_rol: idRolDesde(v.entero(o.id_rol, `${ruta}.id_rol`), `${ruta}.id_rol`),
    estado: v.texto(o.estado, `${ruta}.estado`),
    mfa_activado: v.booleano(o.mfa_activado, `${ruta}.mfa_activado`),
    intentos_fallidos: v.entero(
      o.intentos_fallidos,
      `${ruta}.intentos_fallidos`,
    ),
    ultimo_acceso: v.fechaIsoNulable(
      o.ultimo_acceso,
      `${ruta}.ultimo_acceso`,
    ),
  };
}

export const aListaUsuariosAdmin = (x: unknown): UsuarioAdmin[] =>
  v.lista(x, "usuarios", aUsuarioAdmin);

/** Umbral de bloqueo (Backend/services/auth.service.js LIMITE_INTENTOS_FALLIDOS). */
export const LIMITE_INTENTOS_FALLIDOS = 5;
