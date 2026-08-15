import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import {
  idAcceso,
  idCliente,
  idDispositivo,
  idIncidente,
  idPedido,
  idPlataforma,
  idProveedor,
  idRiesgo,
  idUsuario,
} from "@/shared/tipos/marca";
import { ClientesTabla } from "@/features/clientes/components/ClientesTabla";
import { PedidosTabla } from "@/features/pedidos/components/PedidosTabla";
import { RiesgosTabla } from "@/features/riesgos/components/RiesgosTabla";
import { DispositivosTabla } from "@/features/dispositivos/components/DispositivosTabla";
import { AccesosTabla } from "@/features/accesos/components/AccesosTabla";
import { IncidentesTabla } from "@/features/incidentes/components/IncidentesTabla";
import { ProveedoresTabla } from "@/features/proveedores/components/ProveedoresTabla";
import { Modal } from "@/shared/ui/Modal/Modal";

/** Varias tablas enlazan al detalle, asi que necesitan router alrededor. */
function montar(elemento: ReactElement) {
  const Stub = createRoutesStub([{ path: "/", Component: () => elemento }]);
  return render(<Stub initialEntries={["/"]} />);
}

const CLIENTE = {
  id_cliente: idCliente(1),
  nombre: "Asia Botanical Trading",
  pais: "Singapur",
  correo: "compras@asia-botanical.example",
  telefono: "+65 555 0000",
  estado: "Activo",
} as const;

const PEDIDO = {
  id_pedido: idPedido(1003),
  id_cliente: idCliente(1),
  cliente: "ZhanHao Ltd",
  id_usuario: idUsuario(1),
  usuario: "Administrador",
  fecha: "2026-07-20",
  estado: "Pendiente",
  cantidad_productos: 2,
  total: 9700,
} as const;

const RIESGO = {
  id_riesgo: idRiesgo(7),
  sistema: "ERP",
  categoria: "Disponibilidad",
  descripcion: "Caida del proveedor de nube",
  probabilidad: 4,
  impacto: 5,
  control_mitigante: null,
  fecha_registro: "2026-07-16",
} as const;

const DISPOSITIVO = {
  id_dispositivo: idDispositivo(2),
  id_usuario: idUsuario(1),
  responsable: "Ana Solis",
  codigo_equipo: "EQ-014",
  tipo_dispositivo: "Portatil",
  sistema_operativo: "Windows 11",
  antivirus_activo: true,
  fecha_ultima_actualizacion: "2026-07-01",
  tiene_ups: false,
  estado_seguridad: "No cumple",
} as const;

const ACCESO = {
  id_acceso: idAcceso(5),
  id_usuario: idUsuario(1),
  usuario: "Ana Solis",
  id_plataforma: idPlataforma(2),
  plataforma: "ERP",
  rol_acceso: "Administrador",
  fecha_alta: "2026-06-01",
  fecha_ultima_revision: null,
  estado: "Vigente",
} as const;

const INCIDENTE = {
  id_incidente: idIncidente(4),
  id_plataforma: idPlataforma(2),
  plataforma: "ERP",
  id_usuario_responsable: idUsuario(1),
  responsable: "Ana Solis",
  titulo: "Interrupcion del servicio",
  fecha_inicio: "2026-07-18T14:00:00.000Z",
  fecha_resolucion: null,
  procedimiento_alterno: null,
  estado: "Abierto",
} as const;

const PROVEEDOR = {
  id_proveedor: idProveedor(3),
  nombre_proveedor: "Vivero Sur",
  tipo_servicio: "Logistica",
  estado_contrato: "Activo",
  id_evaluacion: 9,
  fecha_evaluacion: "2026-07-16",
  puntaje_total: 75,
  resultado: "Aprobado",
  nivel_riesgo: "Medio",
} as const;

