// Servicio de riesgos: DUEÑO de la transacción. Inserta y audita en Bitacora
// dentro de la misma transacción (mismo texto de acción que el legacy).
const { poolPromise } = require("../db");
const { conTransaccion } = require("../utils/transacciones");
const riesgosRepo = require("../repositories/riesgos.repository");
const bitacoraRepo = require("../repositories/bitacora.repository");

async function listar() {
    const pool = await poolPromise;
    return riesgosRepo.listar(pool);
}

async function crear(idUsuario, datos) {
    const pool = await poolPromise;

    return conTransaccion(pool, async (transaction) => {
        const riesgo = await riesgosRepo.insertar(transaction, datos);

        await bitacoraRepo.registrar(
            transaction,
            idUsuario,
            `Registró el riesgo ID ${riesgo.id_riesgo} en ${riesgo.sistema}`
        );

        return riesgo;
    });
}

module.exports = { listar, crear };
