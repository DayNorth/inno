// Servicio de productos. La creación NO usa transacción ni escribe Bitacora
// (se preserva EXACTAMENTE el comportamiento del router legacy). Traduce la
// violación de nombre único (2627/2601) a un ErrorConflicto (409) con el
// mensaje exacto del contrato.
const { poolPromise } = require("../db");
const { ErrorConflicto } = require("../errors/AppError");
const { esViolacionUnica } = require("../utils/erroresSql");
const productosRepo = require("../repositories/productos.repository");

async function listarActivos() {
    const pool = await poolPromise;
    return productosRepo.listarActivos(pool);
}

async function crear(datos) {
    const pool = await poolPromise;
    try {
        return await productosRepo.insertar(pool, datos);
    } catch (error) {
        if (esViolacionUnica(error)) {
            throw new ErrorConflicto("Ya existe un producto con ese nombre");
        }
        throw error;
    }
}

module.exports = { listarActivos, crear };
