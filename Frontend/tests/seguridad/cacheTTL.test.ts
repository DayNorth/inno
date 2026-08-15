import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { conCache, limpiarCache, TTL_CATALOGO_MS } from "@/shared/api/cacheTTL";

describe("cache con TTL", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    limpiarCache();
  });

  afterEach(() => {
    vi.useRealTimers();
    limpiarCache();
  });

  it("no vuelve a cargar dentro del TTL", async () => {
    const cargar = vi.fn().mockResolvedValue(["uno"]);

    await conCache("usuarios", TTL_CATALOGO_MS, cargar);
    await conCache("usuarios", TTL_CATALOGO_MS, cargar);

    expect(cargar).toHaveBeenCalledTimes(1);
  });

  it("recarga cuando el TTL vence", async () => {
    const cargar = vi.fn().mockResolvedValue(["uno"]);

    await conCache("usuarios", 1000, cargar);
    vi.advanceTimersByTime(1001);
    await conCache("usuarios", 1000, cargar);

    expect(cargar).toHaveBeenCalledTimes(2);
  });

  it("cada clave se cachea por separado", async () => {
    const usuarios = vi.fn().mockResolvedValue(["u"]);
    const plataformas = vi.fn().mockResolvedValue(["p"]);

    await conCache("usuarios", TTL_CATALOGO_MS, usuarios);
    await conCache("plataformas", TTL_CATALOGO_MS, plataformas);

    expect(usuarios).toHaveBeenCalledTimes(1);
    expect(plataformas).toHaveBeenCalledTimes(1);
  });

  /**
   * Ningun dato de una sesion puede sobrevivir a la siguiente
   * (frontend-seguridad.md §4). `limpiarCache()` corre en el logout.
   */
  it("limpiarCache obliga a recargar: nada sobrevive al cierre de sesion", async () => {
    const cargar = vi.fn().mockResolvedValue(["dato del usuario anterior"]);

    await conCache("usuarios", TTL_CATALOGO_MS, cargar);
    limpiarCache();
    await conCache("usuarios", TTL_CATALOGO_MS, cargar);

    expect(cargar).toHaveBeenCalledTimes(2);
  });
});
