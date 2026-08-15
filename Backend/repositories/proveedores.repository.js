// Repositorio de proveedores: SQL parametrizado, filas planas. Cada método
// acepta un ejecutor (pool para lecturas, transacción para escrituras
// coordinadas). Las queries replican EXACTAMENTE las del router legacy
// (columnas, orden, OUTER APPLY de la última evaluación, OUTPUT INSERTED).
const { sql } = require("../db");
const { request } = require("../utils/ejecutor");

// Lista de proveedores con su última evaluación (OUTER APPLY TOP 1).
async function listar(pool) {
    const resultado = await pool.request().query(`
        SELECT
            pt.id_proveedor,
            pt.nombre_proveedor,
            pt.tipo_servicio,
            pt.estado_contrato,
            ultima.id_evaluacion,
            ultima.fecha_evaluacion,
            ultima.puntaje_total,
            ultima.resultado,
            ultima.nivel_riesgo
        FROM ProveedorTecnologico pt
        OUTER APPLY (
            SELECT TOP 1
                es.id_evaluacion,
                es.fecha_evaluacion,
                es.puntaje_total,
                es.resultado,
                es.nivel_riesgo
            FROM EvaluacionSeguridad es
            WHERE es.id_proveedor = pt.id_proveedor
            ORDER BY es.fecha_evaluacion DESC, es.id_evaluacion DESC
        ) ultima
        ORDER BY pt.id_proveedor DESC
    `);
    return resultado.recordset;
}

// Cabecera de un proveedor por id. Devuelve la fila o null.
async function obtenerCabecera(pool, idProveedor) {
    const resultado = await pool
        .request()
        .input("id_proveedor", sql.Int, idProveedor).query(`
            SELECT
                id_proveedor,
                nombre_proveedor,
                tipo_servicio,
                estado_contrato
            FROM ProveedorTecnologico
            WHERE id_proveedor = @id_proveedor
        `);
    return resultado.recordset[0] || null;
}

// Historial de evaluaciones de un proveedor (más recientes primero).
async function listarEvaluaciones(pool, idProveedor) {
    const resultado = await pool
        .request()
        .input("id_proveedor", sql.Int, idProveedor).query(`
            SELECT
                id_evaluacion,
                fecha_evaluacion,
                cifrado_datos,
                mfa_disponible,
                sla_definido,
                certificaciones_vigentes,
                puntaje_total,
                resultado,
                nivel_riesgo
            FROM EvaluacionSeguridad
            WHERE id_proveedor = @id_proveedor
            ORDER BY fecha_evaluacion DESC, id_evaluacion DESC
        `);
    return resultado.recordset;
}

// Planes de contingencia de un proveedor.
async function listarPlanes(pool, idProveedor) {
    const resultado = await pool
        .request()
        .input("id_proveedor", sql.Int, idProveedor).query(`
            SELECT
                id_plan,
                escenario,
                procedimiento_alterno,
                responsable,
                fecha_actualizacion
            FROM PlanContingencia
            WHERE id_proveedor = @id_proveedor
            ORDER BY id_plan DESC
        `);
    return resultado.recordset;
}

// Inserta el proveedor y devuelve { id_proveedor, nombre_proveedor }.
async function insertarProveedor(ejecutor, { nombreProveedor, tipoServicio }) {
    const resultado = await request(ejecutor)
        .input("nombre_proveedor", sql.VarChar(150), nombreProveedor)
        .input("tipo_servicio", sql.VarChar(150), tipoServicio).query(`
            INSERT INTO ProveedorTecnologico (
                nombre_proveedor,
                tipo_servicio
            )
            OUTPUT
                INSERTED.id_proveedor,
                INSERTED.nombre_proveedor
            VALUES (
                @nombre_proveedor,
                @tipo_servicio
            )
        `);
    return resultado.recordset[0];
}

// Inserta una evaluación de seguridad. `conOutput` controla si devuelve la fila
// insertada (POST /:id/evaluaciones necesita el id; la evaluación inicial del
// alta del proveedor no lo devuelve, igual que el legacy).
async function insertarEvaluacion(
    ejecutor,
    { idProveedor, criterios, puntaje, resultado, nivelRiesgo },
    conOutput = true
) {
    const salida = conOutput
        ? `OUTPUT
                    INSERTED.id_evaluacion,
                    INSERTED.puntaje_total,
                    INSERTED.resultado,
                    INSERTED.nivel_riesgo`
        : "";

    const consulta = await request(ejecutor)
        .input("id_proveedor", sql.Int, idProveedor)
        .input("cifrado_datos", sql.Bit, criterios.cifrado_datos)
        .input("mfa_disponible", sql.Bit, criterios.mfa_disponible)
        .input("sla_definido", sql.Bit, criterios.sla_definido)
        .input(
            "certificaciones_vigentes",
            sql.Bit,
            criterios.certificaciones_vigentes
        )
        .input("puntaje_total", sql.Int, puntaje)
        .input("resultado", sql.VarChar(20), resultado)
        .input("nivel_riesgo", sql.VarChar(20), nivelRiesgo).query(`
            INSERT INTO EvaluacionSeguridad (
                id_proveedor,
                fecha_evaluacion,
                cifrado_datos,
                mfa_disponible,
                sla_definido,
                certificaciones_vigentes,
                puntaje_total,
                resultado,
                nivel_riesgo
            )
            ${salida}
            VALUES (
                @id_proveedor,
                CAST(GETDATE() AS date),
                @cifrado_datos,
                @mfa_disponible,
                @sla_definido,
                @certificaciones_vigentes,
                @puntaje_total,
                @resultado,
                @nivel_riesgo
            )
        `);

    return conOutput ? consulta.recordset[0] : null;
}

// Inserta un plan de contingencia y devuelve { id_plan, escenario }.
async function insertarPlan(
    ejecutor,
    { idProveedor, escenario, procedimientoAlterno, responsable }
) {
    const resultado = await request(ejecutor)
        .input("id_proveedor", sql.Int, idProveedor)
        .input("escenario", sql.VarChar(255), escenario)
        .input("procedimiento_alterno", sql.VarChar(500), procedimientoAlterno)
        .input("responsable", sql.VarChar(100), responsable).query(`
            INSERT INTO PlanContingencia (
                id_proveedor,
                escenario,
                procedimiento_alterno,
                responsable,
                fecha_actualizacion
            )
            OUTPUT
                INSERTED.id_plan,
                INSERTED.escenario
            VALUES (
                @id_proveedor,
                @escenario,
                @procedimiento_alterno,
                @responsable,
                CAST(GETDATE() AS date)
            )
        `);
    return resultado.recordset[0];
}

module.exports = {
    listar,
    obtenerCabecera,
    listarEvaluaciones,
    listarPlanes,
    insertarProveedor,
    insertarEvaluacion,
    insertarPlan
};
