import { useState } from "react";
import { Link, useRevalidator } from "react-router";
import type { Route } from "./+types/_app.pedidos._index";
import { rutaPedidoDetalle } from "@/rutas";
import { requerirSesion } from "@/shared/auth/requerir";
import { ROLES_ESCRITURA } from "@/shared/tipos/rol";
import { fallo, type ResultadoAccion } from "@/shared/api/resultado";
import { useAccion } from "@/shared/api/useAccion";
import { Alert } from "@/shared/ui/Alert/Alert";
import { Boton } from "@/shared/ui/Boton/Boton";
import { EncabezadoPagina } from "@/shared/ui/EncabezadoPagina/EncabezadoPagina";
import { EstadoVacio } from "@/shared/ui/EstadoVacio/EstadoVacio";
import { Modal } from "@/shared/ui/Modal/Modal";
import { ToolbarTabla } from "@/shared/ui/Tabla/ToolbarTabla";
import { useFiltroTabla } from "@/shared/ui/Tabla/useFiltroTabla";
import { listarClientes } from "@/features/clientes/api/clientesApi";
import {
  listarProductos,
  opcionesDeProductos,
} from "@/features/catalogos/api/catalogosApi";
import { crearPedido, listarPedidos } from "@/features/pedidos/api/pedidosApi";
import type { DatosPedidoNuevo } from "@/features/pedidos/dominio/pedido";
import { PedidoFormulario } from "@/features/pedidos/components/PedidoFormulario";
import { PedidosTabla } from "@/features/pedidos/components/PedidosTabla";

export function meta() {
  return [{ title: "Pedidos · VinkaPlant" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const usuario = await requerirSesion(request);
  const puedeEscribir = ROLES_ESCRITURA.includes(usuario.id_rol);

  const [pedidos, clientes, productos] = await Promise.all([
    listarPedidos(request.signal),
    puedeEscribir ? listarClientes(request.signal) : Promise.resolve([]),
    puedeEscribir ? listarProductos(request.signal) : Promise.resolve([]),
  ]);

  return {
    pedidos,
    clientes: clientes.map((c) => ({ valor: c.id_cliente, etiqueta: c.nombre })),
    productos: opcionesDeProductos(productos),
    puedeEscribir,
  };
}

interface PeticionPedido {
  readonly datos: DatosPedidoNuevo;
}

/**
 * El POST devuelve solo `id_pedido` (contrato §13.9). Se conserva para ofrecer
 * un enlace al pedido recien creado, NO para navegar por cuenta propia.
 */
type ResultadoCrear = ResultadoAccion & { readonly id?: number };

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ResultadoCrear> {
  await requerirSesion(request);
  const peticion = (await request.json()) as PeticionPedido;

  try {
    const id = await crearPedido(peticion.datos);
    return { ok: true, mensaje: "Pedido creado correctamente", id };
  } catch (e) {
    return fallo(e);
  }
}

export default function Pedidos({ loaderData }: Route.ComponentProps) {
  const { pedidos, clientes, productos, puedeEscribir } = loaderData;
  const accion = useAccion<ResultadoCrear>("pedidos");
  const revalidador = useRevalidator();
  const [pedido, setPedido] = useState(false);
  const abierto = pedido && !accion.exito;

  // Tras crear se cierra el modal y se sigue en la lista, que React Router ya
  // revalido: el pedido nuevo aparece en la tabla. Antes se navegaba al detalle
  // por cuenta propia, y como el detalle lleva el formulario de cabecera,
  // parecia que crear un pedido abriera su edicion. Si el usuario quiere ir,
  // que lo decida el: ahi esta el enlace.
  const idCreado = accion.exito ? accion.resultado?.id : undefined;

  const { filtro, setFiltro, resultado } = useFiltroTabla(pedidos, (p) => [
    p.cliente,
    p.usuario,
    p.estado,
  ]);

  return (
    <>
      <EncabezadoPagina
        titulo="Pedidos"
        subtitulo="Registro y seguimiento de pedidos de plantas."
        acciones={
          <>
            <Boton
              onClick={() => {
                void revalidador.revalidate();
              }}
              disabled={revalidador.state !== "idle"}
            >
              Actualizar
            </Boton>
            {puedeEscribir && (
              <Boton
                variante="primario"
                onClick={() => {
                  accion.reiniciar();
                  setPedido(true);
                }}
              >
                + Nuevo pedido
              </Boton>
            )}
          </>
        }
      />

      {accion.error !== null && !abierto && (
        <Alert tono="error">{accion.error}</Alert>
      )}

      {accion.exito && (
        <Alert tono="exito">
          {accion.resultado?.mensaje}
          {idCreado !== undefined && (
            <>
              {" "}
              <Link to={rutaPedidoDetalle(idCreado)}>
                Ver el pedido #{idCreado}
              </Link>
            </>
          )}
        </Alert>
      )}

      {pedidos.length === 0 ? (
        <EstadoVacio
          titulo="Todavia no hay pedidos"
          detalle="Crea el primero con el boton de arriba."
        />
      ) : (
        <>
          <ToolbarTabla
            filtro={filtro}
            onFiltroChange={setFiltro}
            etiquetaBusqueda="Buscar por cliente, usuario o estado"
            mostrando={resultado.length}
            total={pedidos.length}
          />
          {resultado.length === 0 ? (
            <EstadoVacio
              titulo="Sin resultados"
              detalle={`Ningun pedido coincide con "${filtro}".`}
            />
          ) : (
            <PedidosTabla pedidos={resultado} />
          )}
        </>
      )}

      <Modal
        abierto={abierto}
        titulo="Nuevo pedido"
        tamano="ancho"
        onCerrar={() => {
          setPedido(false);
        }}
      >
        <PedidoFormulario
          clientes={clientes}
          productos={productos}
          guardando={accion.ocupado}
          errorServidor={accion.error}
          onCancelar={() => {
            setPedido(false);
          }}
          onGuardar={(datos) => {
            accion.enviar({ datos });
          }}
        />
      </Modal>
    </>
  );
}
