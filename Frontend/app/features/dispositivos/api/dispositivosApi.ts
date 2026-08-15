import { pedir } from "@/shared/api/cliente";
import * as v from "@/shared/verificar/primitivas";
import {
  aListaDispositivos,
  type DatosDispositivo,
  type Dispositivo,
} from "../dominio/dispositivo";

export const listarDispositivos = (signal?: AbortSignal): Promise<Dispositivo[]> =>
  pedir("/api/dispositivos", aListaDispositivos, { signal });

export const crearDispositivo = (datos: DatosDispositivo): Promise<string> =>
  pedir("/api/dispositivos", v.mensaje, { metodo: "POST", cuerpo: datos });
