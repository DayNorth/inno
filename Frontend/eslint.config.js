import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default tseslint.config(
  {
    ignores: [
      "build/**",
      ".react-router/**",
      "node_modules/**",
      "coverage/**",
      "deploy/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  jsxA11y.flatConfigs.recommended,
  reactHooks.configs.flat["recommended-latest"],

  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.es2022 },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: { react: { version: "detect" } },
    rules: {
      // --- Contencion de XSS (frontend-seguridad.md §3.4) ---
      "react/no-danger": "error",
      "react/jsx-no-target-blank": ["error", { enforceDynamicLinks: "always" }],
      // Los estilos inline obligarian a 'unsafe-inline' en style-src.
      "react/forbid-dom-props": ["error", { forbid: ["style"] }],
      "no-restricted-properties": [
        "error",
        { object: "window", property: "eval" },
        { object: "document", property: "write" },
        { object: "document", property: "writeln" },
      ],
      "no-restricted-globals": [
        "error",
        { name: "eval", message: "Prohibido: sink de XSS." },
        {
          name: "localStorage",
          message: "Prohibido (frontend-seguridad.md §9.3). El estado va en memoria.",
        },
        {
          name: "sessionStorage",
          message: "Prohibido (frontend-seguridad.md §9.3). El estado va en memoria.",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name='window'][property.name=/^(localStorage|sessionStorage)$/]",
          message: "Prohibido (frontend-seguridad.md §9.3).",
        },
        {
          selector: "NewExpression[callee.name='Function']",
          message: "Prohibido: sink de XSS equivalente a eval.",
        },
      ],
      // El access token solo lo lee shared/api/cliente.ts.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/shared/api/almacenToken*", "@/shared/api/almacenToken*"],
              message: "El access token solo lo lee shared/api/cliente.ts.",
            },
          ],
        },
      ],

      // --- Tipado ---
      "@typescript-eslint/no-explicit-any": "error",
      // `throw redirect(...)` y `throw new Response(...)` son el idioma de
      // React Router para cortar un loader: son Response, no Error.
      "@typescript-eslint/only-throw-error": [
        "error",
        { allow: [{ from: "lib", name: "Response" }] },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      "react/prop-types": "off",
    },
  },

  // Los ficheros de configuracion y los scripts de Node quedan fuera del
  // proyecto de TS, asi que no pueden usar reglas con tipos.
  {
    files: ["**/*.js", "**/*.mjs"],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      globals: { ...globals.node },
    },
  },

  // Las excepciones se declaran explicitamente, archivo a archivo.
  {
    files: ["app/shared/api/cliente.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    files: ["tests/**/*.{ts,tsx}", "*.config.ts", "eslint.config.js"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "no-restricted-imports": "off",
    },
  },
);
