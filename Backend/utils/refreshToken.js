// Helpers puros del refresh token OPACO (no es un JWT). Se aislan aqui para
// poder testearlos sin BD ni HTTP y para no dispersar el uso de la pepper.
//
// Decision 2 del gate de seguridad:
//   - refresh token en claro = crypto.randomBytes(32) en base64url (256 bits).
//   - token_hash = HMAC-SHA256(REFRESH_TOKEN_PEPPER, refresh_token_claro) en hex
//     minuscula (64 chars). Determinista (pepper fija) -> lookup por igualdad
//     sobre el indice UNIQUE. La pepper es un secreto: NUNCA se loguea ni se
//     guarda en la tabla; vive solo en config.REFRESH_TOKEN_PEPPER.
const crypto = require("crypto");
const config = require("../config/env");

// Genera el refresh token en claro (256 bits de entropia) en base64url.
function generarRefreshTokenClaro() {
    return crypto.randomBytes(32).toString("base64url");
}

// Calcula el token_hash con HMAC-SHA256 usando la pepper de servidor. Devuelve
// 64 caracteres hex en minuscula. Determinista para el mismo (pepper, token).
function hashRefreshToken(tokenClaro) {
    return crypto
        .createHmac("sha256", config.REFRESH_TOKEN_PEPPER)
        .update(tokenClaro)
        .digest("hex");
}

// Fecha de expiracion en UTC = ahora + JWT_REFRESH_TTL_DIAS (por defecto 7).
// Devuelve un Date; el repositorio lo pasa como datetime2.
function calcularFechaExpiracion(ahora = new Date()) {
    const dias = config.JWT_REFRESH_TTL_DIAS;
    return new Date(ahora.getTime() + dias * 24 * 60 * 60 * 1000);
}

module.exports = {
    generarRefreshTokenClaro,
    hashRefreshToken,
    calcularFechaExpiracion
};
