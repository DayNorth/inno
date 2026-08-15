import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Doble de `BroadcastChannel`: jsdom no lo implementa.
 *
 * Respeta la regla que importa del estandar —un canal NO recibe sus propios
 * mensajes—, que es justo de lo que depende `canalSesion` para no crear un
 * bucle entre pestanas.
 */
class CanalFalso extends EventTarget {
  private static readonly abiertos = new Map<string, Set<CanalFalso>>();

  constructor(readonly name: string) {
    super();
    const grupo = CanalFalso.abiertos.get(name) ?? new Set<CanalFalso>();
    grupo.add(this);
    CanalFalso.abiertos.set(name, grupo);
  }

  postMessage(data: unknown): void {
    for (const otro of CanalFalso.abiertos.get(this.name) ?? []) {
      if (otro === this) continue; // nunca a uno mismo
      otro.dispatchEvent(new MessageEvent("message", { data }));
    }
  }

  close(): void {
    CanalFalso.abiertos.get(this.name)?.delete(this);
  }

  static reiniciar(): void {
    CanalFalso.abiertos.clear();
  }
}

async function importarConCanal() {
  vi.stubGlobal("BroadcastChannel", CanalFalso);
  vi.resetModules();
  return await import("@/shared/auth/canalSesion");
}

describe("canalSesion con soporte de BroadcastChannel", () => {
  beforeEach(() => {
    CanalFalso.reiniciar();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  /** Criterio 7 de frontend-seguridad.md §10. */
  it("la otra pestana recibe el cierre con su motivo", async () => {
    const { alCerrarEnOtraPestana } = await importarConCanal();

    const recibido = vi.fn();
    const desuscribir = alCerrarEnOtraPestana(recibido);

    // Otra pestana: canal distinto, mismo nombre.
    new CanalFalso("vinkaplant-sesion").postMessage({
      tipo: "cierre",
      motivo: "inactividad",
    });

    expect(recibido).toHaveBeenCalledWith("inactividad");
    desuscribir();
  });

  it("no se recibe el propio anuncio: no hay bucle entre pestanas", async () => {
    const { alCerrarEnOtraPestana, anunciarCierre } = await importarConCanal();

    const recibido = vi.fn();
    const desuscribir = alCerrarEnOtraPestana(recibido);

    anunciarCierre("manual");

    expect(recibido).not.toHaveBeenCalled();
    desuscribir();
  });

  it("el anuncio llega a las demas pestanas", async () => {
    const { anunciarCierre } = await importarConCanal();

    const otra = new CanalFalso("vinkaplant-sesion");
    const recibido = vi.fn();
    otra.addEventListener("message", recibido);

    anunciarCierre("expiracion");

    expect(recibido).toHaveBeenCalledTimes(1);
  });

  it("tras desuscribirse deja de recibir", async () => {
    const { alCerrarEnOtraPestana } = await importarConCanal();

    const recibido = vi.fn();
    alCerrarEnOtraPestana(recibido)();

    new CanalFalso("vinkaplant-sesion").postMessage({
      tipo: "cierre",
      motivo: "manual",
    });

    expect(recibido).not.toHaveBeenCalled();
  });

  it("ignora mensajes ajenos en el mismo canal", async () => {
    const { alCerrarEnOtraPestana } = await importarConCanal();

    const recibido = vi.fn();
    const desuscribir = alCerrarEnOtraPestana(recibido);

    new CanalFalso("vinkaplant-sesion").postMessage({ tipo: "otra-cosa" });

    expect(recibido).not.toHaveBeenCalled();
    desuscribir();
  });
});

/**
 * jsdom no implementa BroadcastChannel, asi que este bloque ejercita el camino
 * de respaldo tal cual corre en un motor sin soporte: la aplicacion sigue
 * funcionando, simplemente sin propagacion.
 */
describe("canalSesion sin soporte de BroadcastChannel", () => {
  it("no lanza al anunciar ni al suscribirse", async () => {
    const { alCerrarEnOtraPestana, anunciarCierre, MENSAJE_POR_MOTIVO } =
      await import("@/shared/auth/canalSesion");

    const recibido = vi.fn();
    const desuscribir = alCerrarEnOtraPestana(recibido);

    expect(() => {
      anunciarCierre("manual");
    }).not.toThrow();
    expect(() => {
      desuscribir();
    }).not.toThrow();
    expect(recibido).not.toHaveBeenCalled();

    // Cada motivo tiene mensaje: el usuario siempre sabe por que salio.
    for (const motivo of ["manual", "inactividad", "expiracion", "otraPestana"] as const) {
      expect(MENSAJE_POR_MOTIVO[motivo]).not.toBe("");
    }
  });
});
