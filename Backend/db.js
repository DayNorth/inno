// Pool mssql singleton. Lee la configuración validada de config/env.js
// (fail fast al arranque), no de process.env disperso.
const sql = require("mssql");
const config = require("./config/env");
const logger = require("./logger");

const sqlConfig = {
    server: config.DB_SERVER,
    port: config.DB_PORT,
    database: config.DB_DATABASE,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    options: {
        encrypt: true,
        // Solo aceptar certificados autofirmados si se pide explícitamente
        // (desarrollo local). En producción debe validarse el certificado.
        trustServerCertificate: config.DB_TRUST_SERVER_CERTIFICATE === "true"
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const poolPromise = new sql.ConnectionPool(sqlConfig)
    .connect()
    .then((pool) => {
        logger.info("Conectado a VINKAPLANT_DB");
        return pool;
    })
    .catch((error) => {
        logger.error({ err: error }, "Error de conexión con SQL Server");
        throw error;
    });

// Evita que el rechazo tumbe el proceso al arrancar sin BD disponible;
// cada ruta que haga await poolPromise recibirá el error y responderá 500.
poolPromise.catch(() => {});

module.exports = {
    sql,
    poolPromise
};
