// Repositorio de RefreshTokens: SQL parametrizado sobre la tabla del v3. Cada
// metodo acepta un ejecutor (pool para lecturas sueltas, transaccion para
// escrituras coordinadas). NUNCA recibe ni guarda el token en claro: solo el
// token_hash ya calculado por el service (utils/refreshToken).
//
// Columnas (VINKAPLANT_DB_v3.sql): id_refresh_token, token_hash, id_familia,
// id_usuario, fecha_emision (default UTC), fecha_expiracion, revocado,
// fecha_revocado, reemplazado_por, motivo_revocacion.
const { sql } = require("../db");
const { request } = require("../utils/ejecutor");

// Inserta una fila nueva de refresh token y devuelve su id generado.
async function insertar(
    ejecutor,
    { tokenHash, idFamilia, idUsuario, fechaExpiracion }
) {
    const resultado = await request(ejecutor)
        .input("token_hash", sql.Char(64), tokenHash)
        .input("id_familia", sql.UniqueIdentifier, idFamilia)
        .input("id_usuario", sql.Int, idUsuario)
        .input("fecha_expiracion", sql.DateTime2(3), fechaExpiracion).query(`
            INSERT INTO RefreshTokens (
                token_hash,
                id_familia,
                id_usuario,
                fecha_expiracion
            )
            OUTPUT INSERTED.id_refresh_token
            VALUES (
                @token_hash,
                @id_familia,
                @id_usuario,
                @fecha_expiracion
            )
        `);
    return resultado.recordset[0].id_refresh_token;
}

// Busca una fila por token_hash (lookup por el indice UNIQUE). Devuelve la fila
// con los campos necesarios para validar vigencia y detectar reuso, o null.
async function buscarPorHash(ejecutor, tokenHash) {
    const resultado = await request(ejecutor).input(
        "token_hash",
        sql.Char(64),
        tokenHash
    ).query(`
            SELECT
                id_refresh_token,
                id_familia,
                id_usuario,
                fecha_expiracion,
                revocado,
                reemplazado_por
            FROM RefreshTokens
            WHERE token_hash = @token_hash
        `);
    return resultado.recordset[0] || null;
}

// Rotacion ATOMICA (F-08): marca la fila vieja como rotada solo si sigue viva y
// sin reemplazo (WHERE revocado=0 AND reemplazado_por IS NULL). Devuelve el
// numero de filas afectadas (@@ROWCOUNT): 0 = otro request ya roto (carrera
// benigna), no reuso. motivo='rotado' NO revoca la familia (solo la fila).
async function rotar(ejecutor, { idRefreshToken, idReemplazo }) {
    const resultado = await request(ejecutor)
        .input("id", sql.Int, idRefreshToken)
        .input("reemplazo", sql.Int, idReemplazo).query(`
            UPDATE RefreshTokens
            SET revocado = 1,
                motivo_revocacion = 'rotado',
                reemplazado_por = @reemplazo,
                fecha_revocado = SYSUTCDATETIME()
            WHERE id_refresh_token = @id
              AND revocado = 0
              AND reemplazado_por IS NULL
        `);
    return resultado.rowsAffected[0];
}

// Revoca la FAMILIA COMPLETA (logout o reuso_detectado). Idempotente: solo toca
// las filas aun vivas (revocado=0); si la familia ya estaba revocada afecta 0
// filas. Devuelve el numero de filas afectadas. El motivo lo decide el service.
async function revocarFamilia(ejecutor, { idFamilia, motivo }) {
    const resultado = await request(ejecutor)
        .input("id_familia", sql.UniqueIdentifier, idFamilia)
        .input("motivo", sql.VarChar(30), motivo).query(`
            UPDATE RefreshTokens
            SET revocado = 1,
                motivo_revocacion = @motivo,
                fecha_revocado = SYSUTCDATETIME()
            WHERE id_familia = @id_familia
              AND revocado = 0
        `);
    return resultado.rowsAffected[0];
}

module.exports = {
    insertar,
    buscarPorHash,
    rotar,
    revocarFamilia
};
