// Repositorio de plataformas (solo lectura para selects).
async function listar(pool) {
    const resultado = await pool.request().query(`
        SELECT
            id_plataforma,
            nombre
        FROM Plataformas
        ORDER BY nombre
    `);
    return resultado.recordset;
}

module.exports = { listar };
