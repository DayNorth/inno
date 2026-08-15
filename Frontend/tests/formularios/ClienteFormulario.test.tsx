import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "jest-axe";
import { ClienteFormulario } from "@/features/clientes/components/ClienteFormulario";

function montar(onGuardar = vi.fn()) {
  const utilidades = render(
    <ClienteFormulario
      clienteEnEdicion={null}
      guardando={false}
      errorServidor={null}
      onGuardar={onGuardar}
      onCancelar={vi.fn()}
    />,
  );
  return { ...utilidades, onGuardar };
}

describe("ClienteFormulario", () => {
  /**
   * Prueba de regresion directa contra D-1: los formularios montaban el
   * resolver correctamente y aun asi devolvian cero errores, asi que el
   * callback de guardado se llamaba con el formulario vacio.
   */
  it("no llama a onGuardar y muestra el error al enviar vacio", async () => {
    const usuario = userEvent.setup();
    const { onGuardar } = montar();

    await usuario.click(screen.getByRole("button", { name: /registrar/i }));

    expect(
      await screen.findAllByText("El nombre del cliente es obligatorio"),
    ).not.toHaveLength(0);
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it("rechaza un nombre de solo espacios", async () => {
    const usuario = userEvent.setup();
    const { onGuardar } = montar();

    await usuario.type(screen.getByLabelText("Nombre"), "   ");
    await usuario.click(screen.getByRole("button", { name: /registrar/i }));

    expect(onGuardar).not.toHaveBeenCalled();
  });

  it("rechaza un correo con formato invalido", async () => {
    const usuario = userEvent.setup();
    const { onGuardar } = montar();

    await usuario.type(screen.getByLabelText("Nombre"), "Vivero Norte");
    await usuario.type(screen.getByLabelText("Correo"), "no-es-un-correo");
    await usuario.click(screen.getByRole("button", { name: /registrar/i }));

    expect(
      await screen.findAllByText("El correo no tiene un formato valido"),
    ).not.toHaveLength(0);
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it("envia los opcionales vacios como null, no como cadena vacia", async () => {
    const usuario = userEvent.setup();
    const { onGuardar } = montar();

    await usuario.type(screen.getByLabelText("Nombre"), "  Vivero Norte  ");
    await usuario.click(screen.getByRole("button", { name: /registrar/i }));

    expect(onGuardar).toHaveBeenCalledWith({
      nombre: "Vivero Norte",
      pais: null,
      correo: null,
      telefono: null,
    });
  });

  it("lista todos los errores a la vez en el resumen", async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.type(screen.getByLabelText("Correo"), "malo");
    await usuario.type(screen.getByLabelText("Telefono"), "abc");
    await usuario.click(screen.getByRole("button", { name: /registrar/i }));

    const resumen = await screen.findByRole("alert");
    expect(resumen).toHaveTextContent("Revisa 3 campos antes de continuar");
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = montar();
    expect(await axe(container)).toHaveNoViolations();
  });
});
