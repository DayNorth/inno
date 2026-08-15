// Fija las variables de entorno mínimas ANTES de importar config/env.js, para
// que la validación fail-fast pase en los tests sin depender del .env real ni
// de un SQL Server. dotenv (usado por config/env) NO sobreescribe variables ya
// presentes en process.env, así que basta definirlas aquí primero.
//
// Los secretos son valores dummy de >=32 chars y DISTINTOS entre sí (F-10):
// el esquema zod rechaza secretos iguales o cortos.
function fijarEnvDePrueba() {
    process.env.NODE_ENV = process.env.NODE_ENV || "test";
    process.env.DB_SERVER = process.env.DB_SERVER || "localhost";
    process.env.DB_DATABASE = process.env.DB_DATABASE || "VINKAPLANT_DB_TEST";
    process.env.DB_USER = process.env.DB_USER || "test_user";
    process.env.DB_PASSWORD = process.env.DB_PASSWORD || "test_password";
    process.env.JWT_SECRET =
        process.env.JWT_SECRET || "test_access_secret_0123456789_abcdef";
    process.env.JWT_REFRESH_SECRET =
        process.env.JWT_REFRESH_SECRET ||
        "test_refresh_secret_0123456789_ghijkl";
    process.env.REFRESH_TOKEN_PEPPER =
        process.env.REFRESH_TOKEN_PEPPER ||
        "test_refresh_pepper_0123456789_mnopqr";
    process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
}

module.exports = { fijarEnvDePrueba };
