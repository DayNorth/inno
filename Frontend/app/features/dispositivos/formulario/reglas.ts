import {
  fechaOpcional,
  largoMaximo,
  obligatorio,
  opcional,
  recortado,
  seleccionObligatoria,
  type Reglas,
} from "@/shared/formularios/tipos";
import {
  LARGOS_DISPOSITIVO,
  type DatosDispositivo,
} from "../dominio/dispositivo";

export interface DispositivoForm {
  id_usuario: number | null;
  codigo_equipo: string;
  tipo_dispositivo: string;
  sistema_operativo: string;
  antivirus_activo: boolean;
  fecha_ultima_actualizacion: string;
  tiene_ups: boolean;
}

export const reglasDispositivo = {
  id_usuario: seleccionObligatoria("un responsable valido"),
  codigo_equipo: {
    ...obligatorio("El codigo del equipo"),
    ...largoMaximo(LARGOS_DISPOSITIVO.codigo_equipo),
  },
  tipo_dispositivo: {
    ...obligatorio("El tipo de dispositivo"),
    ...largoMaximo(LARGOS_DISPOSITIVO.tipo_dispositivo),
  },
  sistema_operativo: largoMaximo(LARGOS_DISPOSITIVO.sistema_operativo),
  fecha_ultima_actualizacion: fechaOpcional("La fecha de ultima actualizacion"),
} satisfies Reglas<DispositivoForm>;

export const valoresInicialesDispositivo: DispositivoForm = {
  id_usuario: null,
  codigo_equipo: "",
  tipo_dispositivo: "",
  sistema_operativo: "",
  antivirus_activo: false,
  fecha_ultima_actualizacion: "",
  tiene_ups: false,
};

export const aPayloadDispositivo = (f: DispositivoForm): DatosDispositivo => ({
  id_usuario: f.id_usuario ?? 0,
  codigo_equipo: recortado(f.codigo_equipo),
  tipo_dispositivo: recortado(f.tipo_dispositivo),
  sistema_operativo: opcional(f.sistema_operativo),
  antivirus_activo: f.antivirus_activo,
  fecha_ultima_actualizacion: opcional(f.fecha_ultima_actualizacion),
  tiene_ups: f.tiene_ups,
});
