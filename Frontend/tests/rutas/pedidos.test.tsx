import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createRoutesStub } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import Pedidos, {
  clientAction,
  clientLoader,
} from "@/routes/_app.pedidos._index";
import { establecerSesion, limpiarSesionLocal } from "@/shared/auth/sesion";
import { limpiarCache } from "@/shared/api/cacheTTL";
import { idUsuario } from "@/shared/tipos/marca";
import { API } from "../msw/manejadores";
import { servidor } from "../msw/servidor";

const CLIENTES = [
  {
    id_cliente: 1,
    nombre: "ZhanHao Ltd",
    pais: null,
    correo: null,
    telefono: null,
    estado: "Activo",
  },
];

const PRODUCTOS = [
  {
    id_producto: 10,
    nombre_producto: "Monstera deliciosa",
    descripcion: null,
    estado: "Activo",
  },
];

const PEDIDO = {
  id_pedido: 1003,
  id_cliente: 1,
  cliente: "ZhanHao Ltd",
  id_usuario: 1,
  usuario: "Administrador",
  fecha: "2026-07-20",
  estado: "Pendiente",
  cantidad_productos: 1,
  total: 100,
};

function montar() {
  establecerSesion(
    {
      id_usuario: idUsuario(1),
      correo: "ana@vinkaplant.cr",
      id_rol: 1,
      rol: "Administrador",
      nombre: "Ana",
    },
    "token-de-prueba",
  );

  const Stub = createRoutesStub([
    {
      path: "/pedidos",
      Component: Pedidos as never,
      loader: clientLoader as never,
      action: clientAction as never,
    },
    {
      path: "/pedidos/:id",
      Component: () => <p>PANTALLA DE DETALLE</p>,
    },
  ]);

  return render(<Stub initialEntries={["/pedidos"]} />);
}

afterEach(() => {
  limpiarSesionLocal();
  limpiarCache();
});

describe("alta de pedido desde la lista", () => {
  /**
   * Regresion: al crear se navegaba al detalle por cuenta propia, y como el
   * detalle lleva el formulario de cabecera, parecia que crear un pedido
   * abriera su edicion. Ahora se cierra el modal y se sigue en la lista.
   */
  it("no navega al detalle tras crear: se queda en la lista", async () => {
    const usuario = userEvent.setup();
    limpiarCache();

    servidor.use(
      http.get(`${API}/api/pedidos`, () => HttpResponse.json([PEDIDO])),
      http.get(`${API}/api/clientes`, () => HttpResponse.json(CLIENTES)),
      http.get(`${API}/api/productos`, () => HttpResponse.json(PRODUCTOS)),
      http.post(`${API}/api/pedidos`, () =>
        HttpResponse.json(
          { mensaje: "Pedido creado correctamente", id_pedido: 1004 },
          { status: 201 },
        ),
      ),
    );

    montar();
    await screen.findByText("ZhanHao Ltd");

    await usuario.click(screen.getByRole("button", { name: /nuevo pedido/i }));
    await screen.findByRole("dialog");

    await usuario.selectOptions(screen.getByLabelText("Cliente"), "1");
    await usuario.selectOptions(screen.getByLabelText("Planta"), "10");
    await usuario.type(screen.getByLabelText("Precio"), "100");
    await usuario.click(screen.getByRole("button", { name: /crear pedido/i }));

    // El modal se cierra y aparece el aviso de exito...
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(await screen.findByText(/Pedido creado correctamente/)).toBeInTheDocument();

    // ...pero NO se ha ido a ninguna parte.
    expect(screen.queryByText("PANTALLA DE DETALLE")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pedidos" })).toBeInTheDocument();
  });

  it("ofrece un enlace al pedido creado, que decide el usuario", async () => {
    const usuario = userEvent.setup();
    limpiarCache();

    servidor.use(
      http.get(`${API}/api/pedidos`, () => HttpResponse.json([PEDIDO])),
      http.get(`${API}/api/clientes`, () => HttpResponse.json(CLIENTES)),
      http.get(`${API}/api/productos`, () => HttpResponse.json(PRODUCTOS)),
      http.post(`${API}/api/pedidos`, () =>
        HttpResponse.json(
          { mensaje: "Pedido creado correctamente", id_pedido: 1004 },
          { status: 201 },
        ),
      ),
    );

    montar();
    await screen.findByText("ZhanHao Ltd");

    await usuario.click(screen.getByRole("button", { name: /nuevo pedido/i }));
    await screen.findByRole("dialog");
    await usuario.selectOptions(screen.getByLabelText("Cliente"), "1");
    await usuario.selectOptions(screen.getByLabelText("Planta"), "10");
    await usuario.type(screen.getByLabelText("Precio"), "100");
    await usuario.click(screen.getByRole("button", { name: /crear pedido/i }));

    const enlace = await screen.findByRole("link", { name: /Ver el pedido #1004/ });
    expect(enlace).toHaveAttribute("href", "/pedidos/1004");

    // Solo al pulsarlo se llega al detalle.
    await usuario.click(enlace);
    expect(await screen.findByText("PANTALLA DE DETALLE")).toBeInTheDocument();
  });

  it("un fallo del servidor deja el modal abierto con el mensaje", async () => {
    const usuario = userEvent.setup();
    limpiarCache();

    servidor.use(
      http.get(`${API}/api/pedidos`, () => HttpResponse.json([PEDIDO])),
      http.get(`${API}/api/clientes`, () => HttpResponse.json(CLIENTES)),
      http.get(`${API}/api/productos`, () => HttpResponse.json(PRODUCTOS)),
      http.post(`${API}/api/pedidos`, () =>
        HttpResponse.json(
          { mensaje: "El cliente, usuario o producto indicado no existe" },
          { status: 409 },
        ),
      ),
    );

    montar();
    await screen.findByText("ZhanHao Ltd");

    await usuario.click(screen.getByRole("button", { name: /nuevo pedido/i }));
    await screen.findByRole("dialog");
    await usuario.selectOptions(screen.getByLabelText("Cliente"), "1");
    await usuario.selectOptions(screen.getByLabelText("Planta"), "10");
    await usuario.type(screen.getByLabelText("Precio"), "100");
    await usuario.click(screen.getByRole("button", { name: /crear pedido/i }));

    expect(
      await screen.findByText("El cliente, usuario o producto indicado no existe"),
    ).toBeInTheDocument();
    // No se pierde lo que el usuario escribio.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
