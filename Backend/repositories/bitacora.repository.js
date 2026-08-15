// Repositorio de auditoría de negocio (Bitacora). Centraliza el
// INSERT INTO Bitacora que antes estaba copiado ~20 veces (DRY), sin cambiar
// el comportamiento: mismos textos de `accion`, misma escritura transaccional.
//
// Patrón "ejecutor inyectado": el método recibe un ejecutor (pool para lecturas
// sueltas, o una transacción para escrituras coordinadas dentro de la
// transacción del service). La distinción pool/transacción se centraliza en
// utils/ejecutor.js (`request`), que crea un Request nuevo por llamada -mssql
// no permite reutilizar un Request con .input() acumulados entre queries-.
const { sql } = require("../db");
const { request } = require("../utils/ejecutor");

// Inserta un registro de auditoría. `ejecutor` es un pool o una transacción.
async function registrar(ejecutor, idUsuario, accion) {
    await request(ejecutor)
        .input("id_usuario", sql.Int, idUsuario)
        .input("accion", sql.VarChar(255), accion).query(`
            INSERT INTO Bitacora (id_usuario, accion)
            VALUES (@id_usuario, @accion)
        `);
}

// Lista todos los registros de bitácora (para GET /api/bitacora).
async function listar(pool) {
    const resultado = await pool.request().query(`
        SELECT
            b.id_bitacora,
            b.id_usuario,
            u.nombre AS usuario,
            b.accion,
            b.fecha
        FROM Bitacora b
        INNER JOIN Usuarios u
            ON b.id_usuario = u.id_usuario
        ORDER BY b.fecha DESC, b.id_bitacora DESC
    `);

    return resultado.recordset;
}

module.exports = { registrar, listar };
