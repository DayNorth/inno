/** Roles del backend (contrato-api.md §1.3). */
export const ROLES = {
  administrador: 1,
  operador: 2,
  auditor: 3,
} as const;

export type IdRol = (typeof ROLES)[keyof typeof ROLES]; // 1 | 2 | 3

/** Anadir un rol rompe la compilacion aqui, en vez de renderizar vacio. */
export const ETIQUETA_ROL: Record<IdRol, string> = {
  1: "Administrador",
  2: "Operador",
  3: "Auditor",
};

export const esIdRol = (n: number): n is IdRol => n === 1 || n === 2 || n === 3;

/** Roles con permiso de escritura general (contrato-api.md §11). */
export const ROLES_ESCRITURA: readonly IdRol[] = [
  ROLES.administrador,
  ROLES.operador,
];

/** Excepcion 1: la bitacora la leen Administrador y Auditor. El Operador no. */
export const ROLES_BITACORA: readonly IdRol[] = [
  ROLES.administrador,
  ROLES.auditor,
];

/** Excepcion 2: revocar un acceso es exclusivo de Administrador. */
export const ROLES_REVOCAR_ACCESO: readonly IdRol[] = [ROLES.administrador];

/** Excepcion 3: administrar permisos y desbloquear usuarios es exclusivo de Administrador. */
export const ROLES_ADMIN: readonly IdRol[] = [ROLES.administrador];
