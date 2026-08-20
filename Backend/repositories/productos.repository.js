// Repositorio de productos: SQL parametrizado, filas planas.
const { sql } = require("../db");
const { request } = require("../utils/ejecutor");

async function listarActivos(pool) {
    const resultado = await pool.request().query(`
        SELECT
            id_producto,
            nombre_producto,
            descripcion,
            estado,
            cantidad_disponible,
            estado_fitosanitario,
            ubicacion_invernadero
        FROM Productos
        WHERE estado = 'Activo'
        ORDER BY nombre_producto
    `);
    return resultado.recordset;
}

// Activos e inactivos (alimenta el filtro "ver inactivos" de la pantalla,
// igual que Clientes).
async function listarTodos(pool) {
    const resultado = await pool.request().query(`
        SELECT
            id_producto,
            nombre_producto,
            descripcion,
            estado,
            cantidad_disponible,
            estado_fitosanitario,
            ubicacion_invernadero
        FROM Productos
        ORDER BY nombre_producto
    `);
    return resultado.recordset;
}

async function obtenerPorId(pool, idProducto) {
    const resultado = await pool
        .request()
        .input("id_producto", sql.Int, idProducto).query(`
            SELECT
                id_producto,
                nombre_producto,
                descripcion,
                estado,
                cantidad_disponible,
                estado_fitosanitario,
                ubicacion_invernadero
            FROM Productos
            WHERE id_producto = @id_producto
        `);
    return resultado.recordset[0] || null;
}

async function insertar(
    ejecutor,
    {
        nombre_producto,
        descripcion,
        cantidad_disponible,
        estado_fitosanitario,
        ubicacion_invernadero
    }
) {
    const resultado = await request(ejecutor)
        .input("nombre_producto", sql.VarChar(150), nombre_producto)
        .input("descripcion", sql.VarChar(255), descripcion)
        .input("cantidad_disponible", sql.Int, cantidad_disponible)
        .input("estado_fitosanitario", sql.VarChar(30), estado_fitosanitario)
        .input(
            "ubicacion_invernadero",
            sql.VarChar(100),
            ubicacion_invernadero
        ).query(`
            INSERT INTO Productos (
                nombre_producto,
                descripcion,
                cantidad_disponible,
                estado_fitosanitario,
                ubicacion_invernadero
            )
            OUTPUT
                INSERTED.id_producto,
                INSERTED.nombre_producto,
                INSERTED.descripcion,
                INSERTED.estado,
                INSERTED.cantidad_disponible,
                INSERTED.estado_fitosanitario,
                INSERTED.ubicacion_invernadero
            VALUES (
                @nombre_producto,
                @descripcion,
                @cantidad_disponible,
                @estado_fitosanitario,
                @ubicacion_invernadero
            )
        `);
    return resultado.recordset[0];
}

// Actualiza un producto existente (RF-10). Devuelve la fila o null si no
// existe. No permite tocar `estado` (activar/inactivar tiene su propio
// endpoint, igual que Clientes).
async function actualizar(
    ejecutor,
    idProducto,
    {
        nombre_producto,
        descripcion,
        cantidad_disponible,
        estado_fitosanitario,
        ubicacion_invernadero
    }
) {
    const resultado = await request(ejecutor)
        .input("id_producto", sql.Int, idProducto)
        .input("nombre_producto", sql.VarChar(150), nombre_producto)
        .input("descripcion", sql.VarChar(255), descripcion)
        .input("cantidad_disponible", sql.Int, cantidad_disponible)
        .input("estado_fitosanitario", sql.VarChar(30), estado_fitosanitario)
        .input(
            "ubicacion_invernadero",
            sql.VarChar(100),
            ubicacion_invernadero
        ).query(`
            UPDATE Productos
            SET
                nombre_producto = @nombre_producto,
                descripcion = @descripcion,
                cantidad_disponible = @cantidad_disponible,
                estado_fitosanitario = @estado_fitosanitario,
                ubicacion_invernadero = @ubicacion_invernadero
            OUTPUT
                INSERTED.id_producto,
                INSERTED.nombre_producto,
                INSERTED.descripcion,
                INSERTED.estado,
                INSERTED.cantidad_disponible,
                INSERTED.estado_fitosanitario,
                INSERTED.ubicacion_invernadero
            WHERE id_producto = @id_producto
        `);
    return resultado.recordset[0] || null;
}

// Activa/inactiva un producto (baja lógica, igual que Clientes). Devuelve la
// fila o null si no existe o no estaba en estadoOrigen.
async function cambiarEstado(ejecutor, idProducto, estadoDestino, estadoOrigen) {
    const resultado = await request(ejecutor)
        .input("id_producto", sql.Int, idProducto)
        .input("estado_destino", sql.VarChar(20), estadoDestino)
        .input("estado_origen", sql.VarChar(20), estadoOrigen).query(`
            UPDATE Productos
            SET estado = @estado_destino
            OUTPUT INSERTED.id_producto, INSERTED.nombre_producto, INSERTED.estado
            WHERE id_producto = @id_producto
              AND estado = @estado_origen
        `);
    return resultado.recordset[0] || null;
}

module.exports = {
    listarActivos,
    listarTodos,
    obtenerPorId,
    insertar,
    actualizar,
    cambiarEstado
};
