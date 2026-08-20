// Servicio de autenticacion: DUEnO de las transacciones de login/refresh/logout.
// Implementa las 4 decisiones cerradas del gate de seguridad:
//   - Access token corto (JWT_ACCESS_TTL) firmado con JWT_SECRET; el refresh es
//     OPACO (randomBytes) hasheado con HMAC+pepper en la tabla RefreshTokens.
//   - Rotacion ATOMICA con deteccion de reuso (revoca la familia).
//   - 401 NEUTRO sin distinguir no-existe/revocado/expirado.
//   - El refresh NUNCA sale en el body: el controller lo pone en cookie httpOnly.
// No conoce req/res ni cookies. Devuelve el refresh EN CLARO al controller, que
// es quien lo escribe en la cookie; nunca vuelve al cliente en JSON.
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const logger = require("../logger");
const { poolPromise } = require("../db");
const { conTransaccion } = require("../utils/transacciones");
const { ErrorNoAutorizado, ErrorProhibido } = require("../errors/AppError");
const {
    generarRefreshTokenClaro,
    hashRefreshToken,
    calcularFechaExpiracion
} = require("../utils/refreshToken");
const usuariosRepo = require("../repositories/usuarios.repository");
const refreshTokensRepo = require("../repositories/refreshTokens.repository");
const bitacoraRepo = require("../repositories/bitacora.repository");

// Mensaje NEUTRO unico para todos los fallos de refresh (F-05): no distingue
// no-existe / revocado / expirado / carrera para no filtrar el estado interno.
const MENSAJE_SESION_EXPIRADA = "Sesion expirada";

// Umbral de intentos fallidos consecutivos antes de bloquear la cuenta
// (deteccion de comportamiento anomalo, mejora del modelo ER). Se resetea en
// cada login exitoso; para desbloquear manualmente ver
// PATCH /api/usuarios/:id/desbloquear (rol Administrador).
const LIMITE_INTENTOS_FALLIDOS = 5;

// Firma el access token con el payload del legacy (identidad + rol) y el TTL
// corto configurado (JWT_ACCESS_TTL, 15m). Firmado con JWT_SECRET (access).
// Invariante: jwt.sign OMITE las claims undefined sin avisar, y un token sin
// id_rol pasa verificarToken pero falla SIEMPRE en requerirRol (403 opacos).
// Preferimos fallar aqui, fuerte y localizado, antes que emitir un token mudo.
function firmarAccessToken(usuario) {
    const claimsRequeridas = ["id_usuario", "correo", "id_rol", "rol"];
    const faltantes = claimsRequeridas.filter(
        (claim) => usuario[claim] === undefined || usuario[claim] === null
    );

    if (faltantes.length > 0) {
        throw new Error(
            `No se puede firmar el access token: faltan claims ${faltantes.join(", ")}`
        );
    }

    return jwt.sign(
        {
            id_usuario: usuario.id_usuario,
            correo: usuario.correo,
            id_rol: usuario.id_rol,
            rol: usuario.rol
        },
        config.JWT_SECRET,
        { expiresIn: config.JWT_ACCESS_TTL }
    );
}

// Proyeccion segura del usuario para el body de login (sin password ni hash).
function usuarioPublico(usuario) {
    return {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        id_rol: usuario.id_rol,
        rol: usuario.rol,
        mfa_activado: Boolean(usuario.mfa_activado)
    };
}

