import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AVISO_MS,
  INACTIVIDAD_MS,
  TOPE_ABSOLUTO_MS,
  vigilarSesion,
} from "@/shared/auth/inactividad";

/** Criterios 8 y 9 de frontend-seguridad.md §10. */
describe("vigilarSesion", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function espias() {
    return { avisar: vi.fn(), cancelarAviso: vi.fn(), cerrar: vi.fn() };
  }

  it("avisa un minuto antes y cierra a los 15 min sin interaccion", () => {
    const al = espias();
    const detener = vigilarSesion(al);

    vi.advanceTimersByTime(INACTIVIDAD_MS - AVISO_MS);
    expect(al.avisar).toHaveBeenCalledTimes(1);
    expect(al.cerrar).not.toHaveBeenCalled();

    vi.advanceTimersByTime(AVISO_MS);
    expect(al.cerrar).toHaveBeenCalledWith("inactividad");

    detener();
  });

  it("la interaccion reinicia el contador y retira el aviso", () => {
    const al = espias();
    const detener = vigilarSesion(al);

    vi.advanceTimersByTime(INACTIVIDAD_MS - AVISO_MS);
    expect(al.avisar).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event("keydown"));
    expect(al.cancelarAviso).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(INACTIVIDAD_MS - AVISO_MS);
    expect(al.cerrar).not.toHaveBeenCalled();

    detener();
  });

  it("cierra a las 8 h aunque haya habido actividad continua", () => {
    const al = espias();
    const detener = vigilarSesion(al);

    // Un evento cada minuto: la inactividad nunca vence, el tope absoluto si.
    for (let t = 0; t < TOPE_ABSOLUTO_MS; t += 60_000) {
      window.dispatchEvent(new Event("pointerdown"));
      vi.advanceTimersByTime(60_000);
    }

    expect(al.cerrar).toHaveBeenCalledWith("expiracion");
    detener();
  });

  it("cierra una sola vez y deja de vigilar tras hacerlo", () => {
    const al = espias();
    const detener = vigilarSesion(al);

    vi.advanceTimersByTime(INACTIVIDAD_MS * 3);

    expect(al.cerrar).toHaveBeenCalledTimes(1);
    detener();
  });

  it("al detenerse no vuelve a disparar nada", () => {
    const al = espias();
    vigilarSesion(al)();

    vi.advanceTimersByTime(TOPE_ABSOLUTO_MS);

    expect(al.avisar).not.toHaveBeenCalled();
    expect(al.cerrar).not.toHaveBeenCalled();
  });
});
