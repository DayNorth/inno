import { useId, type FormEvent, type ReactNode } from "react";
import { ContextoFormulario } from "./contextoFormulario";

interface Props {
  /**
   * Devuelve `unknown` a proposito: `handleSubmit()` de react-hook-form
   * devuelve una promesa, y el descarte se centraliza aqui en vez de repetir
   * un `void` en los once formularios.
   */
  readonly onSubmit: (evento: FormEvent<HTMLFormElement>) => unknown;
  readonly children: ReactNode;
}

/**
 * `noValidate` se mantiene a proposito: la validacion nativa mostraria burbujas
 * propias, en ingles y descoordinadas de nuestros mensajes. Los atributos HTML
 * (`required`, `maxLength`, `type`, `pattern`) SI se conservan en cada control,
 * porque los lee la tecnologia de asistencia.
 */
export function Formulario({ onSubmit, children }: Props) {
  const prefijo = useId();
  return (
    <ContextoFormulario.Provider value={prefijo}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(evento) => {
          void onSubmit(evento);
        }}
        noValidate
      >
        {children}
      </form>
    </ContextoFormulario.Provider>
  );
}
