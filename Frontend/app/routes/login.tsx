import { useForm } from "react-hook-form";
import { redirect, useFetcher, useSearchParams } from "react-router";
import type { Route } from "./+types/login";
import { RUTAS } from "@/rutas";
import { mensajeDeError } from "@/shared/api/ApiError";
import { enviarJson } from "@/shared/api/enviarJson";
import { iniciarSesionEnServidor } from "@/shared/auth/authApi";
import { rutaInternaSegura } from "@/shared/auth/redireccion";
import { establecerSesion, sesionActual } from "@/shared/auth/sesion";
import { permitirRehidratar } from "@/shared/auth/refresco";
import {
  MENSAJE_POR_MOTIVO,
  type MotivoCierre,
} from "@/shared/auth/canalSesion";
import { obligatorio, obligatoria, largoMaximo, type Reglas } from "@/shared/formularios/tipos";
import { Alert } from "@/shared/ui/Alert/Alert";
import { AccionesFormulario } from "@/shared/ui/campos/AccionesFormulario";
import { CampoTexto } from "@/shared/ui/campos/CampoTexto";
import { Formulario } from "@/shared/ui/campos/Formulario";
import { ResumenErrores } from "@/shared/ui/campos/ResumenErrores";

export function meta() {
  return [{ title: "Iniciar sesion · VinkaPlant" }];
}

export function clientLoader() {
  // Ya hay sesion (p. ej. tras la rehidratacion del root): no tiene sentido
  // volver a pedir credenciales.
  if (sesionActual() !== null) throw redirect(RUTAS.inicio);
  return null;
}

interface LoginForm {
  correo: string;
  password: string;
}

const reglasLogin = {
  correo: { ...obligatorio("El correo"), ...largoMaximo(100) },
  password: obligatoria("La contrasena"),
} satisfies Reglas<LoginForm>;

type ResultadoLogin = { readonly mensaje: string } | null;

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ResultadoLogin> {
  const { correo, password, next } = (await request.json()) as LoginForm & {
    next: string | null;
  };

  try {
    const respuesta = await iniciarSesionEnServidor({ correo, password });
    establecerSesion(
      {
        id_usuario: respuesta.usuario.id_usuario,
        correo: respuesta.usuario.correo,
        id_rol: respuesta.usuario.id_rol,
        rol: respuesta.usuario.rol,
        // Unico momento en que el contrato entrega `nombre`: hay que
        // conservarlo, el refresh no lo devuelve.
        nombre: respuesta.usuario.nombre,
      },
      respuesta.token,
    );
    permitirRehidratar();
    // `next` viene de la URL: se normaliza para no abrir un redirect abierto.
    throw redirect(rutaInternaSegura(next));
  } catch (e) {
    if (e instanceof Response) throw e;
    // El 401 de login es neutro por contrato: no se deduce que campo fallo.
    return { mensaje: mensajeDeError(e) };
  }
}

export default function Login() {
  const fetcher = useFetcher<ResultadoLogin>();
  const [parametros] = useSearchParams();
  const motivo = parametros.get("motivo");
  const next = parametros.get("next");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<LoginForm>({
    defaultValues: { correo: "", password: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const enviando = fetcher.state !== "idle";
  const aviso =
    motivo !== null && motivo in MENSAJE_POR_MOTIVO
      ? MENSAJE_POR_MOTIVO[motivo as MotivoCierre]
      : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-lienzo p-6">
      <div className="w-full max-w-[24rem] rounded-lg border border-line-soft bg-paper-raised p-8 shadow-2">
        <h1 className="mb-1 font-titulos text-xl">
          Vinka<span className="text-marca">Plant</span>
        </h1>
        <p className="mb-6 text-sm text-ink-soft">Acceso al sistema de gestion.</p>

        {aviso !== null && <Alert tono="info">{aviso}</Alert>}
        {fetcher.data != null && (
          <Alert tono="error">{fetcher.data.mensaje}</Alert>
        )}

        <Formulario
          onSubmit={handleSubmit((f) => {
            enviarJson(fetcher.submit, { ...f, next });
          })}
        >
          <ResumenErrores errores={errors} visible={isSubmitted} />
          <div className="flex flex-col gap-4">
            <CampoTexto
              control={control}
              name="correo"
              etiqueta="Correo"
              type="email"
              autoComplete="username"
              maxLength={100}
              reglas={reglasLogin.correo}
            />
            <CampoTexto
              control={control}
              name="password"
              etiqueta="Contrasena"
              type="password"
              autoComplete="current-password"
              reglas={reglasLogin.password}
            />
          </div>
          <AccionesFormulario guardando={enviando} textoGuardar="Entrar" />
        </Formulario>

        <p className="mt-6 text-xs text-ink-tenue">
          Tras varios intentos fallidos el servidor limita temporalmente el
          acceso desde tu red.
        </p>
      </div>
    </div>
  );
}
