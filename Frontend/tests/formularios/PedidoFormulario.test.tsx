import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PedidoFormulario } from "@/features/pedidos/components/PedidoFormulario";

const CLIENTES = [
  { valor: 1, etiqueta: "ZhanHao Ltd" },
  { valor: 2, etiqueta: "Asia Botanical Trading" },
];

const PRODUCTOS = [
  { valor: 10, etiqueta: "Monstera deliciosa" },
  { valor: 11, etiqueta: "Ficus lyrata" },
];

function montar(onGuardar = vi.fn()) {
  render(
    <PedidoFormulario
      clientes={CLIENTES}
      productos={PRODUCTOS}
      guardando={false}
      errorServidor={null}
      onGuardar={onGuardar}
      onCancelar={vi.fn()}
    />,
  );
  return onGuardar;
}

const enviar = async (usuario: ReturnType<typeof userEvent.setup>) => {
  await usuario.click(screen.getByRole("button", { name: /crear pedido/i }));
};

describe("PedidoFormulario", () => {
  it("no llama a onGuardar al enviar vacio", async () => {
    const usuario = userEvent.setup();
    const onGuardar = montar();

    await enviar(usuario);

    expect(onGuardar).not.toHaveBeenCalled();
  });

  it("exige cliente y planta antes de tocar la red", async () => {
    const usuario = userEvent.setup();
    const onGuardar = montar();

    await enviar(usuario);

    expect(
      await screen.findAllByText("Debe seleccionar un cliente valido"),
    ).not.toHaveLength(0);
    expect(
      screen.getAllByText("Debe seleccionar un producto valido"),
    ).not.toHaveLength(0);
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it("envia una linea completa con los numeros ya coercionados", async () => {
    const usuario = userEvent.setup();
    const onGuardar = montar();

    await usuario.selectOptions(screen.getByLabelText("Cliente"), "1");
    await usuario.selectOptions(screen.getByLabelText("Planta"), "10");
    await usuario.clear(screen.getByLabelText("Cantidad"));
    await usuario.type(screen.getByLabelText("Cantidad"), "3");
    await usuario.type(screen.getByLabelText("Precio"), "2500");
    await enviar(usuario);

    expect(onGuardar).toHaveBeenCalledTimes(1);
    const payload = onGuardar.mock.calls[0]?.[0] as {
      id_cliente: number;
      detalles: { id_producto: number; cantidad: number; precio_unitario: number }[];
    };
    expect(payload.id_cliente).toBe(1);
    expect(payload.detalles).toEqual([
      { id_producto: 10, cantidad: 3, precio_unitario: 2500 },
    ]);
  });

  it("rechaza una cantidad de cero con el mensaje del backend", async () => {
    const usuario = userEvent.setup();
    const onGuardar = montar();

    await usuario.selectOptions(screen.getByLabelText("Cliente"), "1");
    await usuario.selectOptions(screen.getByLabelText("Planta"), "10");
    await usuario.clear(screen.getByLabelText("Cantidad"));
    await usuario.type(screen.getByLabelText("Cantidad"), "0");
    await usuario.type(screen.getByLabelText("Precio"), "10");
    await enviar(usuario);

    expect(
      await screen.findAllByText("La cantidad debe ser mayor que cero"),
    ).not.toHaveLength(0);
    expect(onGuardar).not.toHaveBeenCalled();
  });

  /** Validacion cruzada cantidad x precio, evitada antes del round-trip. */
  it("detecta el subtotal de linea excedido sin llamar a la API", async () => {
    const usuario = userEvent.setup();
    const onGuardar = montar();

    await usuario.selectOptions(screen.getByLabelText("Cliente"), "1");
    await usuario.selectOptions(screen.getByLabelText("Planta"), "10");
    await usuario.clear(screen.getByLabelText("Cantidad"));
    await usuario.type(screen.getByLabelText("Cantidad"), "2000000");
    await usuario.type(screen.getByLabelText("Precio"), "9999999999");
    await enviar(usuario);

    expect(
      await screen.findAllByText(
        "El subtotal de la linea supera el maximo permitido",
      ),
    ).not.toHaveLength(0);
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it("anade y quita lineas con useFieldArray", async () => {
    const usuario = userEvent.setup();
    montar();

    expect(screen.getAllByLabelText("Planta")).toHaveLength(1);

    await usuario.click(screen.getByRole("button", { name: /anadir linea/i }));
    expect(screen.getAllByLabelText("Planta")).toHaveLength(2);

    await usuario.click(screen.getByRole("button", { name: "Quitar linea 2" }));
    expect(screen.getAllByLabelText("Planta")).toHaveLength(1);
  });

  it("no deja quitar la unica linea: el pedido necesita al menos una planta", () => {
    montar();
    expect(screen.getByRole("button", { name: "Quitar linea 1" })).toBeDisabled();
  });

  describe("select de estado", () => {
    /**
     * Regresion: el placeholder se pinto como "Pendiente", asi que la lista
     * mostraba dos veces esa etiqueta —una con `value=""`—. Elegir la vacia
     * habria enviado un estado fuera del conjunto cerrado del contrato.
     */
    it("no repite ninguna etiqueta", () => {
      montar();

      const etiquetas = [...screen.getByLabelText("Estado").querySelectorAll("option")].map(
        (o) => o.textContent,
      );

      expect(etiquetas).toEqual([...new Set(etiquetas)]);
      expect(etiquetas.filter((e) => e === "Pendiente")).toHaveLength(1);
    });

    it("ofrece solo los tres estados que el contrato admite al crear", () => {
      montar();

      const opciones = [...screen.getByLabelText("Estado").querySelectorAll("option")];

      expect(opciones.map((o) => o.value)).toEqual([
        "Pendiente",
        "En proceso",
        "Completado",
      ]);
      // `Cancelado` no se puede fijar al crear: para eso esta /cancelar.
      expect(opciones.map((o) => o.value)).not.toContain("Cancelado");
    });

    it("no ofrece una opcion vacia: el estado nunca puede quedar sin valor", () => {
      montar();

      const vacias = [
        ...screen.getByLabelText("Estado").querySelectorAll("option"),
      ].filter((o) => o.value === "");

      expect(vacias).toHaveLength(0);
    });

    it("arranca en Pendiente", () => {
      montar();
      expect(screen.getByLabelText("Estado")).toHaveValue("Pendiente");
    });
  });
});