// POST /api/auth/login. Verifica credenciales, emite una familia nueva por
// login, inserta el refresh (hasheado) + Bitacora en una transaccion, y firma
// el access. Devuelve { accessToken, refreshTokenClaro, usuario }. Preserva los
// 400/401/403 del legacy (el 400 de campos obligatorios lo cubre el schema zod).
async function login(datos) {
    const correo = datos.correo;
    const password = datos.password;

    const pool = await poolPromise;
    const usuario = await usuariosRepo.buscarPorCorreoParaLogin(pool, correo);

    // 401 neutro para "no existe" y para "password incorrecta" (no distingue).
    if (!usuario) {
        throw new ErrorNoAutorizado("Correo o contraseña incorrectos");
    }

    if (usuario.estado !== "Activo") {
        throw new ErrorProhibido("El usuario está inactivo");
    }

    // Cuenta bloqueada por intentos fallidos consecutivos: se rechaza ANTES
    // de comparar la contraseña (aunque la contraseña sea correcta), para que
    // un ataque de fuerza bruta que eventualmente acierte no consiga entrar
    // sin que un administrador desbloquee la cuenta primero.
    if (usuario.intentos_fallidos >= LIMITE_INTENTOS_FALLIDOS) {
        throw new ErrorProhibido(
            "La cuenta está bloqueada por múltiples intentos fallidos. Contacte a un administrador."
        );
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
        // Se registra el intento fuera de la transacción de login: es una
        // señal de seguridad que debe persistir aunque el resto del login no
        // continúe (no hay nada que revertir en el camino del 401).
        await usuariosRepo.incrementarIntentosFallidos(
            pool,
            usuario.id_usuario
        );
        throw new ErrorNoAutorizado("Correo o contraseña incorrectos");
    }

    const idFamilia = crypto.randomUUID();
    const refreshTokenClaro = generarRefreshTokenClaro();
    const tokenHash = hashRefreshToken(refreshTokenClaro);
    const fechaExpiracion = calcularFechaExpiracion();

    await conTransaccion(pool, async (transaction) => {
        await refreshTokensRepo.insertar(transaction, {
            tokenHash,
            idFamilia,
            idUsuario: usuario.id_usuario,
            fechaExpiracion
        });

        await usuariosRepo.registrarLoginExitoso(
            transaction,
            usuario.id_usuario
        );

        await bitacoraRepo.registrar(
            transaction,
            usuario.id_usuario,
            "Inicio de sesión exitoso"
        );
    });

    const accessToken = firmarAccessToken(usuario);

    return {
        accessToken,
        refreshTokenClaro,
        usuario: usuarioPublico(usuario)
    };
}

