import { Alert } from "@/shared/ui/Alert/Alert";
import { Boton } from "@/shared/ui/Boton/Boton";
import { AccionesModal } from "./AccionesModal";
import { Modal } from "./Modal";

interface Props {
  readonly abierto: boolean;
  readonly titulo: string;
  readonly mensaje: string;
  readonly textoConfirmar?: string;
  readonly destructivo?: boolean;
  readonly ocupado?: boolean;
  readonly error?: string | null;
  readonly onConfirmar: () => void;
  readonly onCancelar: () => void;
}

/** Confirmacion explicita para las acciones que no se pueden deshacer. */
export function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  destructivo = false,
  ocupado = false,
  error = null,
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <Modal
      abierto={abierto}
      titulo={titulo}
      tamano="estrecho"
      onCerrar={onCancelar}
    >
      <p>{mensaje}</p>
      {error !== null && <Alert tono="error">{error}</Alert>}
      <AccionesModal>
        <Boton variante="secundario" onClick={onCancelar} disabled={ocupado}>
          Cancelar
        </Boton>
        <Boton
          variante={destructivo ? "peligro" : "primario"}
          onClick={onConfirmar}
          disabled={ocupado}
        >
          {ocupado ? "Procesando…" : textoConfirmar}
        </Boton>
      </AccionesModal>
    </Modal>
  );
}
