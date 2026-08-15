// Deriva un sql.Request desde un "ejecutor": o el pool (para lecturas
// sueltas) o una transacción (para escrituras coordinadas). Centraliza la
// distinción para que los repositorios no la repitan.
//   - pool.request()  -> Request sobre el pool
//   - new sql.Request(transaction) -> Request ligado a la transacción
const { sql } = require("../db");

function request(ejecutor) {
    // Un pool expone .request(); una transacción no.
    return typeof ejecutor.request === "function"
        ? ejecutor.request()
        : new sql.Request(ejecutor);
}

module.exports = { request };
