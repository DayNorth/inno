// Jerarquía de errores de dominio. Los services lanzan estos errores; el
// error handler central los mapea a status + { mensaje }. El "mensaje" ya
// está en español y es SEGURO para el cliente (nunca lleva SQL, stack ni
// detalles internos). El "codigo" es una etiqueta interna solo para logs.
class AppError extends Error {
    constructor(mensaje, status, codigo) {
        super(mensaje);
        this.name = this.constructor.name;
        this.status = status;
        this.codigo = codigo;
        this.esOperacional = true;
    }
}

class ErrorValidacion extends AppError {
    constructor(mensaje) {
        super(mensaje, 400, "VALIDACION");
    }
}

class ErrorNoAutorizado extends AppError {
    constructor(mensaje) {
        super(mensaje, 401, "NO_AUTORIZADO");
    }
}

class ErrorProhibido extends AppError {
    constructor(mensaje) {
        super(mensaje, 403, "PROHIBIDO");
    }
}

class ErrorNoEncontrado extends AppError {
    constructor(mensaje) {
        super(mensaje, 404, "NO_ENCONTRADO");
    }
}

class ErrorConflicto extends AppError {
    constructor(mensaje) {
        super(mensaje, 409, "CONFLICTO");
    }
}

module.exports = {
    AppError,
    ErrorValidacion,
    ErrorNoAutorizado,
    ErrorProhibido,
    ErrorNoEncontrado,
    ErrorConflicto
};
