// Helpers para reconocer errores de SQL Server que los services traducen a
// AppError con el mensaje EXACTO del contexto (el error handler central solo
// cubre el 547 genérico como fallback). Mantener la traducción en el service
// respeta el diseño: el contexto de negocio conoce el mensaje correcto.

// Violación de restricción UNIQUE (índice único o constraint): 2627 / 2601.
function esViolacionUnica(error) {
    return error && (error.number === 2627 || error.number === 2601);
}

// Violación de clave foránea (FK): 547.
function esViolacionFk(error) {
    return error && error.number === 547;
}

module.exports = { esViolacionUnica, esViolacionFk };
