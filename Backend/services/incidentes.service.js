// Servicio de incidentes: DUEÑO de la transacción. Reporta (inserta + Bitacora)
// y resuelve (update condicional + Bitacora). Traduce la FK 547 al mensaje
// EXACTO del contrato. En resolver, si el UPDATE no afecta filas -> 404.
const { poolPromise } = require("../db");
const { conTransaccion } = require("../utils/transacciones");
const { ErrorConflicto, ErrorNoEncontrado } = require("../errors/AppError");
const { esViolacionFk } = require("../utils/erroresSql");
const incidentesRepo = require("../repositories/incidentes.repository");
const bitacoraRepo = require("../repositories/bitacora.repository");

async function listar() {
    const pool = await poolPromise;
    return incidentesRepo.listar(pool);
}

async function reportar(idUsuario, datos) {
    const pool = await poolPromise;

    try {
        return await conTransaccion(pool, async (transaction) => {
            const incidente = await incidentesRepo.insertar(transaction, datos);

            await bitacoraRepo.registrar(
                transaction,
                idUsuario,
                `Reportó el incidente ID ${incidente.id_incidente}: ${incidente.titulo}`
            );

            return incidente;
        });
    } catch (error) {
        if (esViolacionFk(error)) {
            throw new ErrorConflicto(
                "La plataforma o el responsable indicado no existe"
            );
        }
        throw error;
    }
}

async function resolver(idUsuario, idIncidente, fechaResolucion) {
    const fecha = fechaResolucion || new Date();
    const pool = await poolPromise;

    return conTransaccion(pool, async (transaction) => {
        const incidente = await incidentesRepo.resolver(
            transaction,
            idIncidente,
            fecha
        );

        if (!incidente) {
            throw new ErrorNoEncontrado(
                "Incidente no encontrado o ya está resuelto"
            );
        }

        await bitacoraRepo.registrar(
            transaction,
            idUsuario,
            `Resolvió el incidente ID ${idIncidente}`
        );

        return incidente;
    });
}

module.exports = { listar, reportar, resolver };
