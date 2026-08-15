import { pedir } from "@/shared/api/cliente";
import { aListaBitacora, type EntradaBitacora } from "../dominio/bitacora";

/** Roles 1 y 3. Un rol 2 recibe 403 en toda la ruta, no solo en escrituras. */
export const listarBitacora = (signal?: AbortSignal): Promise<EntradaBitacora[]> =>
  pedir("/api/bitacora", aListaBitacora, { signal });
