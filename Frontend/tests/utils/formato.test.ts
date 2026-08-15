import { describe, expect, it } from "vitest";
import {
  formatearFecha,
  formatearFechaHora,
  SIN_DATO,
} from "@/shared/utils/formato";

describe("formatearFecha (columnas SQL `date`)", () => {
  /**
   * Regresion de D-C: `new Date("2026-07-16")` es medianoche UTC, y en es-CR
   * (UTC-6) se renderizaba como "15 jul 2026, 6:00 p. m." — un dia antes.
   */
  it("no retrocede un dia en husos horarios negativos", () => {
    expect(formatearFecha("2026-07-16")).toBe("16/07/2026");
  });

  it("ignora el componente horario que anada el driver", () => {
    expect(formatearFecha("2026-07-16T00:00:00.000Z")).toBe("16/07/2026");
  });

  it("no muestra hora en una columna `date`", () => {
    expect(formatearFecha("2026-07-16")).not.toMatch(/\d{1,2}:\d{2}/);
  });

  it.each([null, undefined, "", "no-es-una-fecha"])(
    "devuelve el guion para %s",
    (entrada) => {
      expect(formatearFecha(entrada)).toBe(SIN_DATO);
    },
  );
});

describe("formatearFechaHora (columnas SQL `datetime`)", () => {
  it("si muestra la hora, porque ahi es un dato real", () => {
    expect(formatearFechaHora("2026-07-16T15:30:00.000Z")).toMatch(
      /\d{1,2}:\d{2}/,
    );
  });

  it("devuelve el guion cuando no hay valor", () => {
    expect(formatearFechaHora(null)).toBe(SIN_DATO);
  });
});
