import { pedir } from "@/shared/api/cliente";
import * as v from "@/shared/verificar/primitivas";
import type { IdUsuario } from "@/shared/tipos/marca";
import { aListaUsuariosAdmin, type UsuarioAdmin } from "../dominio/usuario";

export const listarUsuariosAdmin = (
  signal?: AbortSignal,
): Promise<UsuarioAdmin[]> =>
  pedir("/api/usuarios", aListaUsuariosAdmin, { signal });

export const desbloquearUsuario = (id: IdUsuario): Promise<string> =>
  pedir(`/api/usuarios/${id}/desbloquear`, v.mensaje, { metodo: "PATCH" });
