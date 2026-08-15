// Repositorio de documentos: SQL parametrizado, filas planas.
//
// Columnas (VINKAPLANT_DB_v2.sql): id_documento, id_pedido, id_tipo,
// id_plataforma, nombre_archivo, ruta_archivo, fecha_subida (default getdate()),
// id_usuario. FKs a Pedidos, TiposDocumento, Plataformas y Usuarios.
const { sql } = require("../db");
const { request } = require("../utils/ejecutor");

// Listado con los nombres resueltos por JOIN, como el resto de las pantallas.
// ruta_archivo NO sale: es detalle interno de almacenamiento y el cliente no lo
// necesita — descarga por /api/documentos/:id/descargar, no por ruta directa.
async function listar(pool) {
    const resultado = await pool.request().query(`
        SELECT
            d.id_documento,
            d.id_pedido,
            d.id_tipo,
            t.nombre AS tipo,
            d.id_plataforma,
            p.nombre AS plataforma,
            d.nombre_archivo,
            d.fecha_subida,
            d.id_usuario,
            u.nombre AS usuario
        FROM Documentos d
        INNER JOIN TiposDocumento t
            ON d.id_tipo = t.id_tipo
        INNER JOIN Plataformas p
            ON d.id_plataforma = p.id_plataforma
        INNER JOIN Usuarios u
            ON d.id_usuario = u.id_usuario
        ORDER BY d.id_documento DESC
    `);
    return resultado.recordset;
}

// Fila minima para servir la descarga: solo el nombre visible y la ruta en
// disco. Devuelve la fila o null.
async function obtenerParaDescarga(ejecutor, idDocumento) {
    const resultado = await request(ejecutor).input(
        "id_documento",
        sql.Int,
        idDocumento
    ).query(`
            SELECT
                id_documento,
                nombre_archivo,
                ruta_archivo
            FROM Documentos
            WHERE id_documento = @id_documento
        `);
    return resultado.recordset[0] || null;
}

async function insertar(
    ejecutor,
    {
        id_pedido,
        id_tipo,
        id_plataforma,
        nombre_archivo,
        ruta_archivo,
        id_usuario
    }
) {
    const resultado = await request(ejecutor)
        .input("id_pedido", sql.Int, id_pedido)
        .input("id_tipo", sql.Int, id_tipo)
        .input("id_plataforma", sql.Int, id_plataforma)
        .input("nombre_archivo", sql.VarChar(255), nombre_archivo)
        .input("ruta_archivo", sql.VarChar(255), ruta_archivo)
        .input("id_usuario", sql.Int, id_usuario).query(`
            INSERT INTO Documentos (
                id_pedido,
                id_tipo,
                id_plataforma,
                nombre_archivo,
                ruta_archivo,
                id_usuario
            )
            OUTPUT
                INSERTED.id_documento,
                INSERTED.id_pedido,
                INSERTED.id_tipo,
                INSERTED.id_plataforma,
                INSERTED.nombre_archivo,
                INSERTED.fecha_subida,
                INSERTED.id_usuario
            VALUES (
                @id_pedido,
                @id_tipo,
                @id_plataforma,
                @nombre_archivo,
                @ruta_archivo,
                @id_usuario
            )
        `);
    return resultado.recordset[0];
}

// Borra la fila y devuelve la ruta en disco del archivo que colgaba de ella
// (null si no existia). El service usa esa ruta para borrar el archivo DESPUES
// del commit: un unlink no se puede deshacer con un rollback.
async function eliminar(ejecutor, idDocumento) {
    const resultado = await request(ejecutor).input(
        "id_documento",
        sql.Int,
        idDocumento
    ).query(`
            DELETE FROM Documentos
            OUTPUT
                DELETED.id_documento,
                DELETED.nombre_archivo,
                DELETED.ruta_archivo
            WHERE id_documento = @id_documento
        `);
    return resultado.recordset[0] || null;
}

module.exports = { listar, obtenerParaDescarga, insertar, eliminar };
