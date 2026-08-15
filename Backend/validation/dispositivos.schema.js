// Esquemas de validación de dispositivos. Replican los mensajes y el orden de
// validación del router legacy: responsable -> código -> tipo. Los booleanos
// se coercionan igual que Boolean(...) del legacy; estado_seguridad se calcula
// en el service. La fecha es opcional (se guarda null si falta).
const { z } = require("zod");
const {
    textoRequerido,
    textoOpcional,
    booleanoLaxo,
    fechaOpcional
} = require("./comun.schema");

const idPositivo = (mensaje) =>
    z.coerce.number({ message: mensaje }).int(mensaje).positive(mensaje);

// Topes reales de columna: Dispositivos.codigo_equipo varchar(30),
// tipo_dispositivo varchar(50), sistema_operativo varchar(100).
const crearDispositivoSchema = z.object({
    id_usuario: idPositivo("Debe seleccionar un responsable válido"),
    codigo_equipo: textoRequerido(
        "El código del equipo es obligatorio",
        30,
        "El código del equipo no puede superar los 30 caracteres"
    ),
    tipo_dispositivo: textoRequerido(
        "El tipo de dispositivo es obligatorio",
        50,
        "El tipo de dispositivo no puede superar los 50 caracteres"
    ),
    sistema_operativo: textoOpcional(
        100,
        "El sistema operativo no puede superar los 100 caracteres"
    ),
    antivirus_activo: booleanoLaxo,
    fecha_ultima_actualizacion: fechaOpcional(
        "La fecha de última actualización no es válida"
    ),
    tiene_ups: booleanoLaxo
});

module.exports = { crearDispositivoSchema };
