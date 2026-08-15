import { Boton } from "@/shared/ui/Boton/Boton";

interface Props {
  readonly guardando: boolean;
  readonly editando?: boolean;
  readonly textoGuardar?: string;
  readonly onCancelar?: () => void;
}

export function AccionesFormulario({
  guardando,
  editando = false,
  textoGuardar,
  onCancelar,
}: Props) {
  const etiqueta = textoGuardar ?? (editando ? "Guardar cambios" : "Registrar");

  return (
    <div className="flex flex-wrap justify-end gap-3 border-t border-line-soft pt-4">
      {onCancelar !== undefined && (
        <Boton variante="secundario" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Boton>
      )}
      <Boton type="submit" variante="primario" disabled={guardando}>
        {guardando ? "Guardando…" : etiqueta}
      </Boton>
    </div>
  );
}
