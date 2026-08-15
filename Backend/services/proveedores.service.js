// Servicio de proveedores: DUEÑO de la transacción. Orquesta las escrituras
// multi-tabla (ProveedorTecnologico + EvaluacionSeguridad + Bitacora) en una
// sola transacción, traduce la FK 547 al mensaje EXACTO del contrato y preserva
// los textos de Bitacora del legacy carácter por carácter. No conoce req/res.
// La identidad (idUsuario) llega como argumento desde el controller (del token).
const { poolPromise } = require("../db");
const { conTransaccion } = require("../utils/transacciones");
const { ErrorNoEncontrado, ErrorConflicto } = require("../errors/AppError");
const { esViolacionFk } = require("../utils/erroresSql");
const { calcularEvaluacion } = require("../utils/evaluacionProveedor");
const proveedoresRepo = require("../repositories/proveedores.repository");
const bitacoraRepo = require("../repositories/bitacora.repository");

// GET / -> proveedores con su última evaluación (array).
async function listar() {
    const pool = await poolPromise;
    return proveedoresRepo.listar(pool);
}

// GET /:id -> cabecera + historial de evaluaciones + planes. 404 si no existe.
async function obtenerDetalle(idProveedor) {
    const pool = await poolPromise;
    const cabecera = await proveedoresRepo.obtenerCabecera(pool, idProveedor);

    if (!cabecera) {
        throw new ErrorNoEncontrado("Proveedor no encontrado");
    }

    const evaluaciones = await proveedoresRepo.listarEvaluaciones(
        pool,
        idProveedor
    );
    const planes = await proveedoresRepo.listarPlanes(pool, idProveedor);

    return {
        ...cabecera,
        evaluaciones,
        planes_contingencia: planes
    };
}

// POST / -> crea el proveedor + su evaluación de seguridad inicial + Bitacora,
// todo en una transacción. Devuelve el proveedor con los datos de la evaluación
// inicial embebidos (mismo sobre que el legacy).
async function crear(idUsuario, datos) {
    const criterios = {
        cifrado_datos: datos.cifrado_datos,
        mfa_disponible: datos.mfa_disponible,
        sla_definido: datos.sla_definido,
        certificaciones_vigentes: datos.certificaciones_vigentes
    };

    const { puntaje, resultado, nivelRiesgo } = calcularEvaluacion(criterios);

    const pool = await poolPromise;

    return conTransaccion(pool, async (transaction) => {
        const proveedor = await proveedoresRepo.insertarProveedor(transaction, {
            nombreProveedor: datos.nombre_proveedor,
            tipoServicio: datos.tipo_servicio
        });

        await proveedoresRepo.insertarEvaluacion(
            transaction,
            {
                idProveedor: proveedor.id_proveedor,
                criterios,
                puntaje,
                resultado,
                nivelRiesgo
            },
            false
        );

        await bitacoraRepo.registrar(
            transaction,
            idUsuario,
            `Evaluó al proveedor ID ${proveedor.id_proveedor}: ${proveedor.nombre_proveedor} (${resultado}, ${puntaje}/100)`
        );

        return {
            ...proveedor,
            puntaje_total: puntaje,
            resultado,
            nivel_riesgo: nivelRiesgo
        };
    });
}

// POST /:id/evaluaciones -> nueva evaluación para un proveedor existente +
// Bitacora. FK 547 (proveedor inexistente) -> 409 con el mensaje de contrato.
async function registrarEvaluacion(idUsuario, idProveedor, datos) {
    const criterios = {
        cifrado_datos: datos.cifrado_datos,
        mfa_disponible: datos.mfa_disponible,
        sla_definido: datos.sla_definido,
        certificaciones_vigentes: datos.certificaciones_vigentes
    };

    const { puntaje, resultado, nivelRiesgo } = calcularEvaluacion(criterios);

    const pool = await poolPromise;

    try {
        return await conTransaccion(pool, async (transaction) => {
            const evaluacion = await proveedoresRepo.insertarEvaluacion(
                transaction,
                {
                    idProveedor,
                    criterios,
                    puntaje,
                    resultado,
                    nivelRiesgo
                }
            );

            await bitacoraRepo.registrar(
                transaction,
                idUsuario,
                `Registró una nueva evaluación de seguridad para el proveedor ID ${idProveedor} (${evaluacion.resultado}, ${evaluacion.puntaje_total}/100)`
            );

            return evaluacion;
        });
    } catch (error) {
        if (esViolacionFk(error)) {
            throw new ErrorConflicto("El proveedor indicado no existe");
        }
        throw error;
    }
}

// POST /:id/planes-contingencia -> plan de contingencia + Bitacora. FK 547 ->
// 409 con el mensaje de contrato.
async function registrarPlan(idUsuario, idProveedor, datos) {
    const pool = await poolPromise;

    try {
        return await conTransaccion(pool, async (transaction) => {
            const plan = await proveedoresRepo.insertarPlan(transaction, {
                idProveedor,
                escenario: datos.escenario,
                procedimientoAlterno: datos.procedimiento_alterno,
                responsable: datos.responsable
            });

            await bitacoraRepo.registrar(
                transaction,
                idUsuario,
                `Registró el plan de contingencia ID ${plan.id_plan} para el proveedor ID ${idProveedor}`
            );

            return plan;
        });
    } catch (error) {
        if (esViolacionFk(error)) {
            throw new ErrorConflicto("El proveedor indicado no existe");
        }
        throw error;
    }
}

module.exports = {
    listar,
    obtenerDetalle,
    crear,
    registrarEvaluacion,
    registrarPlan
};
