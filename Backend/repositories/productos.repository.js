// Repositorio de productos: SQL parametrizado, filas planas.
const { sql } = require("../db");
const { request } = require("../utils/ejecutor");

async function listarActivos(pool) {
    const resultado = await pool.request().query(`
        SELECT
            id_producto,
            nombre_producto,
            descripcion,
            estado
        FROM Productos
        WHERE estado = 'Activo'
        ORDER BY nombre_producto
    `);
    return resultado.recordset;
}

async function insertar(ejecutor, { nombre_producto, descripcion }) {
    const resultado = await request(ejecutor)
        .input("nombre_producto", sql.VarChar(150), nombre_producto)
        .input("descripcion", sql.VarChar(255), descripcion).query(`
            INSERT INTO Productos (nombre_producto, descripcion)
            OUTPUT
                INSERTED.id_producto,
                INSERTED.nombre_producto,
                INSERTED.descripcion,
                INSERTED.estado
            VALUES (@nombre_producto, @descripcion)
        `);
    return resultado.recordset[0];
}

module.exports = { listarActivos, insertar };
