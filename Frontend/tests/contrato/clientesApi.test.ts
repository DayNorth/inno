import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { listarClientes } from "@/features/clientes/api/clientesApi";
import { API } from "../msw/manejadores";
import { servidor } from "../msw/servidor";

describe("frontera de confianza de /api/clientes", () => {
  it("verifica campo a campo una respuesta correcta", async () => {
    const clientes = await listarClientes();

    expect(clientes).toHaveLength(2);
    expect(clientes[0]?.nombre).toBe("ZhanHao Ltd");
    expect(clientes[1]?.pais).toBeNull();
  });

  it("descarta los campos que el backend anada y el frontend no conozca", async () => {
    servidor.use(
      http.get(`${API}/api/clientes`, () =>
        HttpResponse.json([
          {
            id_cliente: 1,
            nombre: "Vivero Norte",
            pais: null,
            correo: null,
            telefono: null,
            estado: "Activo",
            campo_nuevo: "no deberia propagarse",
          },
        ]),
      ),
    );

    const [cliente] = await listarClientes();
    expect(cliente).not.toHaveProperty("campo_nuevo");
  });

  it("no contamina el prototipo con una clave __proto__ maliciosa", async () => {
    servidor.use(
      http.get(`${API}/api/clientes`, () =>
        HttpResponse.json(
          JSON.parse(
            '[{"id_cliente":1,"nombre":"X","pais":null,"correo":null,"telefono":null,"estado":"Activo","__proto__":{"contaminado":true}}]',
          ) as Record<string, unknown>[],
        ),
      ),
    );

    await listarClientes();
    expect(({} as Record<string, unknown>).contaminado).toBeUndefined();
  });

  it("convierte una respuesta fuera de contrato en un ApiError, no en un crash", async () => {
    servidor.use(
      http.get(`${API}/api/clientes`, () =>
        HttpResponse.json([{ id_cliente: "uno", nombre: 42 }]),
      ),
    );

    await expect(listarClientes()).rejects.toSatisfy(
      (e: unknown) => e instanceof ApiError && e.clase === "contrato",
    );
  });

  /**
   * En desarrollo el error dice QUE campo se desvio. Sin eso, cualquier cambio
   * de contrato produce siempre el mismo texto opaco y hay que salir a adivinar
   * comparando la guarda con el SQL del backend.
   */
  it("en desarrollo el mensaje nombra el campo fuera de contrato", async () => {
    servidor.use(
      http.get(`${API}/api/clientes`, () =>
        HttpResponse.json([
          {
            id_cliente: 1,
            nombre: "X",
            pais: null,
            correo: null,
            telefono: null,
            estado: "Archivado",
          },
        ]),
      ),
    );

    await expect(listarClientes()).rejects.toThrow(/clientes\[0\]\.estado/);
  });

  /**
   * En un conjunto cerrado el valor es una etiqueta de enum, nunca texto libre
   * ni PII, asi que decir cual llego ahorra el viaje a la base de datos.
   */
  it("en desarrollo dice que valor llego y cual se esperaba", async () => {
    servidor.use(
      http.get(`${API}/api/clientes`, () =>
        HttpResponse.json([
          {
            id_cliente: 1,
            nombre: "X",
            pais: null,
            correo: null,
            telefono: null,
            estado: "Suspendido",
          },
        ]),
      ),
    );

    await expect(listarClientes()).rejects.toThrow(
      /recibido "Suspendido"; se esperaba "Activo" \| "Inactivo"/,
    );
  });

  it("el valor recibido NO llega al logger, solo la ruta del campo", async () => {
    const espia = vi.spyOn(console, "error").mockImplementation(() => undefined);

    servidor.use(
      http.get(`${API}/api/clientes`, () =>
        HttpResponse.json([
          {
            id_cliente: 1,
            nombre: "X",
            pais: null,
            correo: null,
            telefono: null,
            estado: "Suspendido",
          },
        ]),
      ),
    );

    await expect(listarClientes()).rejects.toBeInstanceOf(ApiError);

    const registrado = JSON.stringify(espia.mock.calls);
    expect(registrado).toContain("clientes[0].estado");
    expect(registrado).not.toContain("Suspendido");
  });

  it("en produccion el mensaje no revela el nombre del campo", async () => {
    vi.stubEnv("PROD", true);
    servidor.use(
      http.get(`${API}/api/clientes`, () =>
        HttpResponse.json([{ id_cliente: "uno" }]),
      ),
    );

    await expect(listarClientes()).rejects.toThrow(
      "El servidor devolvio una respuesta inesperada.",
    );
    vi.unstubAllEnvs();
  });

  it("rechaza un estado fuera del conjunto cerrado", async () => {
    servidor.use(
      http.get(`${API}/api/clientes`, () =>
        HttpResponse.json([
          {
            id_cliente: 1,
            nombre: "X",
            pais: null,
            correo: null,
            telefono: null,
            estado: "Archivado",
          },
        ]),
      ),
    );

    await expect(listarClientes()).rejects.toBeInstanceOf(ApiError);
  });

  it("propaga el mensaje del backend en un error HTTP", async () => {
    servidor.use(
      http.get(`${API}/api/clientes`, () =>
        HttpResponse.json(
          { mensaje: "No tienes permiso para realizar esta accion" },
          { status: 403 },
        ),
      ),
    );

    await expect(listarClientes()).rejects.toThrow(
      "No tienes permiso para realizar esta accion",
    );
  });
});
