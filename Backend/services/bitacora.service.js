// Servicio de bitácora: lectura del trail de auditoría (GET /api/bitacora).
// La escritura de Bitacora la hacen los demás services vía bitacora.repository.
const { poolPromise } = require("../db");
const bitacoraRepo = require("../repositories/bitacora.repository");

async function listar() {
    const pool = await poolPromise;
    return bitacoraRepo.listar(pool);
}

module.exports = { listar };