// POST /api/auth/refresh. Rota el refresh entrante (en cookie) de forma atomica
// y devuelve un access nuevo. Deteccion de reuso -> revoca la familia y 401.
// Todos los fallos responden el mismo 401 neutro (F-05). Devuelve
// { accessToken, refreshTokenClaro } (el refresh nuevo va SOLO a la cookie).
async function refresh(refreshTokenClaro) {
    if (!refreshTokenClaro) {
        throw new ErrorNoAutorizado(MENSAJE_SESION_EXPIRADA);
    }

    const pool = await poolPromise;
    const tokenHash = hashRefreshToken(refreshTokenClaro);
    const fila = await refreshTokensRepo.buscarPorHash(pool, tokenHash);

    // No existe -> 401 neutro (no revela si nunca existio o fue purgado).
    if (!fila) {
        throw new ErrorNoAutorizado(MENSAJE_SESION_EXPIRADA);
    }

    // Deteccion de reuso: un token ya revocado o ya rotado (reemplazado_por no
    // nulo) que se vuelve a presentar es firma de robo -> revoca la FAMILIA con
    // motivo 'reuso_detectado', registra evento de seguridad (F-07) y 401.
    const yaConsumido = fila.revocado || fila.reemplazado_por !== null;
    if (yaConsumido) {
        await conTransaccion(pool, async (transaction) => {
            await refreshTokensRepo.revocarFamilia(transaction, {
                idFamilia: fila.id_familia,
                motivo: "reuso_detectado"
            });

            await bitacoraRepo.registrar(
                transaction,
                fila.id_usuario,
                "Posible reuso de refresh token detectado; sesión revocada"
            );
        });

        // Log operativo: solo id_usuario/id_familia/motivo, NUNCA el token/hash.
        logger.warn(
            {
                evento: "reuso_refresh_token",
                id_usuario: fila.id_usuario,
                id_familia: fila.id_familia,
                motivo: "reuso_detectado"
            },
            "Posible reuso de refresh token detectado; familia revocada"
        );

        throw new ErrorNoAutorizado(MENSAJE_SESION_EXPIRADA);
    }

    // Expirado -> 401 neutro. Comparacion UTC (fecha_expiracion es UTC).
    if (new Date(fila.fecha_expiracion).getTime() <= Date.now()) {
        throw new ErrorNoAutorizado(MENSAJE_SESION_EXPIRADA);
    }

    // La fila de RefreshTokens NO trae correo/id_rol/rol: hay que releerlos de
    // Usuarios+Roles para que el access nuevo lleve las mismas claims que el de
    // login. Se hace ANTES de rotar para no quemar el token si la cuenta ya no
    // sirve. Cuenta borrada o inactivada despues del login -> 401 neutro: la
    // sesion deja de renovarse sin revelar cual de los dos casos fue.
    const usuario = await usuariosRepo.buscarPorIdParaToken(
        pool,
        fila.id_usuario
    );

    if (!usuario || usuario.estado !== "Activo") {
        throw new ErrorNoAutorizado(MENSAJE_SESION_EXPIRADA);
    }

    // Rotacion atomica: inserta el hijo (misma familia) y marca la vieja como
    // 'rotado' solo si sigue viva (WHERE revocado=0 AND reemplazado_por IS NULL).
    // Si @@ROWCOUNT es 0, otra peticion ya roto (carrera benigna): rollback y
    // 401 neutro (el cliente reintenta), NO se trata como reuso.
    const nuevoRefreshClaro = generarRefreshTokenClaro();
    const nuevoTokenHash = hashRefreshToken(nuevoRefreshClaro);
    const nuevaExpiracion = calcularFechaExpiracion();

    await conTransaccion(pool, async (transaction) => {
        const idNueva = await refreshTokensRepo.insertar(transaction, {
            tokenHash: nuevoTokenHash,
            idFamilia: fila.id_familia,
            idUsuario: fila.id_usuario,
            fechaExpiracion: nuevaExpiracion
        });

        const filasRotadas = await refreshTokensRepo.rotar(transaction, {
            idRefreshToken: fila.id_refresh_token,
            idReemplazo: idNueva
        });

        if (filasRotadas === 0) {
            // Carrera benigna: otra rotacion gano. Se aborta esta (rollback del
            // insert del hijo) y se responde 401 neutro para que el SPA reintente.
            throw new ErrorNoAutorizado(MENSAJE_SESION_EXPIRADA);
        }
    });

    const accessToken = firmarAccessToken(usuario);

    return { accessToken, refreshTokenClaro: nuevoRefreshClaro };
}

// POST /api/auth/logout. Revoca la FAMILIA COMPLETA del token presentado
// (motivo 'logout') + Bitacora, en una transaccion. Idempotente: sin cookie, o
// token inexistente, o familia ya revocada -> no falla (el controller borra la
// cookie y responde 200 igual). No devuelve nada relevante.
async function logout(refreshTokenClaro) {
    if (!refreshTokenClaro) {
        return;
    }

    const pool = await poolPromise;
    const tokenHash = hashRefreshToken(refreshTokenClaro);
    const fila = await refreshTokensRepo.buscarPorHash(pool, tokenHash);

    if (!fila) {
        return;
    }

    await conTransaccion(pool, async (transaction) => {
        const filasRevocadas = await refreshTokensRepo.revocarFamilia(
            transaction,
            { idFamilia: fila.id_familia, motivo: "logout" }
        );

        // Solo audita si realmente cerro algo (evita ruido en logout repetido).
        if (filasRevocadas > 0) {
            await bitacoraRepo.registrar(
                transaction,
                fila.id_usuario,
                "Cierre de sesión"
            );
        }
    });
}

module.exports = {
    login,
    refresh,
    logout,
    MENSAJE_SESION_EXPIRADA
};
