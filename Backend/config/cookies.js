// Configuracion centralizada de la cookie del refresh token (Decision 1 del
// gate). Atributos EXACTOS: HttpOnly; Secure; SameSite=Strict; Path=/api/auth;
// Max-Age=<JWT_REFRESH_TTL_DIAS dias>. El nombre y los atributos se definen aqui
// una sola vez para que fijar y BORRAR la cookie usen exactamente los mismos
// atributos (borrar una cookie exige mismo Path/SameSite/etc).
const config = require("./env");

const NOMBRE_COOKIE_REFRESH = "refresh_token";

// Atributos comunes de la cookie de refresh. `secure` va siempre true: en
// produccion exige HTTPS; en localhost el navegador trata localhost como
// contexto seguro, asi que funciona en desarrollo.
const ATRIBUTOS_BASE = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/api/auth"
};

// Opciones para fijar la cookie (con Max-Age = TTL en ms).
function opcionesCookieRefresh() {
    return {
        ...ATRIBUTOS_BASE,
        maxAge: config.JWT_REFRESH_TTL_DIAS * 24 * 60 * 60 * 1000
    };
}

// Opciones para BORRAR la cookie (Max-Age 0, mismos atributos base).
function opcionesBorrarCookieRefresh() {
    return {
        ...ATRIBUTOS_BASE,
        maxAge: 0
    };
}

module.exports = {
    NOMBRE_COOKIE_REFRESH,
    opcionesCookieRefresh,
    opcionesBorrarCookieRefresh
};
