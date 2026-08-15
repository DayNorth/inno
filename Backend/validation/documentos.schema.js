// Esquemas de validacion de documentos. El cuerpo llega como multipart, asi que
// TODOS los campos entran como cadena: de ahi z.coerce en los ids.
//
// nombre_archivo y ruta_archivo NO se validan aqui a proposito: no los manda el
// cliente. El primero se deriva (saneado) del archivo subido y el segundo lo
// genera el servidor. Aceptarlos del body permitiria fijar la ruta en disco.
const { z } = require("zod");
const { idParamSchema } = require("./comun.schema");

const idPositivo = (mensaje) =>
    z.coerce.number({ message: mensaje }).int(mensaje).positive(mensaje);

const crearDocumentoSchema = z.object({
    id_pedido: idPositivo("Debe seleccionar un pedido válido"),
    id_tipo: idPositivo("Debe seleccionar un tipo de documento válido"),
    id_plataforma: idPositivo("Debe seleccionar una plataforma válida")
});

const idDocumentoParam = idParamSchema("El ID del documento no es válido");

module.exports = { crearDocumentoSchema, idDocumentoParam };
