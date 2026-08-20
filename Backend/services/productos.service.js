// Servicio de productos. La creación NO usa transacción ni escribe Bitacora
// (se preserva EXACTAMENTE el comportamiento del router legacy). Traduce la
// violación de nombre único (2627/2601) a un ErrorConflicto (409) con el
// mensaje exacto del contrato. Actualizar/activar/inactivar sí auditan en
// Bitacora (mismo criterio que Clientes).
const { poolPromise } = require("../db");
const { conTransaccion } = require("../utils/transacciones");
const { ErrorConflicto, ErrorNoEncontrado } = require("../errors/AppError");
const { esViolacionUnica } = require("../utils/erroresSql");
const productosRepo = require("../repositories/productos.repository");
const bitacoraRepo = require("../repositories/bitacora.repository");

async function listarActivos() {
    const pool = await poolPromise;
    return productosRepo.listarActivos(pool);
}

async function listarTodos() {
    const pool = await poolPromise;
    return productosRepo.listarTodos(pool);
}

async function obtenerPorId(idProducto) {
    const pool = await poolPromise;
    const producto = await productosRepo.obtenerPorId(pool, idProducto);

    if (!producto) {
        throw new ErrorNoEncontrado("Producto no encontrado");
    }

    return producto;
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

// PUT /:id -> actualiza nombre/descripción/inventario y audita. 404 si no
// existe. Traduce la violación de nombre único igual que crear.
async function actualizar(idUsuario, idProducto, datos) {
    const pool = await poolPromise;

    try {
        return await conTransaccion(pool, async (transaction) => {
            const producto = await productosRepo.actualizar(
                transaction,
                idProducto,
                datos
            );

            if (!producto) {
                throw new ErrorNoEncontrado("Producto no encontrado");
            }

            await bitacoraRepo.registrar(
                transaction,
                idUsuario,
                `Actualizó el producto ID ${idProducto}: ${producto.nombre_producto}`
            );

            return producto;
        });
    } catch (error) {
        if (esViolacionUnica(error)) {
            throw new ErrorConflicto("Ya existe un producto con ese nombre");
        }
        throw error;
    }
}

// PATCH /:id/inactivar -> baja lógica (Activo -> Inactivo). 404 si no existe
// o ya estaba inactivo.
async function inactivar(idUsuario, idProducto) {
    const pool = await poolPromise;

    return conTransaccion(pool, async (transaction) => {
        const producto = await productosRepo.cambiarEstado(
            transaction,
            idProducto,
            "Inactivo",
            "Activo"
        );

        if (!producto) {
            throw new ErrorNoEncontrado(
                "Producto no encontrado o ya está inactivo"
            );
        }

        await bitacoraRepo.registrar(
            transaction,
            idUsuario,
            `Inactivó el producto ID ${idProducto}: ${producto.nombre_producto}`
        );

        return producto;
    });
}

// PATCH /:id/reactivar -> alta lógica (Inactivo -> Activo). 404 si no existe
// o ya estaba activo.
async function reactivar(idUsuario, idProducto) {
    const pool = await poolPromise;

    return conTransaccion(pool, async (transaction) => {
        const producto = await productosRepo.cambiarEstado(
            transaction,
            idProducto,
            "Activo",
            "Inactivo"
        );

        if (!producto) {
            throw new ErrorNoEncontrado(
                "Producto no encontrado o ya está activo"
            );
        }

        await bitacoraRepo.registrar(
            transaction,
            idUsuario,
            `Reactivó el producto ID ${idProducto}: ${producto.nombre_producto}`
        );

        return producto;
    });
}

module.exports = {
    listarActivos,
    listarTodos,
    obtenerPorId,
    crear,
    actualizar,
    inactivar,
    reactivar
};
