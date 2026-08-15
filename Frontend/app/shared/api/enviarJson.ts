import type { SubmitTarget } from "react-router";

interface OpcionesEnvio {
  readonly method: "post";
  readonly encType: "application/json";
}

/** Devuelve `unknown`: `fetcher.submit` es asincrono y su promesa se descarta. */
type Enviar = (objetivo: SubmitTarget, opciones: OpcionesEnvio) => unknown;

/**
 * Envia un payload tipado a un `clientAction` como JSON.
 *
 * La conversion existe porque `SubmitTarget` exige un objeto con firma de
 * indice y nuestros payloads son interfaces cerradas: TypeScript no las
 * considera asignables aunque el JSON resultante sea identico. Concentrarla
 * aqui evita repetir la conversion en cada pantalla.
 */
export function enviarJson(enviar: Enviar, cuerpo: object): void {
  void enviar(cuerpo as SubmitTarget, {
    method: "post",
    encType: "application/json",
  });
}
