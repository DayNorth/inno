import { Link, useSearchParams } from "react-router";
import type { ComponentType, SVGProps } from "react";
import type { Route } from "./+types/_app._index";
import { RUTAS } from "@/rutas";
import { requerirSesion } from "@/shared/auth/requerir";
import { ROLES_BITACORA, type IdRol } from "@/shared/tipos/rol";
import { Alert } from "@/shared/ui/Alert/Alert";
import { EncabezadoPagina } from "@/shared/ui/EncabezadoPagina/EncabezadoPagina";
import {
  IconoAccesos,
  IconoBitacora,
  IconoClientes,
  IconoDispositivos,
  IconoIncidentes,
  IconoPedidos,
  IconoProveedores,
  IconoRiesgos,
} from "@/shared/ui/Icono/Iconos";

export function meta() {
  return [{ title: "Inicio · VinkaPlant" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const usuario = await requerirSesion(request);
  return { nombre: usuario.nombre, rol: usuario.rol, id_rol: usuario.id_rol };
}

interface Tarjeta {
  readonly a: string;
  readonly titulo: string;
  readonly detalle: string;
  readonly Icono: ComponentType<SVGProps<SVGSVGElement>>;
  readonly roles?: readonly IdRol[];
}

const TARJETAS: readonly Tarjeta[] = [
  {
    a: RUTAS.clientes,
    titulo: "Clientes",
    detalle: "Alta, edicion y estado de los clientes.",
    Icono: IconoClientes,
  },
  {
    a: RUTAS.pedidos,
    titulo: "Pedidos",
    detalle: "Registro y seguimiento de pedidos de plantas.",
    Icono: IconoPedidos,
  },
  {
    a: RUTAS.proveedores,
    titulo: "Proveedores",
    detalle: "Evaluaciones de seguridad y planes de contingencia.",
    Icono: IconoProveedores,
  },
  {
    a: RUTAS.accesos,
    titulo: "Accesos",
    detalle: "Accesos a plataformas, revisiones y revocaciones.",
    Icono: IconoAccesos,
  },
  {
    a: RUTAS.dispositivos,
    titulo: "Dispositivos",
    detalle: "Inventario de equipos y su postura de seguridad.",
    Icono: IconoDispositivos,
  },
  {
    a: RUTAS.riesgos,
    titulo: "Riesgos",
    detalle: "Matriz de riesgos ordenada por criticidad.",
    Icono: IconoRiesgos,
  },
  {
    a: RUTAS.incidentes,
    titulo: "Incidentes",
    detalle: "Reporte y resolucion de incidentes.",
    Icono: IconoIncidentes,
  },
  {
    a: RUTAS.bitacora,
    titulo: "Bitacora",
    detalle: "Registro de auditoria del sistema.",
    Icono: IconoBitacora,
    roles: ROLES_BITACORA,
  },
];

export default function Inicio({ loaderData }: Route.ComponentProps) {
  const [parametros] = useSearchParams();
  const sinPermiso = parametros.get("sinPermiso") === "1";

  const visibles = TARJETAS.filter(
    (t) => t.roles === undefined || t.roles.includes(loaderData.id_rol),
  );

  return (
    <>
      <EncabezadoPagina
        titulo={
          loaderData.nombre === null
            ? "Bienvenido"
            : `Hola, ${loaderData.nombre}`
        }
        subtitulo={`Sesion iniciada como ${loaderData.rol}.`}
      />

      {sinPermiso && (
        <Alert tono="aviso">
          Tu rol no tiene acceso a esa seccion.
        </Alert>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4">
        {visibles.map((t) => (
          <Link
            key={t.a}
            to={t.a}
            className="flex flex-col gap-2 rounded-lg border border-line-soft bg-paper-raised p-6 text-inherit no-underline shadow-1 hover:border-marca"
          >
            <t.Icono className="h-5 w-5 text-marca" />
            <span className="font-titulos text-lg text-marca">{t.titulo}</span>
            <span className="text-sm text-ink-soft">{t.detalle}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
