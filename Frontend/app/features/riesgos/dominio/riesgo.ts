import * as v from "@/shared/verificar/primitivas";
import { idRiesgo, type IdRiesgo } from "@/shared/tipos/marca";
import { ErrorDeContrato } from "@/shared/verificar/primitivas";
import type { TonoBadge } from "@/shared/ui/Badge/Badge";

/** CHECK BETWEEN 1 AND 5 en la base de datos. */
export type Escala = 1 | 2 | 3 | 4 | 5;

export const LARGOS_RIESGO = {
  sistema: 50,
  categoria: 30,
  descripcion: 255,
  control_mitigante: 255,
} as const;

export interface Riesgo {
  readonly id_riesgo: IdRiesgo;
  readonly sistema: string;
  readonly categoria: string;
  readonly descripcion: string;
  readonly probabilidad: Escala;
  readonly impacto: Escala;
  readonly control_mitigante: string | null;
  readonly fecha_registro: string;
}

function aEscala(x: unknown, ruta: string): Escala {
  const n = v.entero(x, ruta);
  if (n < 1 || n > 5) throw new ErrorDeContrato(ruta);
  return n as Escala;
}

export function aRiesgo(x: unknown, ruta = "riesgo"): Riesgo {
  const o = v.objeto(x, ruta);
  return {
    id_riesgo: idRiesgo(v.entero(o.id_riesgo, `${ruta}.id_riesgo`)),
    sistema: v.texto(o.sistema, `${ruta}.sistema`),
    categoria: v.texto(o.categoria, `${ruta}.categoria`),
    descripcion: v.texto(o.descripcion, `${ruta}.descripcion`),
    probabilidad: aEscala(o.probabilidad, `${ruta}.probabilidad`),
    impacto: aEscala(o.impacto, `${ruta}.impacto`),
    control_mitigante: v.textoNulable(
      o.control_mitigante,
      `${ruta}.control_mitigante`,
    ),
    fecha_registro: v.fechaIso(o.fecha_registro, `${ruta}.fecha_registro`),
  };
}

export const aListaRiesgos = (x: unknown): Riesgo[] =>
  v.lista(x, "riesgos", aRiesgo);

export interface DatosRiesgo {
  readonly sistema: string;
  readonly categoria: string;
  readonly descripcion: string;
  readonly probabilidad: number;
  readonly impacto: number;
  readonly control_mitigante: string | null;
}

/**
 * Criticidad = probabilidad x impacto.
 *
 * Es una columna DERIVADA, no del backend. La lista ya viene ordenada por ese
 * producto (contrato-api.md §8.1); mostrarlo explica el orden, que si no parece
 * arbitrario. NO se reordena en cliente por defecto.
 */
export const criticidad = (r: Riesgo): number => r.probabilidad * r.impacto;

export interface NivelCriticidad {
  readonly etiqueta: string;
  readonly tono: TonoBadge;
}

export function nivelDeCriticidad(valor: number): NivelCriticidad {
  if (valor >= 15) return { etiqueta: "Alto", tono: "malo" };
  if (valor >= 8) return { etiqueta: "Medio", tono: "aviso" };
  return { etiqueta: "Bajo", tono: "ok" };
}
