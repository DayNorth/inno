import { describe, expect, it } from "vitest";
import {
  ROLES,
  ROLES_BITACORA,
  ROLES_ESCRITURA,
  ROLES_REVOCAR_ACCESO,
} from "@/shared/tipos/rol";
import { decodificarJwt } from "@/shared/auth/decodificarJwt";

/** Construye un JWT sin firmar. Sirve porque el cliente NO verifica la firma. */
function jwtDePrueba(claims: Record<string, unknown>): string {
  const b64 = (o: unknown): string =>
    btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(claims)}.firma-irrelevante`;
}

describe("matriz rol x capacidad (contrato-api.md §11)", () => {
  it("la bitacora la leen Administrador y Auditor, no el Operador", () => {
    expect(ROLES_BITACORA).toContain(ROLES.administrador);
    expect(ROLES_BITACORA).toContain(ROLES.auditor);
    expect(ROLES_BITACORA).not.toContain(ROLES.operador);
  });

  it("revocar un acceso es exclusivo del Administrador", () => {
    expect(ROLES_REVOCAR_ACCESO).toEqual([ROLES.administrador]);
  });

  it("el Auditor no escribe", () => {
    expect(ROLES_ESCRITURA).not.toContain(ROLES.auditor);
  });
});

describe("decodificarJwt", () => {
  it("lee los claims SIN verificar la firma: son solo para la interfaz", () => {
    const claims = decodificarJwt(
      jwtDePrueba({
        id_usuario: 1,
        correo: "ana@vinkaplant.cr",
        id_rol: 1,
        rol: "Administrador",
        exp: 1893456000,
      }),
    );

    expect(claims?.id_rol).toBe(1);
  });

  it("rechaza un token con un rol fuera del conjunto conocido", () => {
    expect(
      decodificarJwt(
        jwtDePrueba({
          id_usuario: 1,
          correo: "x@y.z",
          id_rol: 99,
          rol: "Superadmin",
          exp: 1893456000,
        }),
      ),
    ).toBeNull();
  });

  it.each(["", "no.es.jwt", "abc"])("devuelve null para %s", (token) => {
    expect(decodificarJwt(token)).toBeNull();
  });
});
