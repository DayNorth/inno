// Repositorio de accesos a plataforma: SQL parametrizado, filas planas.
const { sql } = require("../db");
const { request } = require("../utils/ejecutor");

async function listar(pool) {
    const resultado = await pool.request().query(`
        SELECT
            a.id_acceso,
            a.id_usuario,
            u.nombre AS usuario,
            a.id_plataforma,
            p.nombre AS plataforma,
            a.rol_acceso,
            a.fecha_alta,
            a.fecha_ultima_revision,
            a.estado
        FROM AccesosPlataforma a
        INNER JOIN Usuarios u
            ON a.id_usuario = u.id_usuario
        INNER JOIN Plataformas p
            ON a.id_plataforma = p.id_plataforma
        ORDER BY a.id_acceso DESC
    `);
    return resultado.recordset;
}

async function insertar(ejecutor, { id_usuario, id_plataforma, rol_acceso, fecha_alta }) {
    const resultado = await request(ejecutor)
        .input("id_usuario", sql.Int, id_usuario)
        .input("id_plataforma", sql.Int, id_plataforma)
        .input("rol_acceso", sql.VarChar(100), rol_acceso)
        .input("fecha_alta", sql.Date, fecha_alta).query(`
            INSERT INTO AccesosPlataforma (
                id_usuario,
                id_plataforma,
                rol_acceso,
                fecha_alta,
                fecha_ultima_revision,
                estado
            )
            OUTPUT
                INSERTED.id_acceso,
                INSERTED.id_usuario,
                INSERTED.id_plataforma,
                INSERTED.rol_acceso,
                INSERTED.fecha_alta,
                INSERTED.estado
            VALUES (
                @id_usuario,
                @id_plataforma,
                @rol_acceso,
                @fecha_alta,
                @fecha_alta,
                'Vigente'
            )
        `);
    return resultado.recordset[0];
}

// Marca el acceso como revisado (cualquier acceso existente). Devuelve fila o null.
async function marcarRevisado(ejecutor, idAcceso) {
    const resultado = await request(ejecutor)
        .input("id_acceso", sql.Int, idAcceso).query(`
            UPDATE AccesosPlataforma
            SET
                fecha_ultima_revision = CAST(GETDATE() AS date),
                estado = 'Vigente'
            OUTPUT INSERTED.id_acceso
            WHERE id_acceso = @id_acceso
        `);
    return resultado.recordset[0] || null;
}

// Revoca el acceso si NO está ya revocado. Devuelve fila o null.
async function revocar(ejecutor, idAcceso) {
    const resultado = await request(ejecutor)
        .input("id_acceso", sql.Int, idAcceso).query(`
            UPDATE AccesosPlataforma
            SET estado = 'Revocado'
            OUTPUT INSERTED.id_acceso
            WHERE id_acceso = @id_acceso
              AND estado <> 'Revocado'
        `);
    return resultado.recordset[0] || null;
}

module.exports = { listar, insertar, marcarRevisado, revocar };
