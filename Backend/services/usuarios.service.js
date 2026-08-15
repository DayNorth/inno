// Servicio de usuarios: lectura de usuarios activos (ADR-001: auth-para-todos).
const { poolPromise } = require("../db");
const usuariosRepo = require("../repositories/usuarios.repository");

async function listarActivos() {
    const pool = await poolPromise;
    return usuariosRepo.listarActivos(pool);
}

module.exports = { listarActivos };
