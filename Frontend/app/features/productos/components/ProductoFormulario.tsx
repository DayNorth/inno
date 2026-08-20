import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/shared/ui/Alert/Alert";
import { AccionesFormulario } from "@/shared/ui/campos/AccionesFormulario";
import { CampoAreaTexto } from "@/shared/ui/campos/CampoAreaTexto";
import { CampoNumero } from "@/shared/ui/campos/CampoNumero";
import { CampoSelect, type OpcionSelect } from "@/shared/ui/campos/CampoSelect";
import { CampoTexto } from "@/shared/ui/campos/CampoTexto";
import { Formulario } from "@/shared/ui/campos/Formulario";
import { RejillaCampos } from "@/shared/ui/campos/RejillaCampos";
import { ResumenErrores } from "@/shared/ui/campos/ResumenErrores";
import {
  ESTADOS_FITOSANITARIOS,
  LARGOS_PRODUCTO,
  type DatosProducto,
  type Producto,
} from "../dominio/producto";
import {
  aFormulario,
  aPayload,
  reglasProducto,
  valoresInicialesProducto,
  type ProductoForm,
} from "../formulario/reglas";

const OPCIONES_ESTADO_FITOSANITARIO: readonly OpcionSelect[] =
  ESTADOS_FITOSANITARIOS.map((e) => ({ valor: e, etiqueta: e }));

interface Props {
  readonly productoEnEdicion: Producto | null;
  readonly guardando: boolean;
  readonly errorServidor: string | null;
  readonly onGuardar: (datos: DatosProducto) => void;
  readonly onCancelar: () => void;
}

export function ProductoFormulario({
  productoEnEdicion,
  guardando,
  errorServidor,
  onGuardar,
  onCancelar,
}: Props) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<ProductoForm>({
    defaultValues: valoresInicialesProducto,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    reset(
      productoEnEdicion === null
        ? valoresInicialesProducto
        : aFormulario(productoEnEdicion),
    );
  }, [productoEnEdicion, reset]);

  return (
    <Formulario
      onSubmit={handleSubmit((f) => {
        onGuardar(aPayload(f));
      })}
    >
      {errorServidor !== null && <Alert tono="error">{errorServidor}</Alert>}
      <ResumenErrores errores={errors} visible={isSubmitted} />

      <RejillaCampos>
        <CampoTexto
          control={control}
          name="nombre_producto"
          etiqueta="Nombre"
          reglas={reglasProducto.nombre_producto}
          maxLength={LARGOS_PRODUCTO.nombre_producto}
        />
        <CampoNumero
          control={control}
          name="cantidad_disponible"
          etiqueta="Cantidad disponible"
          reglas={reglasProducto.cantidad_disponible}
          min={0}
        />
        <CampoSelect
          control={control}
          name="estado_fitosanitario"
          etiqueta="Estado fitosanitario"
          opciones={OPCIONES_ESTADO_FITOSANITARIO}
          placeholder={null}
        />
        <CampoTexto
          control={control}
          name="ubicacion_invernadero"
          etiqueta="Ubicacion en invernadero"
          reglas={reglasProducto.ubicacion_invernadero}
          maxLength={LARGOS_PRODUCTO.ubicacion_invernadero}
        />
        <CampoAreaTexto
          control={control}
          name="descripcion"
          etiqueta="Descripcion"
          reglas={reglasProducto.descripcion}
          maxLength={LARGOS_PRODUCTO.descripcion}
        />
      </RejillaCampos>

      <AccionesFormulario
        guardando={guardando}
        editando={productoEnEdicion !== null}
        onCancelar={onCancelar}
      />
    </Formulario>
  );
}
