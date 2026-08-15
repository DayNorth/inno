// Repositorio de dispositivos: SQL parametrizado, filas planas.
const { sql } = require("../db");
const { request } = require("../utils/ejecutor");

async function listar(pool) {
    const resultado = await pool.request().query(`
        SELECT
            d.id_dispositivo,
            d.id_usuario,
            u.nombre AS responsable,
            d.codigo_equipo,
            d.tipo_dispositivo,
            d.sistema_operativo,
            d.antivirus_activo,
            d.fecha_ultima_actualizacion,
            d.tiene_ups,
            d.estado_seguridad
        FROM Dispositivos d
        INNER JOIN Usuarios u
            ON d.id_usuario = u.id_usuario
        ORDER BY d.id_dispositivo DESC
    `);
    return resultado.recordset;
}

async function insertar(ejecutor, datos) {
    const {
        id_usuario,
        codigo_equipo,
        tipo_dispositivo,
        sistema_operativo,
        antivirus_activo,
        fecha_ultima_actualizacion,
        tiene_ups,
        estado_seguridad
    } = datos;

    const resultado = await request(ejecutor)
        .input("id_usuario", sql.Int, id_usuario)
        .input("codigo_equipo", sql.VarChar(30), codigo_equipo)
        .input("tipo_dispositivo", sql.VarChar(50), tipo_dispositivo)
        .input("sistema_operativo", sql.VarChar(100), sistema_operativo)
        .input("antivirus_activo", sql.Bit, antivirus_activo)
        .input(
            "fecha_ultima_actualizacion",
            sql.Date,
            fecha_ultima_actualizacion
        )
        .input("tiene_ups", sql.Bit, tiene_ups)
        .input("estado_seguridad", sql.VarChar(20), estado_seguridad).query(`
            INSERT INTO Dispositivos (
                id_usuario,
                codigo_equipo,
                tipo_dispositivo,
                sistema_operativo,
                antivirus_activo,
                fecha_ultima_actualizacion,
                tiene_ups,
                estado_seguridad
            )
            OUTPUT
                INSERTED.id_dispositivo,
                INSERTED.codigo_equipo,
                INSERTED.estado_seguridad
            VALUES (
                @id_usuario,
                @codigo_equipo,
                @tipo_dispositivo,
                @sistema_operativo,
                @antivirus_activo,
                @fecha_ultima_actualizacion,
                @tiene_ups,
                @estado_seguridad
            )
        `);
    return resultado.recordset[0];
}

module.exports = { listar, insertar };
