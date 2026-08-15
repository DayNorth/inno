import { pedir } from "@/shared/api/cliente";
import * as v from "@/shared/verificar/primitivas";
import { aListaRiesgos, type DatosRiesgo, type Riesgo } from "../dominio/riesgo";

export const listarRiesgos = (signal?: AbortSignal): Promise<Riesgo[]> =>
  pedir("/api/riesgos", aListaRiesgos, { signal });

export const crearRiesgo = (datos: DatosRiesgo): Promise<string> =>
  pedir("/api/riesgos", v.mensaje, { metodo: "POST", cuerpo: datos });
