// Servicio de pedidos: DUEÑO de la transacción. Orquesta la creación multi-tabla
// (Pedidos + bucle DetallePedido + Bitacora) en una sola transacción, con la
// traducción de la FK 547 al mensaje EXACTO del contrato. Preserva los defaults
// del legacy (fecha = hoy, estado = "Pendiente") y los textos de Bitacora.
const { poolPromise } = require("../db");
const { conTransaccion } = require("../utils/transacciones");
const { ErrorConflicto, ErrorNoEncontrado } = require("../errors/AppError");
const { esViolacionFk } = require("../utils/erroresSql");
const pedidosRepo = require("../repositories/pedidos.repository");
const bitacoraRepo = require("../repositories/bitacora.repository");

async function listar() {
    const pool = await poolPromise;
    return pedidosRepo.listar(pool);
}

// GET /:id -> cabecera + detalles. 404 si el pedido no existe.
async function obtenerConDetalles(idPedido) {
    const pool = await poolPromise;
    const cabecera = await pedidosRepo.obtenerCabecera(pool, idPedido);

    if (!cabecera) {
        throw new ErrorNoEncontrado("Pedido no encontrado");
    }

    const detalles = await pedidosRepo.listarDetalles(pool, idPedido);
    return { ...cabecera, detalles };
}

// POST / -> crea el pedido, inserta cada detalle (bucle igual que el legacy) y
// audita, todo en una transacción. Devuelve el id del pedido.
async function crear(idUsuario, datos) {
    const fecha = datos.fecha || new Date();
    const estado = (datos.estado && datos.estado.trim()) || "Pendiente";
    const detalles = datos.detalles;

    const pool = await poolPromise;

    try {
        return await conTransaccion(pool, async (transaction) => {
            const idPedido = await pedidosRepo.insertarPedido(transaction, {
                idCliente: datos.id_cliente,
                idUsuario,
                fecha,
                estado
            });

            for (const detalle of detalles) {
                await pedidosRepo.insertarDetalle(
                    transaction,
                    idPedido,
                    detalle
                );
            }

            await bitacoraRepo.registrar(
                transaction,
                idUsuario,
                `Creó el pedido ID ${idPedido} con ${detalles.length} producto(s)`
            );

            return idPedido;
        });
    } catch (error) {
        if (esViolacionFk(error)) {
            throw new ErrorConflicto(
                "El cliente, usuario o producto indicado no existe"
            );
        }
        throw error;
    }
}

// PUT /:id -> actualiza datos generales + Bitacora. 404 si no existe.
async function actualizar(idUsuario, idPedido, datos) {
    const pool = await poolPromise;

    return conTransaccion(pool, async (transaction) => {
        const pedido = await pedidosRepo.actualizar(transaction, idPedido, {
            idCliente: datos.id_cliente,
            fecha: datos.fecha,
            estado: datos.estado
        });

        if (!pedido) {
            throw new ErrorNoEncontrado("Pedido no encontrado");
        }

        await bitacoraRepo.registrar(
            transaction,
            idUsuario,
            `Actualizó el pedido ID ${idPedido}`
        );

        return pedido;
    });
}

// PATCH /:id/estado -> cambia el estado de un pedido no cancelado + Bitacora.
async function cambiarEstado(idUsuario, idPedido, estado) {
    const pool = await poolPromise;

    return conTransaccion(pool, async (transaction) => {
        const pedido = await pedidosRepo.cambiarEstado(
            transaction,
            idPedido,
            estado
        );

        if (!pedido) {
            throw new ErrorNoEncontrado(
                "Pedido no encontrado o ya está cancelado"
            );
        }

        await bitacoraRepo.registrar(
            transaction,
            idUsuario,
            `Cambió el estado del pedido ID ${idPedido} a ${estado}`
        );

        return pedido;
    });
}

// PATCH /:id/cancelar -> cancela un pedido no cancelado + Bitacora.
async function cancelar(idUsuario, idPedido) {
    const pool = await poolPromise;

    return conTransaccion(pool, async (transaction) => {
        const pedido = await pedidosRepo.cancelar(transaction, idPedido);

        if (!pedido) {
            throw new ErrorNoEncontrado(
                "Pedido no encontrado o ya está cancelado"
            );
        }

        await bitacoraRepo.registrar(
            transaction,
            idUsuario,
            `Canceló el pedido ID ${idPedido}`
        );

        return pedido;
    });
}

module.exports = {
    listar,
    obtenerConDetalles,
    crear,
    actualizar,
    cambiarEstado,
    cancelar
};
