import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RiesgoFormulario } from "@/features/riesgos/components/RiesgoFormulario";

function montar(onGuardar = vi.fn()) {
  render(
    <RiesgoFormulario
      guardando={false}
      errorServidor={null}
      onGuardar={onGuardar}
      onCancelar={vi.fn()}
    />,
  );
  return onGuardar;
}

describe("RiesgoFormulario", () => {
  it("no llama a onGuardar al enviar vacio", async () => {
    const usuario = userEvent.setup();
    const onGuardar = montar();

    await usuario.click(screen.getByRole("button", { name: /registrar/i }));

    expect(onGuardar).not.toHaveBeenCalled();
  });

  it("rechaza una probabilidad fuera del rango 1-5", async () => {
    const usuario = userEvent.setup();
    const onGuardar = montar();

    await usuario.type(screen.getByLabelText("Sistema"), "ERP");
    await usuario.type(screen.getByLabelText("Categoria"), "Disponibilidad");
    await usuario.type(screen.getByLabelText("Descripcion"), "Caida de nube");
    await usuario.type(screen.getByLabelText("Probabilidad (1-5)"), "9");
    await usuario.type(screen.getByLabelText("Impacto (1-5)"), "3");
    await usuario.click(screen.getByRole("button", { name: /registrar/i }));

    expect(
      await screen.findAllByText("La probabilidad debe ser un valor entre 1 y 5"),
    ).not.toHaveLength(0);
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it("previsualiza la criticidad como probabilidad x impacto", async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.type(screen.getByLabelText("Probabilidad (1-5)"), "4");
    await usuario.type(screen.getByLabelText("Impacto (1-5)"), "5");

    expect(await screen.findByText("20")).toBeInTheDocument();
    expect(screen.getByText("Alto")).toBeInTheDocument();
  });

  it("convierte los numeros con valueAsNumber, no con Number() al enviar", async () => {
    const usuario = userEvent.setup();
    const onGuardar = montar();

    await usuario.type(screen.getByLabelText("Sistema"), "ERP");
    await usuario.type(screen.getByLabelText("Categoria"), "Disponibilidad");
    await usuario.type(screen.getByLabelText("Descripcion"), "Caida de nube");
    await usuario.type(screen.getByLabelText("Probabilidad (1-5)"), "4");
    await usuario.type(screen.getByLabelText("Impacto (1-5)"), "5");
    await usuario.click(screen.getByRole("button", { name: /registrar/i }));

    expect(onGuardar).toHaveBeenCalledWith({
      sistema: "ERP",
      categoria: "Disponibilidad",
      descripcion: "Caida de nube",
      probabilidad: 4,
      impacto: 5,
      control_mitigante: null,
    });
  });
});