/** Criterio 14 de frontend-ui.md §8. */
describe("accesibilidad de las tablas", () => {
  // Fabricas y no elementos: un array de JSX haria saltar `react/jsx-key`, y
  // ademas construye los elementos antes de que corra su test.
  it.each([
    [
      "Clientes",
      () => (
        <ClientesTabla
          clientes={[CLIENTE]}
          puedeEditar
          ocupado={false}
          onEditar={vi.fn()}
          onCambiarEstado={vi.fn()}
        />
      ),
    ],
    ["Pedidos", () => <PedidosTabla pedidos={[PEDIDO]} />],
    ["Riesgos", () => <RiesgosTabla riesgos={[RIESGO]} />],
    ["Dispositivos", () => <DispositivosTabla dispositivos={[DISPOSITIVO]} />],
    [
      "Accesos",
      () => (
        <AccesosTabla
          accesos={[ACCESO]}
          puedeRevisar
          puedeRevocar
          ocupado={false}
          onRevisar={vi.fn()}
          onRevocar={vi.fn()}
        />
      ),
    ],
    [
      "Incidentes",
      () => (
        <IncidentesTabla
          incidentes={[INCIDENTE]}
          puedeResolver
          ocupado={false}
          onResolver={vi.fn()}
        />
      ),
    ],
    ["Proveedores", () => <ProveedoresTabla proveedores={[PROVEEDOR]} />],
  ])("%s no tiene violaciones", async (_nombre, construir) => {
    const { container } = montar(construir());
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("estados comunicados con texto, no solo con color", () => {
  it("el badge de un pedido lleva el nombre del estado", () => {
    montar(<PedidosTabla pedidos={[PEDIDO]} />);
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("los booleanos de un dispositivo tienen texto para lector de pantalla", () => {
    montar(<DispositivosTabla dispositivos={[DISPOSITIVO]} />);
    expect(screen.getAllByText("Si").length).toBeGreaterThan(0);
    expect(screen.getAllByText("No").length).toBeGreaterThan(0);
  });

  /** Excepcion de rol del contrato §6.1: revocar es solo del Administrador. */
  it("no renderiza Revocar cuando el rol no puede revocar", () => {
    montar(
      <AccesosTabla
        accesos={[ACCESO]}
        puedeRevisar
        puedeRevocar={false}
        ocupado={false}
        onRevisar={vi.fn()}
        onRevocar={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: /^Revocar/ })).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Revisar el acceso de Ana Solis a ERP",
      }),
    ).toBeInTheDocument();
  });

  /**
   * Sin contexto en el nombre accesible, un lector de pantalla lista N botones
   * "Revisar" identicos y no hay forma de saber a que fila pertenece cada uno.
   */
  it("cada accion de fila se identifica por usuario y plataforma", () => {
    montar(
      <AccesosTabla
        accesos={[ACCESO, { ...ACCESO, id_acceso: idAcceso(6), usuario: "Luis Mora" }]}
        puedeRevisar
        puedeRevocar
        ocupado={false}
        onRevisar={vi.fn()}
        onRevocar={vi.fn()}
      />,
    );

    const nombres = screen
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label") ?? b.textContent);

    expect(new Set(nombres).size).toBe(nombres.length);
  });

  it("avisa en el propio nombre del boton cuando revisar reactivaria el acceso", () => {
    montar(
      <AccesosTabla
        accesos={[{ ...ACCESO, estado: "Revocado" }]}
        puedeRevisar
        puedeRevocar
        ocupado={false}
        onRevisar={vi.fn()}
        onRevocar={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Revisar y reactivar/ }),
    ).toBeInTheDocument();
  });
});

describe("accesibilidad del dialogo", () => {
  it("el modal se anuncia como dialogo y no tiene violaciones", async () => {
    const { container } = montar(
      <Modal abierto titulo="Nuevo cliente" onCerrar={vi.fn()}>
        <p>Contenido</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    expect(await axe(container)).toHaveNoViolations();
  });
});
