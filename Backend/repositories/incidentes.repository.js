// Repositorio de incidentes: SQL parametrizado, filas planas.
const { sql } = require("../db");
const { request } = require("../utils/ejecutor");

async function listar(pool) {
    const resultado = await pool.request().query(`
        SELECT
            i.id_incidente,
            i.id_plataforma,
            p.nombre AS plataforma,
            i.id_usuario_responsable,
            u.nombre AS responsable,
            i.titulo,
            i.fecha_inicio,
            i.fecha_resolucion,
            i.procedimiento_alterno,
            i.estado
        FROM Incidentes i
        INNER JOIN Plataformas p
            ON i.id_plataforma = p.id_plataforma
        INNER JOIN Usuarios u
            ON i.id_usuario_responsable = u.id_usuario
        ORDER BY i.fecha_inicio DESC
    `);
    return resultado.recordset;
}

async function insertar(ejecutor, datos) {
    const {
        id_plataforma,
        id_usuario_responsable,
        titulo,
        fecha_inicio,
        procedimiento_alterno
    } = datos;

    const resultado = await request(ejecutor)
        .input("id_plataforma", sql.Int, id_plataforma)
        .input("id_usuario_responsable", sql.Int, id_usuario_responsable)
        .input("titulo", sql.VarChar(150), titulo)
        .input("fecha_inicio", sql.DateTime, fecha_inicio)
        .input(
            "procedimiento_alterno",
            sql.VarChar(500),
            procedimiento_alterno
        ).query(`
            INSERT INTO Incidentes (
                id_plataforma,
                id_usuario_responsable,
                titulo,
                fecha_inicio,
                procedimiento_alterno
            )
            OUTPUT
                INSERTED.id_incidente,
                INSERTED.titulo
            VALUES (
                @id_plataforma,
                @id_usuario_responsable,
                @titulo,
                @fecha_inicio,
                @procedimiento_alterno
            )
        `);
    return resultado.recordset[0];
}

// Resuelve el incidente si NO está ya resuelto. Devuelve la fila o null.
async function resolver(ejecutor, idIncidente, fechaResolucion) {
    const resultado = await request(ejecutor)
        .input("id_incidente", sql.Int, idIncidente)
        .input("fecha_resolucion", sql.DateTime, fechaResolucion).query(`
            UPDATE Incidentes
            SET
                estado = 'Resuelto',
                fecha_resolucion = @fecha_resolucion
            OUTPUT INSERTED.id_incidente
            WHERE id_incidente = @id_incidente
              AND estado <> 'Resuelto'
        `);
    return resultado.recordset[0] || null;
}

module.exports = { listar, insertar, resolver };
