import { describe, expect, it, vi } from "vitest";
import { logger } from "@/shared/observabilidad/logger";

describe("depuracion de PII en el logger", () => {
  it("omite las claves vetadas antes de emitir", () => {
    const espia = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logger.error("prueba", {
      correo: "ana@vinkaplant.cr",
      telefono: "+506 8888 8888",
      token: "eyJhbGciOi...",
      password: "secreto",
      ruta: "/api/clientes",
      correlationId: "abc-123",
    });

    const contexto = espia.mock.calls[0]?.[1] as Record<string, unknown>;

    expect(contexto.correo).toBe("[omitido]");
    expect(contexto.telefono).toBe("[omitido]");
    expect(contexto.token).toBe("[omitido]");
    expect(contexto.password).toBe("[omitido]");
    // Lo que no es PII si se conserva: sin ello el log no sirve para nada.
    expect(contexto.ruta).toBe("/api/clientes");
    expect(contexto.correlationId).toBe("abc-123");
  });

  it("no distingue mayusculas en el nombre de la clave", () => {
    const espia = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    logger.warn("prueba", { Correo: "x@y.z", AccessToken: "abc" });

    const contexto = espia.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(contexto.Correo).toBe("[omitido]");
    expect(contexto.AccessToken).toBe("[omitido]");
  });
});
