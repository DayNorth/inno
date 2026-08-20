/**
 * Rutas de la aplicacion como constantes.
 *
 * El arbol real lo define el sistema de ficheros (`app/routes/`, ver
 * `routes.ts`); esto es solo el catalogo de destinos para `<Link>` y
 * `redirect()`, para no repetir literales por el codigo.
 */
export const RUTAS = {
  login: "/login",
  inicio: "/",
  clientes: "/clientes",
  productos: "/productos",
  pedidos: "/pedidos",
  proveedores: "/proveedores",
  accesos: "/accesos",
  dispositivos: "/dispositivos",
  riesgos: "/riesgos",
  incidentes: "/incidentes",
  bitacora: "/bitacora",
  documentos: "/documentos",
  usuarios: "/usuarios",
  permisos: "/permisos",
} as const;

export type Ruta = (typeof RUTAS)[keyof typeof RUTAS];

export const rutaPedidoDetalle = (id: number): string => `/pedidos/${id}`;
export const rutaProveedorDetalle = (id: number): string => `/proveedores/${id}`;
