import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { AccesoFormulario } from "@/features/accesos/components/AccesoFormulario";
import { hoyIso } from "@/shared/utils/formato";

const USUARIOS = [
  { valor: 1, etiqueta: "Ana Solis" },
  { valor: 2, etiqueta: "Luis Mora" },
];
const PLATAFORMAS = [
  { valor: 5, etiqueta: "ERP" },
  { valor: 6, etiqueta: "CRM" },
];

const ROLES_USADOS = ["Administrador", "Edicion contable", "Tramitador exportacion"];

function montar(onGuardar = vi.fn()) {
  const utilidades = render(
    <AccesoFormulario
      usuarios={USUARIOS}
      plataformas={PLATAFORMAS}
      rolesUsados={ROLES_USADOS}
      guardando={false}
      errorServidor={null}
      onGuardar={onGuardar}
      onCancelar={vi.fn()}
    />,
  );
  return { ...utilidades, onGuardar };
}

const enviar = (u: ReturnType<typeof userEvent.setup>) =>
  u.click(screen.getByRole("button", { name: /registrar/i }));

describe("AccesoFormulario", () => {
  it("no llama a onGuardar al enviar vacio", async () => {
    const usuario = userEvent.setup();
    const { onGuardar } = montar();

    await enviar(usuario);

    expect(onGuardar).not.toHaveBeenCalled();
  });

  it("exige usuario, plataforma y rol de acceso con los mensajes del contrato", async () => {
    const usuario = userEvent.setup();
    montar();

    await enviar(usuario);

    expect(
      await screen.findAllByText("Debe seleccionar un usuario valido"),
    ).not.toHaveLength(0);
    expect(
      screen.getAllByText("Debe seleccionar una plataforma valida"),
    ).not.toHaveLength(0);
    expect(
      screen.getAllByText("El rol de acceso es obligatorio"),
    ).not.toHaveLength(0);
  });

  it("propone la fecha de alta de hoy", () => {
    montar();
    expect(screen.getByLabelText("Fecha de alta")).toHaveValue(hoyIso());
  });

  it("envia los ids como numeros, no como el string del <select>", async () => {
    const usuario = userEvent.setup();
    const { onGuardar } = montar();

    await usuario.selectOptions(screen.getByLabelText("Usuario"), "1");
    await usuario.selectOptions(screen.getByLabelText("Plataforma"), "5");
    await usuario.type(screen.getByLabelText("Rol de acceso"), "  Administrador  ");
    await enviar(usuario);

    expect(onGuardar).toHaveBeenCalledWith({
      id_usuario: 1,
      id_plataforma: 5,
      rol_acceso: "Administrador",
      fecha_alta: hoyIso(),
    });
  });

  it("rechaza un rol de acceso de solo espacios", async () => {
    const usuario = userEvent.setup();
    const { onGuardar } = montar();

    await usuario.selectOptions(screen.getByLabelText("Usuario"), "1");
    await usuario.selectOptions(screen.getByLabelText("Plataforma"), "5");
    await usuario.type(screen.getByLabelText("Rol de acceso"), "   ");
    await enviar(usuario);

    expect(onGuardar).not.toHaveBeenCalled();
  });

  it("respeta el tope de 100 caracteres del rol de acceso", () => {
    montar();
    expect(screen.getByLabelText("Rol de acceso")).toHaveAttribute("maxLength", "100");
  });

  describe("rol de acceso como combobox", () => {
    it("sugiere los roles ya usados", () => {
      const { container } = montar();
      const campo = screen.getByLabelText("Rol de acceso");

      const lista = container.querySelector(`#${campo.getAttribute("list") ?? ""}`);
      expect(lista?.tagName).toBe("DATALIST");
      expect(
        [...(lista?.querySelectorAll("option") ?? [])].map((o) => o.value),
      ).toEqual(ROLES_USADOS);
    });

    /**
     * El contrato define `rol_acceso` como texto libre: un desplegable cerrado
     * impediria registrar un rol nuevo, incluido el primero de todos.
     */
    it("acepta un rol que no esta en las sugerencias", async () => {
      const usuario = userEvent.setup();
      const { onGuardar } = montar();

      await usuario.selectOptions(screen.getByLabelText("Usuario"), "1");
      await usuario.selectOptions(screen.getByLabelText("Plataforma"), "5");
      await usuario.type(screen.getByLabelText("Rol de acceso"), "Consulta bodega");
      await enviar(usuario);

      expect(onGuardar).toHaveBeenCalledWith(
        expect.objectContaining({ rol_acceso: "Consulta bodega" }),
      );
    });

    it("sin roles previos sigue siendo un campo utilizable", () => {
      render(
        <AccesoFormulario
          usuarios={USUARIOS}
          plataformas={PLATAFORMAS}
          rolesUsados={[]}
          guardando={false}
          errorServidor={null}
          onGuardar={vi.fn()}
          onCancelar={vi.fn()}
        />,
      );

      const campo = screen.getByLabelText("Rol de acceso");
      expect(campo).toBeEnabled();
      expect(campo).not.toHaveAttribute("list");
    });
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = montar();
    expect(await axe(container)).toHaveNoViolations();
  });
});
