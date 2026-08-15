// Middleware genérico de validación con zod, parametrizado por esquema y
// origen (body / params / query). Al validar:
//  - Si falla, lanza ErrorValidacion con UN mensaje en español (el del
//    primer issue). Nunca expone el array de issues crudo al cliente (F-05);
//    el detalle solo puede ir al log.
//  - Si pasa, reemplaza req[origen] con los datos ya normalizados
//    (trim/coerción), para que el controller trabaje con datos limpios.
const { ErrorValidacion } = require("../errors/AppError");

// Deriva un mensaje en español desde un issue de zod. Los esquemas ya
// definen sus `message` en español (vía .refine / mensajes por campo), así
// que el issue trae el texto correcto. Fallback neutro por si acaso.
function mensajeDesde(issue) {
    if (issue && typeof issue.message === "string" && issue.message.trim()) {
        return issue.message;
    }
    return "Los datos enviados no son válidos";
}

function validar(schema, origen = "body") {
    return (req, res, next) => {
        const resultado = schema.safeParse(req[origen]);

        if (!resultado.success) {
            const primerIssue = resultado.error.issues[0];
            return next(new ErrorValidacion(mensajeDesde(primerIssue)));
        }

        // params es de solo lectura en Express 5 (getter); se asignan los
        // campos normalizados sobre el objeto existente en vez de reemplazarlo.
        if (origen === "params" || origen === "query") {
            Object.assign(req[origen], resultado.data);
        } else {
            req[origen] = resultado.data;
        }

        next();
    };
}

module.exports = { validar, mensajeDesde };
