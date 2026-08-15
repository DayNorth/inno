import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Config aparte de `vite.config.ts` a proposito: el plugin de React Router
 * arranca su propio pipeline de rutas, que no aporta nada bajo Vitest y
 * complica el entorno de test. Aqui basta con JSX + alias de rutas.
 */
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: true,
    restoreMocks: true,
  },
});
