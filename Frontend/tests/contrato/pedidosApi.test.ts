import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { crearPedido, obtenerPedido } from "@/features/pedidos/api/pedidosApi";
import { idPedido } from "@/shared/tipos/marca";
import { API } from "../msw/manejadores";
import { servidor } from "../msw/servidor";

const DETALLE = {
  id_pedido: 1003,
  id_cliente: 1,
  cliente: "ZhanHao Ltd",
  id_usuario: 1,
  usuario: "Administrador",
  fecha: "2026-07-20",
  estado: "Pendiente",
  total: 9700,
  detalles: [
    {
      id_detalle: 1,
      id_producto: 10,
      nombre_producto: "Monstera deliciosa",
      cantidad: 2,
      precio_unitario: 4850,
      subtotal: 9700,
    },
  ],
};

describe("frontera de confianza de /api/pedidos", () => {
  it("verifica el detalle con sus lineas", async () => {
    servidor.use(
      http.get(`${API}/api/pedidos/1003`, () => HttpResponse.json(DETALLE)),
    );

    const pedido = await obtenerPedido(idPedido(1003));

    expect(pedido.detalles).toHaveLength(1);
    expect(pedido.detalles[0]?.subtotal).toBe(9700);
  });

  it("rechaza un estado de pedido desconocido", async () => {
    servidor.use(
      http.get(`${API}/api/pedidos/1003`, () =>
        HttpResponse.json({ ...DETALLE, estado: "Archivado" }),
      ),
    );

    await expect(obtenerPedido(idPedido(1003))).rejects.toBeInstanceOf(ApiError);
  });

  /** El POST devuelve SOLO `id_pedido`, no el pedido completo (§13.9). */
  it("extrae el id del pedido creado", async () => {
    servidor.use(
      http.post(`${API}/api/pedidos`, () =>
        HttpResponse.json(
          { mensaje: "Pedido creado correctamente", id_pedido: 1004 },
          { status: 201 },
        ),
      ),
    );

    const id = await crearPedido({
      id_cliente: 1,
      fecha: "2026-07-20",
      estado: "Pendiente",
      detalles: [{ id_producto: 10, cantidad: 1, precio_unitario: 100 }],
    });

    expect(id).toBe(1004);
  });

  it("si el POST no devuelve id_pedido, es un error de contrato", async () => {
    servidor.use(
      http.post(`${API}/api/pedidos`, () =>
        HttpResponse.json({ mensaje: "Pedido creado correctamente" }, { status: 201 }),
      ),
    );

    await expect(
      crearPedido({
        id_cliente: 1,
        fecha: null,
        estado: "Pendiente",
        detalles: [{ id_producto: 10, cantidad: 1, precio_unitario: 100 }],
      }),
    ).rejects.toSatisfy(
      (e: unknown) => e instanceof ApiError && e.clase === "contrato",
    );
  });

  it("propaga el 409 de clave foranea con su mensaje", async () => {
    servidor.use(
      http.post(`${API}/api/pedidos`, () =>
        HttpResponse.json(
          { mensaje: "El cliente, usuario o producto indicado no existe" },
          { status: 409 },
        ),
      ),
    );

    await expect(
      crearPedido({
        id_cliente: 999,
        fecha: null,
        estado: "Pendiente",
        detalles: [{ id_producto: 10, cantidad: 1, precio_unitario: 100 }],
      }),
    ).rejects.toSatisfy(
      (e: unknown) =>
        e instanceof ApiError &&
        e.esConflicto &&
        e.message === "El cliente, usuario o producto indicado no existe",
    );
  });
});
