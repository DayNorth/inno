// Configuración ESLint 9+ (flat config) para el backend Node/CommonJS.
// Reglas recomendadas de @eslint/js + ajustes del baseline de mantenibilidad:
//  - no-unused-vars / no-undef para higiene de imports y variables.
//  - eqeqeq para comparaciones estrictas.
//  - no-console como "warn" para empujar al logger pino, con excepción en el
//    bootstrap de configuración (config/env.js), donde el fail-fast usa console
//    antes de que exista el logger.
// eslint-config-prettier desactiva las reglas de formato para no chocar con
// Prettier (que es el único dueño del formato). Identificadores en español: no
// hay regla que los penalice.
const js = require("@eslint/js");
const globals = require("globals");
const prettier = require("eslint-config-prettier");

module.exports = [
    {
        ignores: ["node_modules/**", "uploads/**"]
    },
    js.configs.recommended,
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: "commonjs",
            globals: {
                ...globals.node
            }
        },
        rules: {
            eqeqeq: ["error", "always"],
            "no-console": "warn",
            "no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_"
                }
            ]
        }
    },
    {
        // El bootstrap de configuración usa console para el fail-fast antes de
        // que exista el logger; se permite ahí explícitamente.
        files: ["config/env.js"],
        rules: {
            "no-console": "off"
        }
    },
    {
        // Los tests usan el runner nativo node:test; sus globals de aserción
        // vienen de módulos, pero describe/it se importan, así que basta node.
        files: ["tests/**/*.js"],
        rules: {
            "no-console": "off"
        }
    },
    prettier
];
