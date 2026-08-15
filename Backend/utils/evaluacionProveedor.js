// Cálculo puro de la evaluación de seguridad de un proveedor. Se extrae del
// router legacy para poder testearlo aislado (sin BD ni HTTP). Lógica EXACTA
// del legacy: cada criterio truthy suma PUNTOS_POR_CRITERIO; el resultado y el
// nivel de riesgo se derivan de umbrales fijos.
const PUNTOS_POR_CRITERIO = 25;

// Recibe los cuatro criterios (booleanos laxos: cualquier valor truthy cuenta)
// y devuelve { puntaje, resultado, nivelRiesgo }.
function calcularEvaluacion({
    cifrado_datos,
    mfa_disponible,
    sla_definido,
    certificaciones_vigentes
}) {
    const criterios = [
        cifrado_datos,
        mfa_disponible,
        sla_definido,
        certificaciones_vigentes
    ];

    const puntaje = criterios.reduce(
        (total, criterio) => total + (criterio ? PUNTOS_POR_CRITERIO : 0),
        0
    );

    const resultado = puntaje >= 70 ? "Aprobado" : "Rechazado";

    let nivelRiesgo = "Alto";

    if (puntaje >= 85) {
        nivelRiesgo = "Bajo";
    } else if (puntaje >= 60) {
        nivelRiesgo = "Medio";
    }

    return { puntaje, resultado, nivelRiesgo };
}

module.exports = { calcularEvaluacion, PUNTOS_POR_CRITERIO };
