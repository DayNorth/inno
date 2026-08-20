// Servicio de usuarios: lectura de usuarios activos (ADR-001: auth-para-todos)
// y desbloqueo manual de cuentas bloqueadas por intentos fallidos.
const { poolPromise } = require("../db");
const { conTransaccion } = require("../utils/transacciones");
const { ErrorNoEncontrado } = require("../errors/AppError");
const usuariosRepo = require("../repositories/usuarios.repository");
const bitacoraRepo = require("../repositories/bitacora.repository");

async function listarActivos() {
    const pool = await poolPromise;
    return usuariosRepo.listarActivos(pool);
}

// PATCH /:id/desbloquear (rol Administrador). Resetea intentos_fallidos a 0
// para que el usuario pueda volver a intentar iniciar sesión.
async function desbloquear(idUsuarioAdmin, idUsuario) {
    const pool = await poolPromise;

    return conTransaccion(pool, async (transaction) => {
        const usuario = await usuariosRepo.resetearIntentosFallidos(
            transaction,
            idUsuario
        );

        if (!usuario) {
            throw new ErrorNoEncontrado("Usuario no encontrado");
        }

        await bitacoraRepo.registrar(
            transaction,
            idUsuarioAdmin,
            `Desbloqueó la cuenta del usuario ID ${idUsuario}`
        );

        return usuario;
    });
}

module.exports = { listarActivos, desbloquear };
