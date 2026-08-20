import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/_app.productos";
import { requerirSesion } from "@/shared/auth/requerir";
import { ROLES_ESCRITURA } from "@/shared/tipos/rol";
import { ejecutarAccion, type ResultadoAccion } from "@/shared/api/resultado";
import { useAccion } from "@/shared/api/useAccion";
import { Alert } from "@/shared/ui/Alert/Alert";
import { Boton } from "@/shared/ui/Boton/Boton";
import { EncabezadoPagina } from "@/shared/ui/EncabezadoPagina/EncabezadoPagina";
import { EstadoVacio } from "@/shared/ui/EstadoVacio/EstadoVacio";
import { Modal } from "@/shared/ui/Modal/Modal";
import { ModalConfirmacion } from "@/shared/ui/Modal/ModalConfirmacion";
import { ToolbarTabla } from "@/shared/ui/Tabla/ToolbarTabla";
import { useFiltroTabla } from "@/shared/ui/Tabla/useFiltroTabla";
import { idProducto } from "@/shared/tipos/marca";
import {
  actualizarProducto,
  crearProducto,
  inactivarProducto,
  listarProductos,
  listarTodosLosProductos,
  reactivarProducto,
} from "@/features/productos/api/productosApi";
import type {
  DatosProducto,
  Producto,
} from "@/features/productos/dominio/producto";
import { ProductoFormulario } from "@/features/productos/components/ProductoFormulario";
import { ProductosTabla } from "@/features/productos/components/ProductosTabla";

export function meta() {
  return [{ title: "Productos · VinkaPlant" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const usuario = await requerirSesion(request);
  const incluirInactivos =
    new URL(request.url).searchParams.get("inactivos") === "1";

  const productos = incluirInactivos
    ? await listarTodosLosProductos(request.signal)
    : await listarProductos(request.signal);

  return {
    productos,
    incluirInactivos,
    puedeEscribir: ROLES_ESCRITURA.includes(usuario.id_rol),
  };
}

type PeticionProductos =
  | { readonly intencion: "crear"; readonly datos: DatosProducto }
  | {
      readonly intencion: "actualizar";
      readonly id: number;
      readonly datos: DatosProducto;
    }
  | { readonly intencion: "inactivar"; readonly id: number }
  | { readonly intencion: "reactivar"; readonly id: number };

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ResultadoAccion> {
  await requerirSesion(request);
  const peticion = (await request.json()) as PeticionProductos;

  return ejecutarAccion(async () => {
    switch (peticion.intencion) {
      case "crear":
        return await crearProducto(peticion.datos);
      case "actualizar":
        return await actualizarProducto(
          idProducto(peticion.id),
          peticion.datos,
        );
      case "inactivar":
        return await inactivarProducto(idProducto(peticion.id));
      case "reactivar":
        return await reactivarProducto(idProducto(peticion.id));
    }
  });
}

export default function Productos({ loaderData }: Route.ComponentProps) {
  const { productos, incluirInactivos, puedeEscribir } = loaderData;
  const accion = useAccion("productos");

  const [formularioPedido, setFormularioPedido] = useState(false);
  const [enEdicion, setEnEdicion] = useState<Producto | null>(null);
  const [porCambiarEstado, setPorCambiarEstado] = useState<Producto | null>(
    null,
  );

  const { filtro, setFiltro, resultado } = useFiltroTabla(productos, (p) => [
    p.nombre_producto,
    p.descripcion,
    p.ubicacion_invernadero,
    p.estado_fitosanitario,
  ]);

  const formularioAbierto = formularioPedido && !accion.exito;
  const confirmacionAbierta = porCambiarEstado !== null && !accion.exito;

  const abrirFormulario = (producto: Producto | null): void => {
    accion.reiniciar();
    setEnEdicion(producto);
    setFormularioPedido(true);
  };

  const enviar = (cuerpo: PeticionProductos): void => {
    accion.enviar(cuerpo);
  };

  return (
    <>
      <EncabezadoPagina
        titulo="Productos"
        subtitulo="Catalogo e inventario de plantas de VinkaPlant."
        acciones={
          puedeEscribir && (
            <Boton
              variante="primario"
              onClick={() => {
                abrirFormulario(null);
              }}
            >
              + Nuevo producto
            </Boton>
          )
        }
      />

      {accion.exito && <Alert tono="exito">{accion.resultado?.mensaje}</Alert>}
      {accion.error !== null && porCambiarEstado === null && (
        <Alert tono="error">{accion.error}</Alert>
      )}

      <p>
        <Link to={incluirInactivos ? "/productos" : "/productos?inactivos=1"}>
          {incluirInactivos ? "Ver solo activos" : "Ver tambien inactivos"}
        </Link>
      </p>

      {productos.length === 0 ? (
        <EstadoVacio
          titulo="Todavia no hay productos"
          detalle="Registra el primero con el boton de arriba."
        />
      ) : (
        <>
          <ToolbarTabla
            filtro={filtro}
            onFiltroChange={setFiltro}
            etiquetaBusqueda="Buscar por nombre, ubicacion o estado fitosanitario"
            mostrando={resultado.length}
            total={productos.length}
          />
          {resultado.length === 0 ? (
            <EstadoVacio
              titulo="Sin resultados"
              detalle={`Ningun producto coincide con "${filtro}".`}
            />
          ) : (
            <ProductosTabla
              productos={resultado}
              puedeEditar={puedeEscribir}
              ocupado={accion.ocupado}
              onEditar={abrirFormulario}
              onCambiarEstado={(p) => {
                accion.reiniciar();
                setPorCambiarEstado(p);
              }}
            />
          )}
        </>
      )}

      <Modal
        abierto={formularioAbierto}
        titulo={enEdicion === null ? "Nuevo producto" : "Editar producto"}
        onCerrar={() => {
          setFormularioPedido(false);
        }}
      >
        <ProductoFormulario
          productoEnEdicion={enEdicion}
          guardando={accion.ocupado}
          errorServidor={accion.error}
          onCancelar={() => {
            setFormularioPedido(false);
          }}
          onGuardar={(datos) => {
            enviar(
              enEdicion === null
                ? { intencion: "crear", datos }
                : {
                    intencion: "actualizar",
                    id: enEdicion.id_producto,
                    datos,
                  },
            );
          }}
        />
      </Modal>

      <ModalConfirmacion
        abierto={confirmacionAbierta}
        titulo={
          porCambiarEstado?.estado === "Activo"
            ? "Inactivar producto"
            : "Reactivar producto"
        }
        mensaje={
          porCambiarEstado === null
            ? ""
            : `${porCambiarEstado.estado === "Activo" ? "Se inactivara" : "Se reactivara"} el producto "${porCambiarEstado.nombre_producto}".`
        }
        textoConfirmar={
          porCambiarEstado?.estado === "Activo" ? "Inactivar" : "Reactivar"
        }
        destructivo={porCambiarEstado?.estado === "Activo"}
        ocupado={accion.ocupado}
        error={accion.error}
        onCancelar={() => {
          setPorCambiarEstado(null);
        }}
        onConfirmar={() => {
          if (porCambiarEstado === null) return;
          enviar({
            intencion:
              porCambiarEstado.estado === "Activo" ? "inactivar" : "reactivar",
            id: porCambiarEstado.id_producto,
          });
        }}
      />
    </>
  );
}
