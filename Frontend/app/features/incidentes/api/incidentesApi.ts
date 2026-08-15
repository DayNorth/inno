import { pedir } from "@/shared/api/cliente";
import * as v from "@/shared/verificar/primitivas";
import type { IdIncidente } from "@/shared/tipos/marca";
import {
  aListaIncidentes,
  type DatosIncidente,
  type Incidente,
} from "../dominio/incidente";

export const listarIncidentes = (signal?: AbortSignal): Promise<Incidente[]> =>
  pedir("/api/incidentes", aListaIncidentes, { signal });

export const reportarIncidente = (datos: DatosIncidente): Promise<string> =>
  pedir("/api/incidentes", v.mensaje, { metodo: "POST", cuerpo: datos });

/** Sin `fecha_resolucion` el servicio usa la fecha/hora actual (§9.4). */
export const resolverIncidente = (
  id: IdIncidente,
  fechaResolucion: string | null,
): Promise<string> =>
  pedir(`/api/incidentes/${id}/resolver`, v.mensaje, {
    metodo: "PATCH",
    cuerpo: fechaResolucion === null ? {} : { fecha_resolucion: fechaResolucion },
  });
