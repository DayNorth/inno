import {
  fechaObligatoria,
  largoMaximo,
  obligatorio,
  recortado,
  seleccionObligatoria,
  type Reglas,
} from "@/shared/formularios/tipos";
import { hoyIso } from "@/shared/utils/formato";
import { LARGOS_ACCESO, type DatosAcceso } from "../dominio/acceso";

export interface AccesoForm {
  id_usuario: number | null;
  id_plataforma: number | null;
  rol_acceso: string;
  fecha_alta: string;
}

export const reglasAcceso = {
  id_usuario: seleccionObligatoria("un usuario valido"),
  id_plataforma: seleccionObligatoria("una plataforma valida"),
  rol_acceso: {
    ...obligatorio("El rol de acceso"),
    ...largoMaximo(LARGOS_ACCESO.rol_acceso),
  },
  fecha_alta: fechaObligatoria("La fecha de alta"),
} satisfies Reglas<AccesoForm>;

export const valoresInicialesAcceso = (): AccesoForm => ({
  id_usuario: null,
  id_plataforma: null,
  rol_acceso: "",
  fecha_alta: hoyIso(),
});

export const aPayloadAcceso = (f: AccesoForm): DatosAcceso => ({
  id_usuario: f.id_usuario ?? 0,
  id_plataforma: f.id_plataforma ?? 0,
  rol_acceso: recortado(f.rol_acceso),
  fecha_alta: f.fecha_alta,
});
