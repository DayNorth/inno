// Servicio de dispositivos: DUEÑO de la transacción. Calcula estado_seguridad
// (Cumple si antivirus_activo Y tiene_ups; No cumple en otro caso), inserta y
// audita en Bitacora dentro de la misma transacción, y traduce las violaciones
// de código único (2627/2601) y de FK (547) a los mensajes EXACTOS del contrato.
const { poolPromise } = require("../db");
const { conTransaccion } = require("../utils/transacciones");
const { ErrorConflicto } = require("../errors/AppError");
const { esViolacionUnica, esViolacionFk } = require("../utils/erroresSql");
const dispositivosRepo = require("../repositories/dispositivos.repository");
const bitacoraRepo = require("../repositories/bitacora.repository");

async function listar() {
    const pool = await poolPromise;
    return dispositivosRepo.listar(pool);
}

async function crear(idUsuarioRegistra, datos) {
    const estadoSeguridad =
        datos.antivirus_activo && datos.tiene_ups ? "Cumple" : "No cumple";

    const pool = await poolPromise;

    try {
        return await conTransaccion(pool, async (transaction) => {
            const dispositivo = await dispositivosRepo.insertar(transaction, {
                ...datos,
                estado_seguridad: estadoSeguridad
            });

            await bitacoraRepo.registrar(
                transaction,
                idUsuarioRegistra,
                `Registró el dispositivo ID ${dispositivo.id_dispositivo}: ${dispositivo.codigo_equipo}`
            );

            return dispositivo;
        });
    } catch (error) {
        if (esViolacionUnica(error)) {
            throw new ErrorConflicto("Ya existe un dispositivo con ese código");
        }
        if (esViolacionFk(error)) {
            throw new ErrorConflicto("El usuario responsable indicado no existe");
        }
        throw error;
    }
}

module.exports = { listar, crear };
