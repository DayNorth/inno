import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { LimiteDeError } from "@/shared/ui/LimiteDeError/LimiteDeError";

function montar(error: unknown) {
  // El componente usa <Link>, asi que necesita un router alrededor.
  const Stub = createRoutesStub([
    { path: "/", Component: () => <LimiteDeError error={error} /> },
  ]);
  return render(<Stub initialEntries={["/"]} />);
}

const STACK_FALSO = "Error: fallo interno\n    at consultarBD (/srv/app/db.js:42:11)";

describe("LimiteDeError", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /** Criterio 11 de frontend-seguridad.md §10. */
  it("en produccion no renderiza stack, ni URLs, ni cuerpos", () => {
    vi.stubEnv("PROD", true);

    const error = new Error("fallo interno");
    error.stack = STACK_FALSO;
    const { container } = montar(error);

    // El bloque de detalle no debe EXISTIR, no basta con que no coincida el
    // texto: si solo se comprobara el contenido, el test pasaria por casualidad.
    expect(container.querySelector("pre")).toBeNull();

    const texto = container.textContent ?? "";
    expect(texto).not.toContain("db.js");
    expect(texto).not.toContain("/srv/app");
    expect(texto).not.toContain("at consultarBD");
    expect(screen.getByRole("alert")).toHaveTextContent("Algo salio mal");
  });

  /** Criterio 12: el correlationId si se muestra; es opaco y no lleva PII. */
  it("muestra el correlationId de un ApiError de contrato", () => {
    vi.stubEnv("PROD", true);

    montar(
      new ApiError(
        "El servidor devolvio una respuesta inesperada.",
        0,
        "contrato",
        "7c9f1a20-0000-4000-8000-abcdefabcdef",
      ),
    );

    expect(
      screen.getByText("7c9f1a20-0000-4000-8000-abcdefabcdef"),
    ).toBeInTheDocument();
  });

  it("no filtra el correo del usuario aunque venga en el mensaje del error", () => {
    vi.stubEnv("PROD", true);

    const { container } = montar(new Error("fallo con ana@vinkaplant.cr"));

    expect(container.textContent ?? "").not.toContain("ana@vinkaplant.cr");
  });

  it("distingue un 403 para no dar un mensaje generico inutil", () => {
    vi.stubEnv("PROD", true);

    montar(
      new ApiError("No tienes permiso para realizar esta accion", 403, "http"),
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Sin permiso");
  });

  it("en desarrollo si muestra el detalle, que es donde sirve", () => {
    vi.stubEnv("PROD", false);

    const { container } = montar(new Error("fallo interno"));

    // Contraprueba del caso anterior: en dev el bloque existe. Sin esto, el
    // test de produccion no distingue "oculto" de "nunca se renderiza".
    expect(container.querySelector("pre")).not.toBeNull();
    expect(container.textContent ?? "").toContain("fallo interno");
  });
});
