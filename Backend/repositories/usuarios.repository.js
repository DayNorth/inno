// Repositorio de usuarios. SQL parametrizado; devuelve filas planas sin reglas
// de negocio. Incluye el select de responsables (solo lectura) y el lookup de
// login (por correo, con password hash y estado para el flujo de auth).
const { sql } = require("../db");
const { request } = require("../utils/ejecutor");

// Selects de responsables/duenos (usuarios activos) para los <select> del SPA.
async function listarActivos(pool) {
    const resultado = await pool.request().query(`
        SELECT
            u.id_usuario,
            u.nombre,
            u.correo,
            r.nombre AS rol,
            u.estado
        FROM Usuarios u
        INNER JOIN Roles r
            ON u.id_rol = r.id_rol
        WHERE u.estado = 'Activo'
        ORDER BY u.nombre
    `);
    return resultado.recordset;
}

// Lookup de login por correo. Devuelve la fila completa necesaria para
// autenticar (incluye password hash y estado) o null si no existe. La query es
// identica a la del login legacy (mismas columnas y JOIN a Roles).
async function buscarPorCorreoParaLogin(ejecutor, correo) {
    const resultado = await request(ejecutor).input(
        "correo",
        sql.VarChar(100),
        correo
    ).query(`
            SELECT
                u.id_usuario,
                u.nombre,
                u.correo,
                u.password,
                u.id_rol,
                u.estado,
                r.nombre AS rol
            FROM Usuarios u
            INNER JOIN Roles r
                ON u.id_rol = r.id_rol
            WHERE u.correo = @correo
        `);
    return resultado.recordset[0] || null;
}

// Lookup por id para RE-firmar el access token en el refresh. La fila de
// RefreshTokens solo tiene id_usuario, asi que el rol y el correo hay que
// leerlos de Usuarios+Roles (si no, las claims salen undefined y jwt.sign las
// descarta en silencio). Devuelve tambien estado para revalidar la vigencia de
// la cuenta en cada rotacion.
async function buscarPorIdParaToken(ejecutor, idUsuario) {
    const resultado = await request(ejecutor).input(
        "id_usuario",
        sql.Int,
        idUsuario
    ).query(`
            SELECT
                u.id_usuario,
                u.nombre,
                u.correo,
                u.id_rol,
                u.estado,
                r.nombre AS rol
            FROM Usuarios u
            INNER JOIN Roles r
                ON u.id_rol = r.id_rol
            WHERE u.id_usuario = @id_usuario
        `);
    return resultado.recordset[0] || null;
}

module.exports = {
    listarActivos,
    buscarPorCorreoParaLogin,
    buscarPorIdParaToken
};
