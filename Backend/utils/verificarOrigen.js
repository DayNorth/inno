// Verificacion server-side de Origin/Referer contra la allowlist (Decision 1
// del gate: defensa en profundidad CSRF ademas de SameSite=Strict). Funcion
// PURA y testeable: recibe los headers y el origen permitido, devuelve boolean.
//
// Reglas:
//   - Si viene Origin, debe coincidir EXACTO con el origen permitido.
//   - Si no viene Origin, se cae a Referer: su origen (scheme+host+puerto) debe
//     coincidir con el permitido.
//   - Si faltan ambos, se rechaza (false). En un POST con cookie sin Origin ni
//     Referer no hay forma de acreditar el mismo sitio.
const config = require("../config/env");

// Extrae el origen (scheme://host[:port]) de una URL; null si no es una URL
// absoluta valida (p. ej. un Referer relativo o basura).
function origenDeUrl(url) {
    try {
        return new URL(url).origin;
    } catch (_e) {
        return null;
    }
}

// origenPermitido por defecto = config.CORS_ORIGIN (mismo valor que CORS).
function esOrigenPermitido(headers, origenPermitido = config.CORS_ORIGIN) {
    const origin = headers && headers.origin;
    const referer = headers && (headers.referer || headers.referrer);

    if (origin) {
        return origin === origenPermitido;
    }

    if (referer) {
        return origenDeUrl(referer) === origenPermitido;
    }

    return false;
}

module.exports = { esOrigenPermitido, origenDeUrl };
