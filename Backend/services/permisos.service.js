// Servicio de permisos: expone el catálogo y la matriz Rol->Permisos, y
// permite asignar/revocar (solo Administrador, aplicado en la ruta). Asignar
// y revocar auditan en Bitacora dentro de la misma transacción, igual que el
// resto de los módulos de escritura.
const { poolPromise } = require("../db");
const { conTransaccion } = require("../utils/transacciones");
const { ErrorConflicto, ErrorNoEncontrado } = require("../errors/AppError");
const { esViolacionUnica, esViolacionFk } = require("../utils/erroresSql");
const permisosRepo = require("../repositories/permisos.repository");
const bitacoraRepo = require("../repositories/bitacora.repository");

async function listarPermisos() {
    const pool = await poolPromise;
    return permisosRepo.listarPermisos(pool);
}

async function listarMatriz() {
    const pool = await poolPromise;
    return permisosRepo.listarMatrizRolPermiso(pool);
}

async function listarPermisosDeRol(idRol) {
    const pool = await poolPromise;
    return permisosRepo.listarPermisosDeRol(pool, idRol);
}

async function asignar(idUsuario, idRol, idPermiso) {
    const pool = await poolPromise;

    try {
        return await conTransaccion(pool, async (transaction) => {
            const fila = await permisosRepo.asignar(transaction, {
                idRol,
                idPermiso
            });

            await bitacoraRepo.registrar(
                transaction,
                idUsuario,
                `Asignó el permiso ID ${idPermiso} al rol ID ${idRol}`
            );

            return fila;
        });
    } catch (error) {
        if (esViolacionUnica(error)) {
            throw new ErrorConflicto("El rol ya tiene asignado ese permiso");
        }
        if (esViolacionFk(error)) {
            throw new ErrorConflicto("El rol o el permiso indicado no existe");
        }
        throw error;
    }
}

async function revocar(idUsuario, idRol, idPermiso) {
    const pool = await poolPromise;

    return conTransaccion(pool, async (transaction) => {
        const filasRevocadas = await permisosRepo.revocar(transaction, {
            idRol,
            idPermiso
        });

        if (filasRevocadas === 0) {
            throw new ErrorNoEncontrado(
                "El rol no tiene asignado ese permiso"
            );
        }

        await bitacoraRepo.registrar(
            transaction,
            idUsuario,
            `Revocó el permiso ID ${idPermiso} del rol ID ${idRol}`
        );
    });
}

module.exports = {
    listarPermisos,
    listarMatriz,
    listarPermisosDeRol,
    asignar,
    revocar
};
