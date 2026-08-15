import * as v from "@/shared/verificar/primitivas";
import { idBitacora, idUsuario, type IdBitacora, type IdUsuario } from "@/shared/tipos/marca";

export interface EntradaBitacora {
  readonly id_bitacora: IdBitacora;
  readonly id_usuario: IdUsuario;
  readonly usuario: string;
  readonly accion: string;
  /** `datetime`: lleva hora real. */
  readonly fecha: string;
}

export function aEntradaBitacora(x: unknown, ruta = "entrada"): EntradaBitacora {
  const o = v.objeto(x, ruta);
  return {
    id_bitacora: idBitacora(v.entero(o.id_bitacora, `${ruta}.id_bitacora`)),
    id_usuario: idUsuario(v.entero(o.id_usuario, `${ruta}.id_usuario`)),
    usuario: v.texto(o.usuario, `${ruta}.usuario`),
    accion: v.texto(o.accion, `${ruta}.accion`),
    fecha: v.fechaIso(o.fecha, `${ruta}.fecha`),
  };
}

export const aListaBitacora = (x: unknown): EntradaBitacora[] =>
  v.lista(x, "bitacora", aEntradaBitacora);

/**
 * Filtro en cliente.
 *
 * El endpoint no pagina: devuelve la tabla entera (contrato-api.md §10.4).
 * Paginar de verdad requeriria cambiar el contrato, que esta congelado; esto
 * es la mitigacion posible desde el frontend.
 */
export function filtrarBitacora(
  entradas: readonly EntradaBitacora[],
  texto: string,
): EntradaBitacora[] {
  const aguja = texto.trim().toLowerCase();
  if (aguja === "") return [...entradas];
  return entradas.filter(
    (e) =>
      e.usuario.toLowerCase().includes(aguja) ||
      e.accion.toLowerCase().includes(aguja),
  );
}
