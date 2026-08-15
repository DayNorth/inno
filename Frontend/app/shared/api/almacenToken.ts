/**
 * Unico lugar donde vive el access token (ADR-002).
 *
 * Variable de modulo, en memoria. No entra en estado de React, ni en props,
 * ni en un log, ni se serializa. Un F5 lo pierde a proposito: se rehidrata con
 * un refresh silencioso (`shared/auth/refresco.ts`).
 *
 * IMPORTANTE: este modulo solo puede importarse desde `shared/api/cliente.ts`
 * y desde `shared/auth/`. La regla `no-restricted-imports` de `eslint.config.js`
 * lo hace cumplir.
 */

let accessToken: string | null = null;

export function obtenerAccessToken(): string | null {
  return accessToken;
}

export function guardarAccessToken(token: string): void {
  accessToken = token;
}

export function limpiarAccessToken(): void {
  accessToken = null;
}
