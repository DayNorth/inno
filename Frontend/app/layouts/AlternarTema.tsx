import { useState } from "react";
import { Boton } from "@/shared/ui/Boton/Boton";
import { IconoLuna, IconoSol } from "@/shared/ui/Icono/Iconos";

type Tema = "sistema" | "claro" | "oscuro";

const SIGUIENTE: Record<Tema, Tema> = {
  sistema: "oscuro",
  oscuro: "claro",
  claro: "sistema",
};

const ETIQUETA: Record<Tema, string> = {
  sistema: "Tema: sistema",
  claro: "Tema: claro",
  oscuro: "Tema: oscuro",
};

/**
 * La preferencia NO se persiste: `localStorage` esta prohibido en toda la
 * aplicacion (frontend-seguridad.md §9.3). Al recargar se vuelve a
 * `prefers-color-scheme`, que es el comportamiento correcto por defecto.
 */
export function AlternarTema() {
  const [tema, setTema] = useState<Tema>("sistema");

  return (
    <Boton
      variante="fantasma"
      pequeno
      aria-label={ETIQUETA[tema]}
      onClick={() => {
        const nuevo = SIGUIENTE[tema];
        setTema(nuevo);
        if (nuevo === "sistema") {
          document.documentElement.removeAttribute("data-theme");
        } else {
          document.documentElement.setAttribute(
            "data-theme",
            nuevo === "oscuro" ? "dark" : "light",
          );
        }
      }}
    >
      {tema === "oscuro" ? (
        <IconoLuna className="h-[16px] w-[16px]" />
      ) : (
        <IconoSol className="h-[16px] w-[16px]" />
      )}
      {ETIQUETA[tema]}
    </Boton>
  );
}
