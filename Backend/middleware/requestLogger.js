// Request logging con correlation id (pino-http).
// - Genera/propaga un x-request-id por petición y lo adjunta a cada log.
// - Expone el id en req.id y lo devuelve como header x-request-id para
//   trazabilidad extremo a extremo sin filtrar internals.
// - Hereda la config de `redact` del logger base (F-09): nunca loguea la
//   cookie de refresh, el Authorization Bearer ni el Set-Cookie.
const crypto = require("crypto");
const pinoHttp = require("pino-http");
const logger = require("../logger");

const requestLogger = pinoHttp({
    logger,
    // Correlation id: respeta un x-request-id entrante o genera uno nuevo.
    genReqId(req, res) {
        const entrante = req.headers["x-request-id"];
        const id =
            typeof entrante === "string" && entrante.trim()
                ? entrante.trim()
                : crypto.randomUUID();
        res.setHeader("x-request-id", id);
        return id;
    },
    // Niveles según resultado: 5xx -> error, 4xx -> warn, resto -> info.
    customLogLevel(req, res, err) {
        if (err || res.statusCode >= 500) {
            return "error";
        }
        if (res.statusCode >= 400) {
            return "warn";
        }
        return "info";
    },
    // Serializadores mínimos: solo lo necesario para diagnóstico, sin cuerpos.
    serializers: {
        req(req) {
            return {
                id: req.id,
                method: req.method,
                url: req.url
            };
        },
        res(res) {
            return {
                statusCode: res.statusCode
            };
        }
    }
});

module.exports = requestLogger;
