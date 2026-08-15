// Instancia pino centralizada + configuración de redacción de secretos.
// Nunca se loguean secretos: la config de `redact` elimina por path los
// campos sensibles ANTES de escribir el log (F-09).
const pino = require("pino");
const config = require("./config/env");

// Paths a redactar. Cubre cabeceras (Authorization Bearer, cookie con el
// refresh, Set-Cookie de la respuesta), cuerpos con material sensible y
// cualquier campo pepper/secret/token_hash que se cuele en un objeto logueado.
const rutasRedactadas = [
    "req.headers.authorization",
    "req.headers.cookie",
    'res.headers["set-cookie"]',
    "req.body.password",
    "req.body.token",
    "req.body.refreshToken",
    "req.body.refresh_token",
    // Campos de secretos y credenciales que jamás deben imprimirse (defensa en
    // profundidad): cubre objetos anidados con token/refresh además del hash/pepper.
    "*.password",
    "*.token",
    "*.refreshToken",
    "*.refresh_token",
    "*.token_hash",
    "*.tokenHash",
    "*.pepper",
    "*.secret",
    "pepper",
    "secret",
    "token_hash",
    "tokenHash"
];

const logger = pino({
    level: config.esProduccion ? "info" : "debug",
    redact: {
        paths: rutasRedactadas,
        censor: "[REDACTADO]"
    },
    // En dev, salida legible; en prod/test, JSON crudo (bajo overhead).
    transport:
        config.NODE_ENV === "development"
            ? {
                  target: "pino-pretty",
                  options: {
                      translateTime: "SYS:HH:MM:ss",
                      ignore: "pid,hostname"
                  }
              }
            : undefined
});

module.exports = logger;
module.exports.rutasRedactadas = rutasRedactadas;
