// Controlador de autenticacion: orquesta HTTP y es el UNICO lugar que toca la
// cookie del refresh. Lee el refresh desde req.cookies (cookie-parser), llama al
// service, y fija/borra la cookie httpOnly. El refresh NUNCA va en el JSON
// (Decision 4): en el body solo viaja el access token. Los errores se propagan
// al error handler central via asyncHandler.
const authService = require("../services/auth.service");
const {
    NOMBRE_COOKIE_REFRESH,
    opcionesCookieRefresh,
    opcionesBorrarCookieRefresh
} = require("../config/cookies");

// POST /api/auth/login -> { mensaje, token, usuario } + Set-Cookie refresh.
async function login(req, res) {
    const { accessToken, refreshTokenClaro, usuario } = await authService.login(
        req.body
    );

    res.cookie(
        NOMBRE_COOKIE_REFRESH,
        refreshTokenClaro,
        opcionesCookieRefresh()
    );

    res.status(200).json({
        mensaje: "Inicio de sesión correcto",
        token: accessToken,
        usuario
    });
}

// POST /api/auth/refresh -> { token } + Set-Cookie refresh ROTADO. El refresh
// entrante viaja en la cookie (no en el body).
async function refresh(req, res) {
    const refreshEntrante = req.cookies
        ? req.cookies[NOMBRE_COOKIE_REFRESH]
        : undefined;

    const { accessToken, refreshTokenClaro } =
        await authService.refresh(refreshEntrante);

    res.cookie(
        NOMBRE_COOKIE_REFRESH,
        refreshTokenClaro,
        opcionesCookieRefresh()
    );

    res.status(200).json({ token: accessToken });
}

// POST /api/auth/logout -> { mensaje } + borra la cookie. Idempotente.
async function logout(req, res) {
    const refreshEntrante = req.cookies
        ? req.cookies[NOMBRE_COOKIE_REFRESH]
        : undefined;

    await authService.logout(refreshEntrante);

    res.clearCookie(NOMBRE_COOKIE_REFRESH, opcionesBorrarCookieRefresh());

    res.status(200).json({ mensaje: "Sesión cerrada" });
}

module.exports = { login, refresh, logout };
