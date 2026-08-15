const jwt = require("jsonwebtoken");
const config = require("../config/env");

// Verifica el token JWT (access) enviado en el header Authorization.
// Si es válido, expone el payload en req.usuario y continúa.
// Verifica SIEMPRE contra el secreto de access (JWT_SECRET), nunca el de
// refresh. Lógica de verificación sin cambios respecto al comportamiento
// original (mismo payload, mismos mensajes 401).
function verificarToken(req, res, next) {
    const encabezado = req.headers["authorization"];

    if (!encabezado || !encabezado.startsWith("Bearer ")) {
        return res.status(401).json({
            mensaje: "Token no proporcionado"
        });
    }

    const token = encabezado.slice("Bearer ".length).trim();

    if (!token) {
        return res.status(401).json({
            mensaje: "Token no proporcionado"
        });
    }

    try {
        const payload = jwt.verify(token, config.JWT_SECRET);

        req.usuario = {
            id_usuario: payload.id_usuario,
            correo: payload.correo,
            id_rol: payload.id_rol,
            rol: payload.rol
        };

        next();
    } catch (_error) {
        return res.status(401).json({
            mensaje: "Token inválido o expirado"
        });
    }
}

// Restringe el acceso a los roles indicados.
// Debe usarse después de verificarToken.
function requerirRol(...rolesPermitidos) {
    return (req, res, next) => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.id_rol)) {
            return res.status(403).json({
                mensaje: "No tienes permiso para realizar esta acción"
            });
        }

        next();
    };
}

module.exports = {
    verificarToken,
    requerirRol
};
