// Repositorio de permisos y su asignación a roles: SQL parametrizado, filas
// planas. RolPermiso es la tabla puente entre Roles y Permisos (catálogo
// consultable de la misma matriz que ya aplican los requerirRol(...) de las
// rutas).
const { sql } = require("../db");
const { request } = require("../utils/ejecutor");

// Catálogo completo de permisos.
async function listarPermisos(pool) {
    const resultado = await pool.request().query(`
        SELECT id_permiso, nombre_permiso, descripcion
        FROM Permisos
        ORDER BY nombre_permiso
    `);
    return resultado.recordset;
}

// Roles con sus permisos asignados, para que el front pueda pintar la matriz
// completa en una sola consulta en vez de una por rol.
async function listarMatrizRolPermiso(pool) {
    const resultado = await pool.request().query(`
        SELECT
            r.id_rol,
            r.nombre AS rol,
            p.id_permiso,
            p.nombre_permiso,
            p.descripcion
        FROM Roles r
        INNER JOIN RolPermiso rp
            ON rp.id_rol = r.id_rol
        INNER JOIN Permisos p
            ON p.id_permiso = rp.id_permiso
        ORDER BY r.id_rol, p.nombre_permiso
    `);
    return resultado.recordset;
}

// Permisos asignados a un rol puntual.
async function listarPermisosDeRol(pool, idRol) {
    const resultado = await pool
        .request()
        .input("id_rol", sql.Int, idRol).query(`
            SELECT p.id_permiso, p.nombre_permiso, p.descripcion
            FROM RolPermiso rp
            INNER JOIN Permisos p
                ON p.id_permiso = rp.id_permiso
            WHERE rp.id_rol = @id_rol
            ORDER BY p.nombre_permiso
        `);
    return resultado.recordset;
}

// Asigna un permiso a un rol. Devuelve la fila insertada o null si ya existía
// (UNIQUE(id_rol, id_permiso)); el service traduce ese caso a 409.
async function asignar(ejecutor, { idRol, idPermiso }) {
    const resultado = await request(ejecutor)
        .input("id_rol", sql.Int, idRol)
        .input("id_permiso", sql.Int, idPermiso).query(`
            INSERT INTO RolPermiso (id_rol, id_permiso)
            OUTPUT INSERTED.id_rol_permiso, INSERTED.id_rol, INSERTED.id_permiso
            VALUES (@id_rol, @id_permiso)
        `);
    return resultado.recordset[0];
}

// Revoca un permiso de un rol. Devuelve el número de filas afectadas (0 si no
// existía la asignación).
async function revocar(ejecutor, { idRol, idPermiso }) {
    const resultado = await request(ejecutor)
        .input("id_rol", sql.Int, idRol)
        .input("id_permiso", sql.Int, idPermiso).query(`
            DELETE FROM RolPermiso
            OUTPUT DELETED.id_rol_permiso
            WHERE id_rol = @id_rol AND id_permiso = @id_permiso
        `);
    return resultado.recordset.length;
}

module.exports = {
    listarPermisos,
    listarMatrizRolPermiso,
    listarPermisosDeRol,
    asignar,
    revocar
};
