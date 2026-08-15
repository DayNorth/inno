import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { RUTAS } from "@/rutas";
import { useSesion } from "@/shared/auth/sesion";
import { cerrarSesion, cerrarSesionLocalmente } from "@/shared/auth/cerrarSesion";
import { alCerrarEnOtraPestana, type MotivoCierre } from "@/shared/auth/canalSesion";
import { vigilarSesion } from "@/shared/auth/inactividad";
import { ROLES_BITACORA, type IdRol } from "@/shared/tipos/rol";
import { Boton } from "@/shared/ui/Boton/Boton";
import { Cargando } from "@/shared/ui/Cargando/Cargando";
import {
  IconoAccesos,
  IconoBitacora,
  IconoClientes,
  IconoDispositivos,
  IconoDocumentos,
  IconoIncidentes,
  IconoInicio,
  IconoLogout,
  IconoPedidos,
  IconoProveedores,
  IconoRiesgos,
} from "@/shared/ui/Icono/Iconos";
import { iniciales } from "@/shared/utils/iniciales";
import { AlternarTema } from "./AlternarTema";
import { cx } from "@/shared/utils/cx";
import type { ComponentType, SVGProps } from "react";

interface ItemNav {
  readonly a: string;
  readonly etiqueta: string;
  readonly Icono: ComponentType<SVGProps<SVGSVGElement>>;
  /** `undefined` = visible para cualquier rol autenticado. */
  readonly roles?: readonly IdRol[];
}

const NAVEGACION: readonly ItemNav[] = [
  { a: RUTAS.inicio, etiqueta: "Inicio", Icono: IconoInicio },
  { a: RUTAS.clientes, etiqueta: "Clientes", Icono: IconoClientes },
  { a: RUTAS.pedidos, etiqueta: "Pedidos", Icono: IconoPedidos },
  { a: RUTAS.proveedores, etiqueta: "Proveedores", Icono: IconoProveedores },
  { a: RUTAS.accesos, etiqueta: "Accesos", Icono: IconoAccesos },
  { a: RUTAS.dispositivos, etiqueta: "Dispositivos", Icono: IconoDispositivos },
  { a: RUTAS.riesgos, etiqueta: "Riesgos", Icono: IconoRiesgos },
  { a: RUTAS.incidentes, etiqueta: "Incidentes", Icono: IconoIncidentes },
  { a: RUTAS.bitacora, etiqueta: "Bitacora", Icono: IconoBitacora, roles: ROLES_BITACORA },
  { a: RUTAS.documentos, etiqueta: "Documentos", Icono: IconoDocumentos },
];

/**
 * Pantallas dominadas por una tabla: usan el ancho ampliado (frontend-ui.md
 * §3.1). Las de detalle no, porque su rejilla es de dos columnas.
 */
const RUTAS_DE_DATOS: readonly string[] = [
  RUTAS.clientes,
  RUTAS.pedidos,
  RUTAS.proveedores,
  RUTAS.accesos,
  RUTAS.dispositivos,
  RUTAS.riesgos,
  RUTAS.incidentes,
  RUTAS.bitacora,
];

