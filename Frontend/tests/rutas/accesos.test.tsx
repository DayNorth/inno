import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createRoutesStub } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import Accesos, { clientAction, clientLoader } from "@/routes/_app.accesos";
import { establecerSesion, limpiarSesionLocal } from "@/shared/auth/sesion";
import { limpiarCache } from "@/shared/api/cacheTTL";
import { idUsuario } from "@/shared/tipos/marca";
import type { IdRol } from "@/shared/tipos/rol";
import { API } from "../msw/manejadores";
import { servidor } from "../msw/servidor";

const VIGENTE = {
  id_acceso: 5,
  id_usuario: 1,
  usuario: "Ana Solis",
  id_plataforma: 2,
  plataforma: "ERP",
  rol_acceso: "Administrador",
  fecha_alta: "2026-06-01",
  fecha_ultima_revision: null,
  estado: "Vigente",
};

const REVOCADO = { ...VIGENTE, id_acceso: 6, usuario: "Luis Mora", estado: "Revocado" };

const USUARIOS = [
  { id_usuario: 1, nombre: "Ana Solis", correo: "ana@vinkaplant.cr", rol: "Administrador", estado: "Activo" },
];
const PLATAFORMAS = [{ id_plataforma: 2, nombre: "ERP" }];

function handlers(accesos: unknown[], alRevisar = vi.fn(), alRevocar = vi.fn()) {
  servidor.use(
    http.get(`${API}/api/accesos`, () => HttpResponse.json(accesos)),
    http.get(`${API}/api/usuarios`, () => HttpResponse.json(USUARIOS)),
    http.get(`${API}/api/plataformas`, () => HttpResponse.json(PLATAFORMAS)),
    http.patch(`${API}/api/accesos/:id/revisar`, ({ params }) => {
      alRevisar(params.id);
      return HttpResponse.json({ mensaje: "Acceso marcado como revisado" });
    }),
    http.patch(`${API}/api/accesos/:id/revocar`, ({ params }) => {
      alRevocar(params.id);
      return HttpResponse.json({ mensaje: "Acceso revocado correctamente" });
    }),
  );
}

function montar(id_rol: IdRol) {
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

  const Stub = createRoutesStub([
    {
      path: "/accesos",
      Component: Accesos as never,
      loader: clientLoader as never,
      action: clientAction as never,
    },
  ]);

  return render(<Stub initialEntries={["/accesos"]} />);
}

afterEach(() => {
  limpiarSesionLocal();
  limpiarCache();
});

describe("excepcion de rol: revocar es solo del Administrador", () => {
  it("el Operador no ve el boton de revocar", async () => {
    limpiarCache();
    handlers([VIGENTE]);
    montar(2);

    await screen.findByText("Ana Solis");
    expect(screen.queryByRole("button", { name: /^Revocar/ })).not.toBeInTheDocument();
    // Pero si puede revisar: eso no esta restringido.
    expect(screen.getByRole("button", { name: /^Revisar/ })).toBeInTheDocument();
  });

  it("el Administrador si lo ve", async () => {
    limpiarCache();
    handlers([VIGENTE]);
    montar(1);

    await screen.findByText("Ana Solis");
    expect(screen.getByRole("button", { name: /^Revocar/ })).toBeInTheDocument();
  });

  it("el Auditor no ve ninguna accion de escritura", async () => {
    limpiarCache();
    handlers([VIGENTE]);
    montar(3);

    await screen.findByText("Ana Solis");
    expect(screen.queryByRole("button", { name: /^Revocar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Revisar/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /registrar acceso/i }),
    ).not.toBeInTheDocument();
  });
});

describe("revisar un acceso", () => {
  it("un acceso vigente se revisa sin preguntar: no cambia de estado", async () => {
    const usuario = userEvent.setup();
    const alRevisar = vi.fn();
    limpiarCache();
    handlers([VIGENTE], alRevisar);
    montar(1);

    await screen.findByText("Ana Solis");
    await usuario.click(screen.getByRole("button", { name: /^Revisar el acceso/ }));

    await waitFor(() => {
      expect(alRevisar).toHaveBeenCalledWith("5");
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  /**
   * `PATCH /revisar` pone `estado = 'Vigente'` (contrato §6.3): sobre un acceso
   * revocado equivale a reactivarlo. Deshacer una revocacion con un boton
   * llamado "Revisar" y sin avisar seria un accidente esperando a ocurrir.
   */
  it("sobre un acceso revocado pide confirmacion antes de reactivarlo", async () => {
    const usuario = userEvent.setup();
    const alRevisar = vi.fn();
    limpiarCache();
    handlers([REVOCADO], alRevisar);
    montar(1);

    await screen.findByText("Luis Mora");
    await usuario.click(
      screen.getByRole("button", { name: /^Revisar y reactivar/ }),
    );

    const dialogo = await screen.findByRole("dialog");
    expect(dialogo).toHaveTextContent(/Reactivar un acceso revocado/);
    expect(dialogo).toHaveTextContent(/Vigente/);
    // Nada ha salido hacia el servidor todavia.
    expect(alRevisar).not.toHaveBeenCalled();
  });

  it("si se cancela la confirmacion, no se reactiva nada", async () => {
    const usuario = userEvent.setup();
    const alRevisar = vi.fn();
    limpiarCache();
    handlers([REVOCADO], alRevisar);
    montar(1);

    await screen.findByText("Luis Mora");
    await usuario.click(screen.getByRole("button", { name: /^Revisar y reactivar/ }));
    await screen.findByRole("dialog");
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(alRevisar).not.toHaveBeenCalled();
  });

  it("al confirmar si se envia la revision", async () => {
    const usuario = userEvent.setup();
    const alRevisar = vi.fn();
    limpiarCache();
    handlers([REVOCADO], alRevisar);
    montar(1);

    await screen.findByText("Luis Mora");
    await usuario.click(screen.getByRole("button", { name: /^Revisar y reactivar/ }));
    await screen.findByRole("dialog");
    await usuario.click(screen.getByRole("button", { name: "Revisar y reactivar" }));

    await waitFor(() => {
      expect(alRevisar).toHaveBeenCalledWith("6");
    });
  });
});

describe("revocar un acceso", () => {
  it("pide confirmacion y avisa de que revisar lo resucitaria", async () => {
    const usuario = userEvent.setup();
    const alRevocar = vi.fn();
    limpiarCache();
    handlers([VIGENTE], vi.fn(), alRevocar);
    montar(1);

    await screen.findByText("Ana Solis");
    await usuario.click(screen.getByRole("button", { name: /^Revocar el acceso/ }));

    const dialogo = await screen.findByRole("dialog");
    expect(dialogo).toHaveTextContent(/Marcarlo como revisado despues/);
    expect(alRevocar).not.toHaveBeenCalled();

    await usuario.click(screen.getByRole("button", { name: "Revocar" }));
    await waitFor(() => {
      expect(alRevocar).toHaveBeenCalledWith("5");
    });
  });
});
