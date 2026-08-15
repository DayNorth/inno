// Repositorio de pedidos: SQL parametrizado, filas planas. Cada método acepta
// un ejecutor (pool para lecturas, transacción para escrituras coordinadas).
const { sql } = require("../db");
const { request } = require("../utils/ejecutor");

// Lista de pedidos con agregados (cantidad de productos y total).
async function listar(pool) {
    const resultado = await pool.request().query(`
        SELECT
            p.id_pedido,
            p.id_cliente,
            c.nombre AS cliente,
            p.id_usuario,
            u.nombre AS usuario,
            p.fecha,
            p.estado,
            COUNT(dp.id_detalle) AS cantidad_productos,
            COALESCE(SUM(dp.subtotal), 0) AS total
        FROM Pedidos p
        INNER JOIN Clientes c
            ON p.id_cliente = c.id_cliente
        INNER JOIN Usuarios u
            ON p.id_usuario = u.id_usuario
        LEFT JOIN DetallePedido dp
            ON p.id_pedido = dp.id_pedido
        GROUP BY
            p.id_pedido,
            p.id_cliente,
            c.nombre,
            p.id_usuario,
            u.nombre,
            p.fecha,
            p.estado
        ORDER BY p.id_pedido DESC
    `);
    return resultado.recordset;
}

// Cabecera del pedido (con total) por id. Devuelve fila o null.
async function obtenerCabecera(pool, idPedido) {
    const resultado = await pool
        .request()
        .input("id_pedido", sql.Int, idPedido).query(`
            SELECT
                p.id_pedido,
                p.id_cliente,
                c.nombre AS cliente,
                p.id_usuario,
                u.nombre AS usuario,
                p.fecha,
                p.estado,
                COALESCE(SUM(dp.subtotal), 0) AS total
            FROM Pedidos p
            INNER JOIN Clientes c
                ON p.id_cliente = c.id_cliente
            INNER JOIN Usuarios u
                ON p.id_usuario = u.id_usuario
            LEFT JOIN DetallePedido dp
                ON p.id_pedido = dp.id_pedido
            WHERE p.id_pedido = @id_pedido
            GROUP BY
                p.id_pedido,
                p.id_cliente,
                c.nombre,
                p.id_usuario,
                u.nombre,
                p.fecha,
                p.estado
        `);
    return resultado.recordset[0] || null;
}

// Detalles (líneas) de un pedido.
async function listarDetalles(pool, idPedido) {
    const resultado = await pool
        .request()
        .input("id_pedido", sql.Int, idPedido).query(`
            SELECT
                dp.id_detalle,
                dp.id_producto,
                pr.nombre_producto,
                dp.cantidad,
                dp.precio_unitario,
                dp.subtotal
            FROM DetallePedido dp
            INNER JOIN Productos pr
                ON dp.id_producto = pr.id_producto
            WHERE dp.id_pedido = @id_pedido
            ORDER BY dp.id_detalle
        `);
    return resultado.recordset;
}

// Inserta la cabecera del pedido y devuelve el id generado.
async function insertarPedido(ejecutor, { idCliente, idUsuario, fecha, estado }) {
    const resultado = await request(ejecutor)
        .input("id_cliente", sql.Int, idCliente)
        .input("id_usuario", sql.Int, idUsuario)
        .input("fecha", sql.Date, fecha)
        .input("estado", sql.VarChar(30), estado).query(`
            INSERT INTO Pedidos (id_cliente, id_usuario, fecha, estado)
            OUTPUT INSERTED.id_pedido
            VALUES (@id_cliente, @id_usuario, @fecha, @estado)
        `);
    return resultado.recordset[0].id_pedido;
}

// Inserta una línea de detalle del pedido.
async function insertarDetalle(ejecutor, idPedido, detalle) {
    await request(ejecutor)
        .input("id_pedido", sql.Int, idPedido)
        .input("id_producto", sql.Int, detalle.id_producto)
        .input("cantidad", sql.Int, detalle.cantidad)
        .input("precio_unitario", sql.Decimal(12, 2), detalle.precio_unitario)
        .query(`
            INSERT INTO DetallePedido (
                id_pedido,
                id_producto,
                cantidad,
                precio_unitario
            )
            VALUES (@id_pedido, @id_producto, @cantidad, @precio_unitario)
        `);
}

// Actualiza datos generales del pedido. Devuelve la fila o null (no existe).
async function actualizar(ejecutor, idPedido, { idCliente, fecha, estado }) {
    const resultado = await request(ejecutor)
        .input("id_pedido", sql.Int, idPedido)
        .input("id_cliente", sql.Int, idCliente)
        .input("fecha", sql.Date, fecha)
        .input("estado", sql.VarChar(30), estado).query(`
            UPDATE Pedidos
            SET id_cliente = @id_cliente, fecha = @fecha, estado = @estado
            OUTPUT
                INSERTED.id_pedido,
                INSERTED.id_cliente,
                INSERTED.id_usuario,
                INSERTED.fecha,
                INSERTED.estado
            WHERE id_pedido = @id_pedido
        `);
    return resultado.recordset[0] || null;
}

// Cambia el estado de un pedido no cancelado. Devuelve la fila o null.
async function cambiarEstado(ejecutor, idPedido, estado) {
    const resultado = await request(ejecutor)
        .input("id_pedido", sql.Int, idPedido)
        .input("estado", sql.VarChar(30), estado).query(`
            UPDATE Pedidos
            SET estado = @estado
            OUTPUT INSERTED.id_pedido, INSERTED.estado
            WHERE id_pedido = @id_pedido
              AND estado <> 'Cancelado'
        `);
    return resultado.recordset[0] || null;
}

// Cancela un pedido no cancelado. Devuelve la fila o null.
async function cancelar(ejecutor, idPedido) {
    const resultado = await request(ejecutor)
        .input("id_pedido", sql.Int, idPedido).query(`
            UPDATE Pedidos
            SET estado = 'Cancelado'
            OUTPUT INSERTED.id_pedido, INSERTED.estado
            WHERE id_pedido = @id_pedido
              AND estado <> 'Cancelado'
        `);
    return resultado.recordset[0] || null;
}

module.exports = {
    listar,
    obtenerCabecera,
    listarDetalles,
    insertarPedido,
    insertarDetalle,
    actualizar,
    cambiarEstado,
    cancelar
};
