/**
 * Booleano como icono + texto accesible.
 * Nunca solo color ni solo glifo: el lector de pantalla lee "Si"/"No".
 */
export function SiNo({ valor }: { readonly valor: boolean }) {
  return (
    <>
      <span aria-hidden="true">{valor ? "✓" : "✗"}</span>
      <span className="sr-only">{valor ? "Si" : "No"}</span>
    </>
  );
}
