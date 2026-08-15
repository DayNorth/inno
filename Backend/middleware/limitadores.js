// Limitadores de tasa (express-rate-limit). Todos viven aquí para que las
// ventanas y los topes se lean juntos y no queden repartidos por app.js.
//
// El diseño es por CAPAS, no una lista de rutas: el limitador general se monta
// antes de cualquier ruta, así que cubre todos los endpoints — incluidos los que
// se agreguen mañana y los 404. Encima de esa base, los endpoints caros o
// sensibles suman un límite propio y más estrecho. Una petición a /api/auth/login
// consume el general Y el de login; manda el primero que se agote.
//
// Advertencia operativa: sin `app.set("trust proxy", ...)`, req.ip es la IP del
// socket. Detrás de un reverse proxy TODAS las peticiones compartirían la IP del
// proxy y un solo cliente agotaría el cupo de los demás. Pero poner
// trust proxy = true a ciegas es peor: X-Forwarded-For es un header que el
// cliente escribe, y confiar en él permite saltarse el límite cambiándolo en
// cada petición. Al desplegar detrás de proxy hay que fijar el número EXACTO de
// saltos de confianza (p. ej. app.set("trust proxy", 1)).
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const config = require("../config/env");
const logger = require("../logger");

// Ventana común a todos los limitadores.
const VENTANA_MS = 15 * 60 * 1000;

// Clave del cupo. Si la petición ya pasó por verificarToken, se cuenta por
// USUARIO: dos personas tras el mismo NAT no se quitan el cupo entre ellas, y
// una cuenta abusiva no multiplica su cupo saltando de IP. Sin token, por IP.
//
// La IP pasa por ipKeyGenerator y no cruda: en IPv6 un atacante suele tener un
// /64 entero: contar por dirección exacta haría el límite decorativo. El helper
// agrupa por subred /56.
function claveUsuarioOIp(req) {
    if (req.usuario && req.usuario.id_usuario) {
        return `usuario:${req.usuario.id_usuario}`;
    }
    return `ip:${ipKeyGenerator(req.ip)}`;
}

// Fábrica común: mismo sobre { mensaje } que el resto de la API y un warn por
// cada bloqueo. El log importa tanto como el bloqueo — una ráfaga de 429 del
// mismo origen es la señal de que alguien está probando algo.
function crearLimitador({ nombre, max, mensaje, porUsuario = false }) {
    return rateLimit({
        windowMs: VENTANA_MS,
        limit: max,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: porUsuario
            ? claveUsuarioOIp
            : (req) => ipKeyGenerator(req.ip),
        handler(req, res) {
            const log = req.log || logger;
            log.warn(
                { codigo: "RATE_LIMIT", limitador: nombre, ruta: req.originalUrl },
                "Límite de peticiones excedido"
            );
            res.status(429).json({ mensaje });
        }
    });
}

// Base que cubre TODOS los endpoints. Tope alto a propósito: no debe estorbar
// el uso normal del SPA (que dispara varias peticiones por pantalla), solo
// cortar la automatización.
const limitadorGeneral = crearLimitador({
    nombre: "general",
    max: config.RATE_LIMIT_GENERAL_MAX,
    mensaje: "Demasiadas peticiones. Intenta de nuevo más tarde."
});

// Fuerza bruta de credenciales. Mensaje y tope originales del legacy.
const limitadorLogin = crearLimitador({
    nombre: "login",
    max: 10,
    mensaje:
        "Demasiados intentos de inicio de sesión. Intenta de nuevo más tarde."
});

// /refresh y /logout: emiten y rotan credenciales. En operación normal el
// refresh silencioso dispara pocas veces.
const limitadorAuth = crearLimitador({
    nombre: "auth",
    max: 30,
    mensaje:
        "Demasiadas solicitudes de autenticación. Intenta de nuevo más tarde."
});

// Subida de documentos: escribe en disco y lee el binario para verificar la
// firma. Es el endpoint más caro de la API, así que va aparte y por usuario
// (se monta después de verificarToken).
const limitadorSubida = crearLimitador({
    nombre: "subida",
    max: config.RATE_LIMIT_SUBIDA_MAX,
    mensaje: "Demasiadas subidas de archivos. Intenta de nuevo más tarde.",
    porUsuario: true
});

module.exports = {
    VENTANA_MS,
    crearLimitador,
    claveUsuarioOIp,
    limitadorGeneral,
    limitadorLogin,
    limitadorAuth,
    limitadorSubida
};
