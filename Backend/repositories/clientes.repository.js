// Repositorio de clientes: acceso a datos con SQL parametrizado (.input()).
// Acepta un ejecutor (pool para lecturas, transacción para escrituras).
// Devuelve filas planas; NO decide status HTTP ni contiene reglas de negocio.
const { sql } = require("../db");
const { request } = require("../utils/ejecutor");

async function listarActivos(pool) {
    const resultado = await pool.request().query(`
        SELECT id_cliente, nombre, pais, correo, telefono, estado
        FROM Clientes
        WHERE estado = 'Activo'
        ORDER BY id_cliente DESC
    `);
    return resultado.recordset;
}

async function listarTodos(pool) {
    const resultado = await pool.request().query(`
        SELECT id_cliente, nombre, pais, correo, telefono, estado
        FROM Clientes
        ORDER BY id_cliente DESC
    `);
    return resultado.recordset;
}

async function obtenerPorId(pool, idCliente) {
    const resultado = await pool
        .request()
        .input("id_cliente", sql.Int, idCliente).query(`
            SELECT id_cliente, nombre, pais, correo, telefono, estado
            FROM Clientes
            WHERE id_cliente = @id_cliente
        `);
    return resultado.recordset[0] || null;
}

async function insertar(ejecutor, { nombre, pais, correo, telefono }) {
    const resultado = await request(ejecutor)
        .input("nombre", sql.VarChar(150), nombre)
        .input("pais", sql.VarChar(100), pais)
        .input("correo", sql.VarChar(100), correo)
        .input("telefono", sql.VarChar(30), telefono).query(`
            INSERT INTO Clientes (nombre, pais, correo, telefono, estado)
            OUTPUT
                INSERTED.id_cliente,
                INSERTED.nombre,
                INSERTED.pais,
                INSERTED.correo,
                INSERTED.telefono,
                INSERTED.estado
            VALUES (@nombre, @pais, @correo, @telefono, 'Activo')
        `);
    return resultado.recordset[0];
}

async function actualizar(
    ejecutor,
    idCliente,
    { nombre, pais, correo, telefono }
) {
    const resultado = await request(ejecutor)
        .input("id_cliente", sql.Int, idCliente)
        .input("nombre", sql.VarChar(150), nombre)
        .input("pais", sql.VarChar(100), pais)
        .input("correo", sql.VarChar(100), correo)
        .input("telefono", sql.VarChar(30), telefono).query(`
            UPDATE Clientes
            SET nombre = @nombre, pais = @pais, correo = @correo,
                telefono = @telefono
            OUTPUT
                INSERTED.id_cliente,
                INSERTED.nombre,
                INSERTED.pais,
                INSERTED.correo,
                INSERTED.telefono,
                INSERTED.estado
            WHERE id_cliente = @id_cliente
        `);
    return resultado.recordset[0] || null;
}

async function cambiarEstado(ejecutor, idCliente, estadoDestino, estadoOrigen) {
    const resultado = await request(ejecutor)
        .input("id_cliente", sql.Int, idCliente)
        .input("estado_destino", sql.VarChar(20), estadoDestino)
        .input("estado_origen", sql.VarChar(20), estadoOrigen).query(`
            UPDATE Clientes
            SET estado = @estado_destino
            OUTPUT INSERTED.id_cliente, INSERTED.nombre, INSERTED.estado
            WHERE id_cliente = @id_cliente
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
