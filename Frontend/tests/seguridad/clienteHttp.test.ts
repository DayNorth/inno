import { delay, http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { listarClientes } from "@/features/clientes/api/clientesApi";
import { establecerSesion, limpiarSesionLocal, sesionActual } from "@/shared/auth/sesion";
import { idUsuario } from "@/shared/tipos/marca";
import { API, CLIENTES_DE_PRUEBA } from "../msw/manejadores";
import { servidor } from "../msw/servidor";

function abrirSesion(token = "token-inicial"): void {
  establecerSesion(
    {
      id_usuario: idUsuario(1),
      correo: "ana@vinkaplant.cr",
      id_rol: 1,
      rol: "Administrador",
      nombre: "Ana",
    },
    token,
  );
}

afterEach(() => {
  limpiarSesionLocal();
});

describe("cabeceras de la puerta de red", () => {
  it("manda el access token como Bearer", async () => {
    abrirSesion("abc123");
    let autorizacion: string | null = null;

    servidor.use(
      http.get(`${API}/api/clientes`, ({ request }) => {
        autorizacion = request.headers.get("Authorization");
        return HttpResponse.json(CLIENTES_DE_PRUEBA);
      }),
    );

    await listarClientes();
    expect(autorizacion).toBe("Bearer abc123");
  });

  it("manda un X-Correlation-Id por peticion", async () => {
    abrirSesion();
    const vistos: string[] = [];

    servidor.use(
      http.get(`${API}/api/clientes`, ({ request }) => {
        vistos.push(request.headers.get("X-Correlation-Id") ?? "");
        return HttpResponse.json(CLIENTES_DE_PRUEBA);
      }),
    );

    await listarClientes();
    await listarClientes();

    expect(vistos[0]).not.toBe("");
    expect(vistos[0]).not.toBe(vistos[1]);
  });

  /**
   * El login es quien RECIBE el Set-Cookie del refresh token. Con
   * `credentials: "omit"` el navegador descarta esa cabecera cross-origin, no
   * queda cookie, y recargar la pagina cierra la sesion.
   */
  it("el login viaja con credenciales, para poder guardar la cookie de refresh", async () => {
    let credenciales: string | undefined;

    servidor.use(
      http.post(`${API}/api/auth/login`, ({ request }) => {
        credenciales = request.credentials;
        return HttpResponse.json({
          mensaje: "Inicio de sesion correcto",
          token: "jwt-de-prueba",
          usuario: {
            id_usuario: 1,
            nombre: "Ana",
            correo: "ana@vinkaplant.cr",
            id_rol: 1,
            rol: "Administrador",
          },
        });
      }),
    );

    const { iniciarSesionEnServidor } = await import("@/shared/auth/authApi");
    await iniciarSesionEnServidor({
      correo: "ana@vinkaplant.cr",
      password: "x",
    });

    expect(credenciales).toBe("include");
  });

  it("una ruta de datos NO manda cookies: no amplia la superficie CSRF", async () => {
    abrirSesion();
    let credenciales: string | undefined;

    servidor.use(
      http.get(`${API}/api/clientes`, ({ request }) => {
        credenciales = request.credentials;
        return HttpResponse.json(CLIENTES_DE_PRUEBA);
      }),
    );

    await listarClientes();
    expect(credenciales).toBe("omit");
  });

  it("no manda Authorization en una peticion sin sesion", async () => {
    let autorizacion: string | null = "sin leer";

    servidor.use(
      http.get(`${API}/api/clientes`, ({ request }) => {
        autorizacion = request.headers.get("Authorization");
        return HttpResponse.json(CLIENTES_DE_PRUEBA);
      }),
    );

    await listarClientes();
    expect(autorizacion).toBeNull();
  });
});

describe("renovacion del access token", () => {
  it("renueva y reintenta una sola vez tras un 401", async () => {
    abrirSesion("token-viejo");
    const tokens: (string | null)[] = [];
    let refrescos = 0;

    servidor.use(
      http.post(`${API}/api/auth/refresh`, () => {
        refrescos += 1;
        return HttpResponse.json({ token: "token-nuevo" });
      }),
      http.get(`${API}/api/clientes`, ({ request }) => {
        const bearer = request.headers.get("Authorization");
        tokens.push(bearer);
        if (bearer === "Bearer token-viejo") {
          return HttpResponse.json({ mensaje: "Sesion expirada" }, { status: 401 });
        }
        return HttpResponse.json(CLIENTES_DE_PRUEBA);
      }),
    );

    const clientes = await listarClientes();

    expect(clientes).toHaveLength(2);
    expect(refrescos).toBe(1);
    expect(tokens).toEqual(["Bearer token-viejo", "Bearer token-nuevo"]);
  });

  /**
   * Single-flight: sin esto, cada 401 rotaria el refresh token y la deteccion
   * de reuso del backend (ADR-003) cerraria la sesion entera.
   */
  it("tres 401 simultaneos producen un solo refresh", async () => {
    abrirSesion("token-viejo");
    let refrescos = 0;

    servidor.use(
      http.post(`${API}/api/auth/refresh`, async () => {
        refrescos += 1;
        await delay(20);
        return HttpResponse.json({ token: "token-nuevo" });
      }),
      http.get(`${API}/api/clientes`, ({ request }) =>
        request.headers.get("Authorization") === "Bearer token-viejo"
          ? HttpResponse.json({ mensaje: "Sesion expirada" }, { status: 401 })
          : HttpResponse.json(CLIENTES_DE_PRUEBA),
      ),
    );

    await Promise.all([listarClientes(), listarClientes(), listarClientes()]);

    expect(refrescos).toBe(1);
  });

  it("si el refresh falla, la sesion local se cae y el error es 401", async () => {
    abrirSesion("token-viejo");

    servidor.use(
      http.post(`${API}/api/auth/refresh`, () =>
        HttpResponse.json({ mensaje: "Sesion expirada" }, { status: 401 }),
      ),
      http.get(`${API}/api/clientes`, () =>
        HttpResponse.json({ mensaje: "Token invalido o expirado" }, { status: 401 }),
      ),
    );

    await expect(listarClientes()).rejects.toSatisfy(
      (e: unknown) => e instanceof ApiError && e.estado === 401,
    );
    expect(sesionActual()).toBeNull();
  });

  it("un 401 en la propia ruta publica no intenta renovarse a si mismo", async () => {
    let refrescos = 0;

    servidor.use(
      http.post(`${API}/api/auth/refresh`, () => {
        refrescos += 1;
        return HttpResponse.json({ mensaje: "Sesion expirada" }, { status: 401 });
      }),
      http.get(`${API}/api/clientes`, () =>
        HttpResponse.json({ mensaje: "Token no proporcionado" }, { status: 401 }),
      ),
    );

    await expect(listarClientes()).rejects.toBeInstanceOf(ApiError);
    // Un solo intento de refresh: el 401 del refresh no dispara otro refresh.
    expect(refrescos).toBe(1);
  });
});

describe("clasificacion de errores", () => {
  it("un timeout se marca como tal y no como fallo de red", async () => {
    abrirSesion();

    servidor.use(
      http.get(`${API}/api/clientes`, async () => {
        await delay(200);
        return HttpResponse.json(CLIENTES_DE_PRUEBA);
      }),
    );

    const { pedir } = await import("@/shared/api/cliente");
    const { aListaClientes } = await import("@/features/clientes/dominio/cliente");

    await expect(
      pedir("/api/clientes", aListaClientes, { timeoutMs: 20 }),
    ).rejects.toSatisfy(
      (e: unknown) => e instanceof ApiError && e.clase === "timeout",
    );
  });

  it("un error de red no filtra el detalle interno al usuario", async () => {
    abrirSesion();

    servidor.use(
      http.get(`${API}/api/clientes`, () => HttpResponse.error()),
    );

    await expect(listarClientes()).rejects.toSatisfy(
      (e: unknown) =>
        e instanceof ApiError &&
        e.clase === "red" &&
        e.message === "No se pudo contactar con el servidor. Revisa tu conexion.",
    );
  });
});
