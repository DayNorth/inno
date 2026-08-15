import type { RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

/**
 * Routing basado en ficheros. Anadir una pagina = crear un archivo en
 * `app/routes/`. El code-splitting por ruta lo hace el plugin, sin `lazy()`.
 *
 * Los `*.module.css` conviven con su pagina, asi que hay que excluirlos: si no,
 * `flatRoutes` los tomaria por rutas y `typegen` generaria tipos para ellos.
 */
export default flatRoutes({
  ignoredRouteFiles: ["**/*.css"],
}) satisfies RouteConfig;
