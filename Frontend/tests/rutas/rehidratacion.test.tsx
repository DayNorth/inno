import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { createRoutesStub, Outlet } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { requerirSesion } from "@/shared/auth/requerir";
import { permitirRehidratar, rehidratarSesion } from "@/shared/auth/refresco";
import { limpiarSesionLocal, sesionActual } from "@/shared/auth/sesion";
import { API } from "../msw/manejadores";
import { servidor } from "../msw/servidor";

/** JWT sin firmar: el cliente no verifica la firma, solo lee los claims. */
function jwtDePrueba(): string {
  const b64 = (o: unknown): string =>
    btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${b64({ alg: "HS256" })}.${b64({
    id_usuario: 1,
    correo: "ana@vinkaplant.cr",
    id_rol: 1,
    rol: "Administrador",
    exp: 4102444800,
  })}.firma`;
}

afterEach(() => {
  limpiarSesionLocal();
  permitirRehidratar();
});

/**
 * El supuesto que rompio la aplicacion: se creia que el loader del root
 * terminaba antes que los de sus hijos, y sobre eso se apoyaba toda la
 * rehidratacion de sesion.
 */
describe("orden de los loaders anidados", () => {
  it("el loader hijo NO espera al del padre: corren en paralelo", async () => {
    const orden: string[] = [];

    const Stub = createRoutesStub([
      {
        path: "/",
        loader: async () => {
          orden.push("padre:inicio");
          await new Promise((r) => setTimeout(r, 30));
          orden.push("padre:fin");
          return null;
        },
        Component: () => <Outlet />,
        children: [
          {
            path: "protegido",
            loader: () => {
              orden.push("hijo");
              return null;
            },
            Component: () => <p>contenido</p>,
          },
        ],
      },
    ]);

    render(<Stub initialEntries={["/protegido"]} />);
    await screen.findByText("contenido");

    // Si el hijo esperara al padre seria ["padre:inicio","padre:fin","hijo"].
    expect(orden).toEqual(["padre:inicio", "hijo", "padre:fin"]);
  });
});

describe("requerirSesion espera a la rehidratacion", () => {
  /**
   * Regresion del "me saca al recargar": sin el `await`, el guard leia una
   * sesion todavia vacia y redirigia a /login aunque la cookie fuera valida.
   */
  it("no redirige mientras el refresh silencioso esta en vuelo", async () => {
    servidor.use(
      http.post(`${API}/api/auth/refresh`, async () => {
        await new Promise((r) => setTimeout(r, 40));
        return HttpResponse.json({ token: jwtDePrueba() });
      }),
    );

    const peticion = new Request("http://localhost:5173/clientes");
    const usuario = await requerirSesion(peticion);

    expect(usuario.id_rol).toBe(1);
    expect(sesionActual()).not.toBeNull();
  });

  it("varios guards concurrentes comparten un solo refresh", async () => {
    let refrescos = 0;
    servidor.use(
      http.post(`${API}/api/auth/refresh`, async () => {
        refrescos += 1;
        await new Promise((r) => setTimeout(r, 20));
        return HttpResponse.json({ token: jwtDePrueba() });
      }),
    );

    await Promise.all([
      requerirSesion(new Request("http://localhost:5173/clientes")),
      requerirSesion(new Request("http://localhost:5173/pedidos")),
      requerirSesion(new Request("http://localhost:5173/riesgos")),
    ]);

    expect(refrescos).toBe(1);
  });

  it("si no hay cookie valida, si redirige a /login conservando el destino", async () => {
    servidor.use(
      http.post(`${API}/api/auth/refresh`, () =>
        HttpResponse.json({ mensaje: "Sesion expirada" }, { status: 401 }),
      ),
    );

    const peticion = new Request("http://localhost:5173/riesgos");

    await expect(requerirSesion(peticion)).rejects.toSatisfy(
      (e: unknown) =>
        e instanceof Response &&
        e.status === 302 &&
        e.headers.get("Location") === "/login?next=%2Friesgos",
    );
  });

  it("un refresh fallido no se reintenta en cada guard", async () => {
    let refrescos = 0;
    servidor.use(
      http.post(`${API}/api/auth/refresh`, () => {
        refrescos += 1;
        return HttpResponse.json({ mensaje: "Sesion expirada" }, { status: 401 });
      }),
    );

    await expect(rehidratarSesion()).resolves.toBe(false);
    await expect(rehidratarSesion()).resolves.toBe(false);
    await expect(rehidratarSesion()).resolves.toBe(false);

    expect(refrescos).toBe(1);
  });
});
