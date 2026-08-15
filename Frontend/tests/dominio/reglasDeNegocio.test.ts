import { describe, expect, it } from "vitest";
import { estadoSeguridadPrevisto } from "@/features/dispositivos/dominio/dispositivo";
import { evaluacionPrevista } from "@/features/proveedores/dominio/proveedor";
import { criticidad, nivelDeCriticidad } from "@/features/riesgos/dominio/riesgo";
import { idRiesgo } from "@/shared/tipos/marca";
import type { Riesgo } from "@/features/riesgos/dominio/riesgo";
import type { Escala } from "@/features/riesgos/dominio/riesgo";

/**
 * Estas reglas se replican en el cliente SOLO para previsualizar. La autoridad
 * es el servidor. Los tests fijan la replica al contrato para que no se
 * desvie en silencio y muestre al usuario un resultado que el backend no dara.
 */

describe("estado de seguridad de un dispositivo (contrato §7.3)", () => {
  it.each([
    [true, true, "Cumple"],
    [true, false, "No cumple"],
    [false, true, "No cumple"],
    [false, false, "No cumple"],
  ])("antivirus=%s ups=%s -> %s", (antivirus, ups, esperado) => {
    expect(estadoSeguridadPrevisto(antivirus, ups)).toBe(esperado);
  });
});

describe("evaluacion de proveedor (contrato §5.3)", () => {
  const criterios = (n: number) => ({
    cifrado_datos: n > 0,
    mfa_disponible: n > 1,
    sla_definido: n > 2,
    certificaciones_vigentes: n > 3,
  });

  it.each([
    [0, 0, "Rechazado", "Alto"],
    [1, 25, "Rechazado", "Alto"],
    [2, 50, "Rechazado", "Alto"],
    [3, 75, "Aprobado", "Medio"],
    [4, 100, "Aprobado", "Bajo"],
  ])(
    "%i criterios -> %i pts, %s, riesgo %s",
    (cuantos, puntaje, resultado, nivel) => {
      const previsto = evaluacionPrevista(criterios(cuantos));
      expect(previsto.puntaje).toBe(puntaje);
      expect(previsto.resultado).toBe(resultado);
      expect(previsto.nivel).toBe(nivel);
    },
  );

  /**
   * Los umbrales 85 y 60 no son alcanzables con incrementos de 25: el efecto
   * neto es que solo 75 y 100 aprueban. Se fija para que nadie "arregle" los
   * umbrales creyendo que hay un error.
   */
  it("solo 75 y 100 aprueban", () => {
    const aprobados = [0, 1, 2, 3, 4]
      .map((n) => evaluacionPrevista(criterios(n)))
      .filter((e) => e.resultado === "Aprobado")
      .map((e) => e.puntaje);

    expect(aprobados).toEqual([75, 100]);
  });
});

describe("criticidad de un riesgo (columna derivada)", () => {
  const riesgo = (probabilidad: Escala, impacto: Escala): Riesgo => ({
    id_riesgo: idRiesgo(1),
    sistema: "ERP",
    categoria: "Disponibilidad",
    descripcion: "x",
    probabilidad,
    impacto,
    control_mitigante: null,
    fecha_registro: "2026-07-16",
  });

  it("es probabilidad x impacto", () => {
    expect(criticidad(riesgo(4, 5))).toBe(20);
    expect(criticidad(riesgo(1, 1))).toBe(1);
  });

  it.each([
    [1, "Bajo"],
    [6, "Bajo"],
    [8, "Medio"],
    [12, "Medio"],
    [15, "Alto"],
    [25, "Alto"],
  ])("criticidad %i -> %s", (valor, etiqueta) => {
    expect(nivelDeCriticidad(valor).etiqueta).toBe(etiqueta);
  });

  it("nunca comunica el nivel solo por color: siempre lleva etiqueta", () => {
    for (const valor of [1, 8, 20]) {
      expect(nivelDeCriticidad(valor).etiqueta).not.toBe("");
    }
  });
});
