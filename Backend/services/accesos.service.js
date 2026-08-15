// Servicio de accesos: DUEÑO de la transacción. Otorga (insert + Bitacora),
// revisa y revoca (update condicional + Bitacora). Traduce la FK 547 al mensaje
// EXACTO del contrato. Textos de Bitacora idénticos al legacy.
const { poolPromise } = require("../db");
const { conTransaccion } = require("../utils/transacciones");
const { ErrorConflicto, ErrorNoEncontrado } = require("../errors/AppError");
const { esViolacionFk } = require("../utils/erroresSql");
const accesosRepo = require("../repositories/accesos.repository");
const bitacoraRepo = require("../repositories/bitacora.repository");

async function listar() {
    const pool = await poolPromise;
    return accesosRepo.listar(pool);
}

async function crear(idUsuarioRegistra, datos) {
    const pool = await poolPromise;

    try {
        return await conTransaccion(pool, async (transaction) => {
            const acceso = await accesosRepo.insertar(transaction, datos);

            await bitacoraRepo.registrar(
                transaction,
                idUsuarioRegistra,
                `Otorgó acceso ID ${acceso.id_acceso} a plataforma ${datos.id_plataforma} para el usuario ${datos.id_usuario}`
            );

            return acceso;
        });
    } catch (error) {
        if (esViolacionFk(error)) {
            throw new ErrorConflicto(
                "El usuario o la plataforma indicada no existe"
            );
        }
        throw error;
    }
}

async function revisar(idUsuarioRegistra, idAcceso) {
    const pool = await poolPromise;

    return conTransaccion(pool, async (transaction) => {
        const acceso = await accesosRepo.marcarRevisado(transaction, idAcceso);

        if (!acceso) {
            throw new ErrorNoEncontrado("Acceso no encontrado");
        }

        await bitacoraRepo.registrar(
            transaction,
            idUsuarioRegistra,
            `Revisó el acceso ID ${idAcceso}`
        );

        return acceso;
    });
}

async function revocar(idUsuarioRegistra, idAcceso) {
    const pool = await poolPromise;

    return conTransaccion(pool, async (transaction) => {
        const acceso = await accesosRepo.revocar(transaction, idAcceso);

        if (!acceso) {
            throw new ErrorNoEncontrado("Acceso no encontrado o ya está revocado");
        }

        await bitacoraRepo.registrar(
            transaction,
            idUsuarioRegistra,
            `Revocó el acceso ID ${idAcceso}`
        );

        return acceso;
    });
}

module.exports = { listar, crear, revisar, revocar };
