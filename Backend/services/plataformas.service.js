// Servicio de plataformas: lectura para selects de accesos/dispositivos/incidentes.
const { poolPromise } = require("../db");
const plataformasRepo = require("../repositories/plataformas.repository");

async function listar() {
    const pool = await poolPromise;
    return plataformasRepo.listar(pool);
}

module.exports = { listar };
