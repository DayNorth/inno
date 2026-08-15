// Servicio de clientes: lógica de dominio y DUEÑO de la transacción. Orquesta
// los repositorios (clientes + bitacora), lanza errores de dominio tipados
// (AppError) que el error handler central mapea a HTTP, y preserva EXACTAMENTE
// el comportamiento del router legacy (mismos textos de Bitacora, mismos
// mensajes de error, misma escritura transaccional).
//
// No conoce req/res ni HTTP. La identidad (idUsuario) llega como argumento
// desde el controller, que la toma del token (req.usuario), nunca del body.
const { poolPromise } = require("../db");
const { conTransaccion } = require("../utils/transacciones");
const { ErrorNoEncontrado } = require("../errors/AppError");
const clientesRepo = require("../repositories/clientes.repository");
const bitacoraRepo = require("../repositories/bitacora.repository");

// GET /api/clientes -> clientes activos (array).
async function listarActivos() {
    const pool = await poolPromise;
    return clientesRepo.listarActivos(pool);
}

// GET /api/clientes/todos -> todos los clientes (array).
async function listarTodos() {
    const pool = await poolPromise;
    return clientesRepo.listarTodos(pool);
}

// GET /api/clientes/:id -> un cliente; 404 si no existe.
async function obtenerPorId(idCliente) {
    const pool = await poolPromise;
    const cliente = await clientesRepo.obtenerPorId(pool, idCliente);

    if (!cliente) {
        throw new ErrorNoEncontrado("Cliente no encontrado");
    }

    return cliente;
}

// POST /api/clientes -> crea el cliente y registra la acción en Bitacora,
// ambas dentro de la misma transacción. Devuelve el cliente creado.
async function crear(idUsuario, datos) {
    const pool = await poolPromise;

    return conTransaccion(pool, async (transaction) => {
        const cliente = await clientesRepo.insertar(transaction, datos);

        await bitacoraRepo.registrar(
            transaction,
            idUsuario,
            `Creó el cliente ID ${cliente.id_cliente}: ${cliente.nombre}`
        );

        return cliente;
    });
}

// PUT /api/clientes/:id -> actualiza y audita. 404 si no existe (rollback).
async function actualizar(idUsuario, idCliente, datos) {
    const pool = await poolPromise;

    return conTransaccion(pool, async (transaction) => {
        const cliente = await clientesRepo.actualizar(
            transaction,
            idCliente,
            datos
        );

        if (!cliente) {
            throw new ErrorNoEncontrado("Cliente no encontrado");
        }

        await bitacoraRepo.registrar(
            transaction,
            idUsuario,
            `Actualizó el cliente ID ${idCliente}: ${cliente.nombre}`
        );

        return cliente;
    });
}

// PATCH /api/clientes/:id/inactivar -> baja lógica (Activo -> Inactivo).
// 404 si no existe o ya estaba inactivo.
async function inactivar(idUsuario, idCliente) {
    const pool = await poolPromise;

    return conTransaccion(pool, async (transaction) => {
        const cliente = await clientesRepo.cambiarEstado(
            transaction,
            idCliente,
            "Inactivo",
            "Activo"
        );

        if (!cliente) {
            throw new ErrorNoEncontrado(
                "Cliente no encontrado o ya está inactivo"
            );
        }

        await bitacoraRepo.registrar(
            transaction,
            idUsuario,
            `Inactivó el cliente ID ${idCliente}: ${cliente.nombre}`
        );

        return cliente;
    });
}

// PATCH /api/clientes/:id/reactivar -> alta lógica (Inactivo -> Activo).
// 404 si no existe o ya estaba activo.
async function reactivar(idUsuario, idCliente) {
    const pool = await poolPromise;

    return conTransaccion(pool, async (transaction) => {
        const cliente = await clientesRepo.cambiarEstado(
            transaction,
            idCliente,
            "Activo",
            "Inactivo"
        );

        if (!cliente) {
            throw new ErrorNoEncontrado(
                "Cliente no encontrado o ya está activo"
            );
        }

        await bitacoraRepo.registrar(
            transaction,
            idUsuario,
            `Reactivó el cliente ID ${idCliente}: ${cliente.nombre}`
        );

        return cliente;
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
