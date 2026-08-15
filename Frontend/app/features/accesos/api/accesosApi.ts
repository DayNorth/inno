import { pedir } from "@/shared/api/cliente";
import * as v from "@/shared/verificar/primitivas";
import type { IdAcceso } from "@/shared/tipos/marca";
import { aListaAccesos, type Acceso, type DatosAcceso } from "../dominio/acceso";

export const listarAccesos = (signal?: AbortSignal): Promise<Acceso[]> =>
  pedir("/api/accesos", aListaAccesos, { signal });

export const crearAcceso = (datos: DatosAcceso): Promise<string> =>
  pedir("/api/accesos", v.mensaje, { metodo: "POST", cuerpo: datos });

export const marcarAccesoRevisado = (id: IdAcceso): Promise<string> =>
  pedir(`/api/accesos/${id}/revisar`, v.mensaje, { metodo: "PATCH" });

/** Exclusivo de rol 1 (Administrador). El backend devuelve 403 al resto. */
export const revocarAcceso = (id: IdAcceso): Promise<string> =>
  pedir(`/api/accesos/${id}/revocar`, v.mensaje, { metodo: "PATCH" });
