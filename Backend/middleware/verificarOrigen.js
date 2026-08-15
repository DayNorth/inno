// Middleware CSRF de segunda capa (Decision 1 del gate): en /api/auth/refresh y
// /api/auth/logout rechaza (403) toda peticion cuyo Origin (o Referer como
// fallback) no coincida con la allowlist. Delega la logica pura en
// utils/verificarOrigen para poder testearla aislada.
const { esOrigenPermitido } = require("../utils/verificarOrigen");
const { ErrorProhibido } = require("../errors/AppError");

function verificarOrigen(req, res, next) {
    if (!esOrigenPermitido(req.headers)) {
        return next(new ErrorProhibido("Origen no permitido"));
    }
    next();
}

module.exports = verificarOrigen;
