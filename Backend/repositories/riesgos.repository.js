// Repositorio de riesgos: SQL parametrizado, filas planas.
const { sql } = require("../db");
const { request } = require("../utils/ejecutor");

async function listar(pool) {
    const resultado = await pool.request().query(`
        SELECT
            id_riesgo,
            sistema,
            categoria,
            descripcion,
            probabilidad,
            impacto,
            control_mitigante,
            fecha_registro
        FROM Riesgos
        ORDER BY (probabilidad * impacto) DESC, id_riesgo DESC
    `);
    return resultado.recordset;
}

async function insertar(ejecutor, datos) {
    const {
        sistema,
        categoria,
        descripcion,
        probabilidad,
        impacto,
        control_mitigante
    } = datos;

    const resultado = await request(ejecutor)
        .input("sistema", sql.VarChar(50), sistema)
        .input("categoria", sql.VarChar(30), categoria)
        .input("descripcion", sql.VarChar(255), descripcion)
        .input("probabilidad", sql.Int, probabilidad)
        .input("impacto", sql.Int, impacto)
        .input("control_mitigante", sql.VarChar(255), control_mitigante).query(`
            INSERT INTO Riesgos (
                sistema,
                categoria,
                descripcion,
                probabilidad,
                impacto,
                control_mitigante
            )
            OUTPUT
                INSERTED.id_riesgo,
                INSERTED.sistema,
                INSERTED.descripcion
            VALUES (
                @sistema,
                @categoria,
                @descripcion,
                @probabilidad,
                @impacto,
                @control_mitigante
            )
        `);
    return resultado.recordset[0];
}

module.exports = { listar, insertar };
