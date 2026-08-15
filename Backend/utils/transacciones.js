// Helper que centraliza el ciclo begin/commit/rollback de una transacción
// mssql. Elimina la repetición del manejo de rollback que hoy se copia en
// cada endpoint mutante. El service es el DUEÑO de la transacción: le pasa
// `fn(transaction)` y usa ese `transaction` para derivar los `sql.Request`.
const { sql } = require("../db");
const logger = require("../logger");

async function conTransaccion(pool, fn) {
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const resultado = await fn(transaction);
        await transaction.commit();
        return resultado;
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (errorRollback) {
            // Nunca se traga el error original: el rollback fallido se loguea
            // aparte y se relanza el error de negocio al handler central.
            logger.error(
                { err: errorRollback },
                "Fallo al revertir la transacción"
            );
        }
        throw error;
    }
}

module.exports = { conTransaccion };
