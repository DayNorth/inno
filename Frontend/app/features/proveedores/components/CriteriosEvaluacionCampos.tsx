import type { Control, FieldValues, Path } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { Badge } from "@/shared/ui/Badge/Badge";
import { CampoCheckbox } from "@/shared/ui/campos/CampoCheckbox";
import { RejillaCampos } from "@/shared/ui/campos/RejillaCampos";
import {
  evaluacionPrevista,
  tonoNivelRiesgo,
  tonoResultado,
  type CriteriosEvaluacion,
} from "../dominio/proveedor";

/**
 * Los cuatro criterios booleanos, con el puntaje previsto en vivo.
 *
 * Generico sobre el formulario contenedor: sirve tanto para el alta de
 * proveedor (que lleva ademas nombre y tipo de servicio) como para registrar
 * una evaluacion nueva.
 */
export function CriteriosEvaluacionCampos<
  T extends FieldValues & CriteriosEvaluacion,
>({ control }: { readonly control: Control<T> }) {
  const criterios = useWatch({ control }) as Partial<CriteriosEvaluacion>;

  const previsto = evaluacionPrevista({
    cifrado_datos: criterios.cifrado_datos === true,
    mfa_disponible: criterios.mfa_disponible === true,
    sla_definido: criterios.sla_definido === true,
    certificaciones_vigentes: criterios.certificaciones_vigentes === true,
  });

  return (
    <>
      <RejillaCampos>
        <CampoCheckbox
          control={control}
          name={"cifrado_datos" as Path<T>}
          etiqueta="Cifrado de datos"
        />
        <CampoCheckbox
          control={control}
          name={"mfa_disponible" as Path<T>}
          etiqueta="MFA disponible"
        />
        <CampoCheckbox
          control={control}
          name={"sla_definido" as Path<T>}
          etiqueta="SLA definido"
        />
        <CampoCheckbox
          control={control}
          name={"certificaciones_vigentes" as Path<T>}
          etiqueta="Certificaciones vigentes"
        />
      </RejillaCampos>

      <p>
        Puntaje previsto: <strong>{previsto.puntaje}</strong>{" "}
        <Badge tono={tonoResultado(previsto.resultado)}>{previsto.resultado}</Badge>{" "}
        <Badge tono={tonoNivelRiesgo(previsto.nivel)}>
          {`Riesgo ${previsto.nivel}`}
        </Badge>
        <br />
        <span>El resultado definitivo lo calcula el servidor.</span>
      </p>
    </>
  );
}
