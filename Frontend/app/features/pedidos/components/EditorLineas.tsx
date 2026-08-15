import { useFieldArray, useWatch, type Control } from "react-hook-form";
import { Alert } from "@/shared/ui/Alert/Alert";
import { Boton } from "@/shared/ui/Boton/Boton";
import { CampoNumero } from "@/shared/ui/campos/CampoNumero";
import { CampoSelect, type OpcionSelect } from "@/shared/ui/campos/CampoSelect";
import { formatearMoneda } from "@/shared/utils/formato";
import { TOPES_PEDIDO } from "../dominio/pedido";
import {
  lineaVacia,
  reglasLinea,
  subtotalDeLinea,
  totalPrevisto,
  type PedidoForm,
} from "../formulario/reglas";
import "./EditorLineas.css";

interface Props {
  readonly control: Control<PedidoForm>;
  readonly productos: readonly OpcionSelect[];
  readonly disabled: boolean;
}

export function EditorLineas({ control, productos, disabled }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "detalles",
  });

  const lineas = useWatch({ control, name: "detalles" });
  const total = totalPrevisto(lineas);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3>Plantas del pedido</h3>
        <Boton
          pequeno
          disabled={disabled}
          onClick={() => {
            append(lineaVacia());
          }}
        >
          + Anadir linea
        </Boton>
      </div>

      {fields.length === 0 && (
        <Alert tono="error">El pedido debe incluir al menos una planta</Alert>
      )}

      {fields.map((campo, indice) => {
        const linea = lineas[indice];
        const subtotal = linea === undefined ? 0 : subtotalDeLinea(linea);
        const excedido = subtotal > TOPES_PEDIDO.subtotalLinea;

        return (
          <div key={campo.id} className="editor-linea">
            <CampoSelect
              control={control}
              name={`detalles.${indice}.id_producto`}
              etiqueta="Planta"
              opciones={productos}
              reglas={reglasLinea.id_producto}
              numerico
              disabled={disabled}
            />
            <CampoNumero
              control={control}
              name={`detalles.${indice}.cantidad`}
              etiqueta="Cantidad"
              reglas={reglasLinea.cantidad}
              min={1}
              disabled={disabled}
            />
            <CampoNumero
              control={control}
              name={`detalles.${indice}.precio_unitario`}
              etiqueta="Precio"
              reglas={reglasLinea.precio_unitario}
              min={0}
              paso="any"
              disabled={disabled}
            />
            <div className="self-end pb-3 text-right [font-variant-numeric:tabular-nums]">
              <span className="text-sm font-semibold text-ink-soft">Subtotal</span>
              <span>{formatearMoneda(subtotal)}</span>
              {excedido && (
                <span role="alert">
                  El subtotal de la linea supera el maximo permitido
                </span>
              )}
            </div>
            <div className="editor-linea-quitar self-end pb-2">
              <Boton
                pequeno
                variante="fantasma"
                disabled={disabled || fields.length === 1}
                aria-label={`Quitar linea ${indice + 1}`}
                onClick={() => {
                  remove(indice);
                }}
              >
                Quitar
              </Boton>
            </div>
          </div>
        );
      })}

      <p className="flex justify-end gap-3 text-lg [font-variant-numeric:tabular-nums]">
        <span>Total previsto:</span>
        <strong>{formatearMoneda(total)}</strong>
      </p>
    </div>
  );
}