export function AppShell() {
  /**
   * `useSesion` y no `useSesionRequerida`: al cerrar sesion —o ante cualquier
   * 401 que la tumbe— el estado pasa a `null` mientras este componente sigue
   * montado, y lanzar ahi rompe el render entero contra el error boundary en
   * vez de dejar que la redireccion a /login ocurra.
   */
  const usuario = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [avisoInactividad, setAvisoInactividad] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const irALogin = useCallback(
    (motivo: MotivoCierre) => {
      void navegar(`${RUTAS.login}?motivo=${motivo}`, { replace: true });
    },
    [navegar],
  );

  /** Cierra sesion y sale a /login. El cierre local ocurre pase lo que pase. */
  const salir = useCallback(
    (motivo: MotivoCierre) => {
      void cerrarSesion(motivo).finally(() => {
        irALogin(motivo);
      });
    },
    [irALogin],
  );

  // Inactividad (15 min) y tope absoluto (8 h).
  useEffect(() => {
    return vigilarSesion({
      avisar: () => {
        setAvisoInactividad(true);
      },
      cancelarAviso: () => {
        setAvisoInactividad(false);
      },
      cerrar: salir,
    });
  }, [salir]);

  // Cierre iniciado en otra pestana: se aplica localmente y NO se re-emite.
  useEffect(() => {
    return alCerrarEnOtraPestana(() => {
      cerrarSesionLocalmente();
      irALogin("otraPestana");
    });
  }, [irALogin]);

  // La sesion acaba de caerse: el guard del loader ya esta llevando a /login.
  // Se pinta un estado neutro en lugar de reventar el arbol.
  if (usuario === null) {
    return <Cargando mensaje="Cerrando sesion…" pantallaCompleta />;
  }

  const visibles = NAVEGACION.filter(
    (i) => i.roles === undefined || i.roles.includes(usuario.id_rol),
  );

  return (
    <div className="flex min-h-screen max-[720px]:flex-col">
      <a className="saltarAlContenido" href="#contenido">
        Saltar al contenido
      </a>

      <aside className="flex w-60 flex-none flex-col gap-6 border-r border-line-soft bg-paper px-4 py-6 max-[720px]:w-full max-[720px]:border-r-0 max-[720px]:border-b">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-marca text-marca-contraste"
          >
            <IconoAccesos className="h-[18px] w-[18px]" />
          </span>
          <div className="flex flex-col leading-tight">
            <p className="font-titulos text-lg text-ink">
              Vinka<span className="text-marca">Plant</span>
            </p>
            <p className="text-[11px] font-semibold tracking-wide text-ink-tenue uppercase">
              Gestion de seguridad
            </p>
          </div>
        </div>
        <nav
          className="flex flex-col gap-1 max-[720px]:flex-row max-[720px]:flex-wrap"
          aria-label="Secciones"
        >
          {visibles.map((item) => (
            <NavLink
              key={item.a}
              to={item.a}
              end={item.a === RUTAS.inicio}
              className={({ isActive }) =>
                cx(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-ink-soft no-underline hover:bg-paper-sutil hover:text-ink",
                  isActive && "bg-marca-suave text-marca font-semibold",
                )
              }
            >
              <item.Icono className="h-[18px] w-[18px] flex-none" />
              {item.etiqueta}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-4 border-b border-line-soft bg-paper px-8 py-3 max-[720px]:px-4">
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-col items-end leading-[1.3]">
              <span className="text-sm font-semibold">
                {usuario.nombre ?? usuario.correo}
              </span>
              <span className="text-xs text-ink-soft">{usuario.rol}</span>
            </div>
            <span
              aria-hidden="true"
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-marca-suave text-xs font-semibold text-marca"
            >
              {iniciales(usuario.nombre, usuario.correo)}
            </span>
          </div>
          <AlternarTema />
          <Boton
            variante="secundario"
            pequeno
            disabled={cerrando}
            onClick={() => {
              setCerrando(true);
              salir("manual");
            }}
          >
            <IconoLogout className="h-[16px] w-[16px]" />
            Cerrar sesion
          </Boton>
        </header>

        {avisoInactividad && (
          <p
            className="border-b border-warn bg-warn-suave px-8 py-3 text-sm max-[720px]:px-4"
            role="status"
          >
            Tu sesion se cerrara en menos de un minuto por inactividad. Mueve el
            raton o pulsa una tecla para continuar.
          </p>
        )}

        <main
          id="contenido"
          className="mx-auto w-full max-w-[var(--ancho-max)] flex-1 p-8 max-[720px]:px-4 data-[ancho=datos]:max-w-[var(--ancho-max-datos)]"
          data-ancho={
            RUTAS_DE_DATOS.includes(ubicacion.pathname) ? "datos" : undefined
          }
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
