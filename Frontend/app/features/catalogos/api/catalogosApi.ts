import { pedir } from "@/shared/api/cliente";
import { conCache, TTL_CATALOGO_MS } from "@/shared/api/cacheTTL";
import type { OpcionSelect } from "@/shared/ui/campos/CampoSelect";
import {
  aListaPlataformas,
  aListaProductos,
  aListaUsuarios,
  type Plataforma,
  type Producto,
  type UsuarioLookup,
} from "../dominio/catalogos";

/**
 * Los catalogos se repiten entre rutas y cambian poco dentro de una sesion:
 * son el caso que justifica el TTL de `cacheTTL` (arquitectura §4.3).
 * `limpiarCache()` en el logout los borra.
 */
export const listarUsuarios = (signal?: AbortSignal): Promise<UsuarioLookup[]> =>
  conCache("usuarios", TTL_CATALOGO_MS, () =>
    pedir("/api/usuarios", aListaUsuarios, { signal }),
  );

export const listarPlataformas = (signal?: AbortSignal): Promise<Plataforma[]> =>
  conCache("plataformas", TTL_CATALOGO_MS, () =>
    pedir("/api/plataformas", aListaPlataformas, { signal }),
  );

export const listarProductos = (signal?: AbortSignal): Promise<Producto[]> =>
  conCache("productos", TTL_CATALOGO_MS, () =>
    pedir("/api/productos", aListaProductos, { signal }),
  );

export const opcionesDeUsuarios = (
  usuarios: readonly UsuarioLookup[],
): OpcionSelect[] =>
  usuarios.map((u) => ({ valor: u.id_usuario, etiqueta: u.nombre }));

export const opcionesDePlataformas = (
  plataformas: readonly Plataforma[],
): OpcionSelect[] =>
  plataformas.map((p) => ({ valor: p.id_plataforma, etiqueta: p.nombre }));

export const opcionesDeProductos = (
  productos: readonly Producto[],
): OpcionSelect[] =>
  productos.map((p) => ({ valor: p.id_producto, etiqueta: p.nombre_producto }));
