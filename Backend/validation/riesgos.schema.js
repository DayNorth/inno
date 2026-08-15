// Esquemas de validación de riesgos. Orden y mensajes idénticos al legacy:
// sistema -> categoria -> descripcion -> probabilidad (1-5) -> impacto (1-5).
const { z } = require("zod");
const { textoRequerido, textoOpcional } = require("./comun.schema");

const escala1a5 = (mensaje) =>
    z.coerce.number({ message: mensaje }).int(mensaje).min(1, mensaje).max(5, mensaje);

// Topes reales de columna: Riesgos.sistema varchar(50), categoria varchar(30),
// descripcion varchar(255), control_mitigante varchar(255).
const crearRiesgoSchema = z.object({
    sistema: textoRequerido(
        "El sistema es obligatorio",
        50,
        "El sistema no puede superar los 50 caracteres"
    ),
    categoria: textoRequerido(
        "La categoría es obligatoria",
        30,
        "La categoría no puede superar los 30 caracteres"
    ),
    descripcion: textoRequerido(
        "La descripción del riesgo es obligatoria",
        255,
        "La descripción del riesgo no puede superar los 255 caracteres"
    ),
    probabilidad: escala1a5("La probabilidad debe ser un valor entre 1 y 5"),
    impacto: escala1a5("El impacto debe ser un valor entre 1 y 5"),
    control_mitigante: textoOpcional(
        255,
        "El control mitigante no puede superar los 255 caracteres"
    )
});

module.exports = { crearRiesgoSchema };
