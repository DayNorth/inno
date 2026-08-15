import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";
import Clientes, {
  clientLoader,
} from "@/routes/_app.clientes";
import { establecerSesion, limpiarSesionLocal } from "@/shared/auth/sesion";
import { idUsuario } from "@/shared/tipos/marca";
import { limpiarCache } from "@/shared/api/cacheTTL";

function conSesion(id_rol: 1 | 2 | 3): void {
  establecerSesion(
    {
      id_usuario: idUsuario(1),
      correo: "ana@vinkaplant.cr",
      id_rol,
      rol: "Prueba",
      nombre: "Ana",
    },
    "token-de-prueba",
  );
}

/**
 * `createRoutesStub` ejercita el loader y el componente juntos, sin navegador
 * ni servidor: es la forma de testear el patron "guard en el loader".
 */
function montarRuta() {
  const Stub = createRoutesStub([
    {
      path: "/clientes",
      Component: Clientes as never,
      loader: clientLoader as never,
    },
    { path: "/login", Component: () => <p>Pantalla de login</p> },
  ]);

  return render(<Stub initialEntries={["/clientes"]} />);
}

describe("ruta /clientes", () => {
  it("redirige a /login cuando no hay sesion, sin pedir datos", async () => {
    limpiarSesionLocal();
    limpiarCache();
    montarRuta();

    expect(await screen.findByText("Pantalla de login")).toBeInTheDocument();
  });

  it("muestra la tabla y el boton de alta para un rol con escritura", async () => {
    limpiarCache();
    conSesion(2);
    montarRuta();

    expect(await screen.findByText("ZhanHao Ltd")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /nuevo cliente/i }),
    ).toBeInTheDocument();
    limpiarSesionLocal();
  });

  it("oculta las acciones de escritura para el Auditor", async () => {
    limpiarCache();
    conSesion(3);
    montarRuta();

    expect(await screen.findByText("ZhanHao Ltd")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /nuevo cliente/i }),
    ).not.toBeInTheDocument();
    limpiarSesionLocal();
  });
});
