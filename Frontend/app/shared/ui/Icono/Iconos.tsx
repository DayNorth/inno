import type { ReactNode, SVGProps } from "react";

/**
 * Set propio de iconos SVG en linea: el proyecto no tenia ninguno y la CSP
 * (font-src 'self') prohibe cargar una fuente de iconos desde un CDN. Cada
 * icono hereda color de `currentColor`, es puramente decorativo
 * (`aria-hidden`) y siempre va acompanado de texto visible o `aria-label` en
 * quien lo use — nunca es el unico portador de significado.
 */
type Props = SVGProps<SVGSVGElement>;

function base(children: ReactNode, props: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconoInicio = (props: Props) =>
  base(
    <>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.5V20h5v-6h3v6h5V9.5" />
    </>,
    props,
  );

export const IconoClientes = (props: Props) =>
  base(
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
      <circle cx="17" cy="8.5" r="2.3" />
      <path d="M15.8 14.7c2.4.3 4.2 2.4 4.2 5.3" />
    </>,
    props,
  );

export const IconoPedidos = (props: Props) =>
  base(
    <>
      <path d="M4 7.5 12 3.5l8 4v9l-8 4-8-4Z" />
      <path d="M4 7.5 12 11.5l8-4" />
      <path d="M12 11.5V20.5" />
    </>,
    props,
  );

export const IconoProveedores = (props: Props) =>
  base(
    <>
      <path d="M3 7h11v9H3Z" />
      <path d="M14 10h3.5L20 13v3h-6Z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </>,
    props,
  );

export const IconoAccesos = (props: Props) =>
  base(
    <>
      <path d="M12 3.5 19 6v5.5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6Z" />
      <path d="M9 12.2l2 2 4-4.2" />
    </>,
    props,
  );

export const IconoDispositivos = (props: Props) =>
  base(
    <>
      <rect x="3.5" y="5" width="17" height="11" rx="1.2" />
      <path d="M8.5 20h7M12 16v4" />
    </>,
    props,
  );

export const IconoRiesgos = (props: Props) =>
  base(
    <>
      <path d="M12 3.5 21 19.5H3Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="16.7" r="0.15" fill="currentColor" stroke="none" />
    </>,
    props,
  );

export const IconoIncidentes = (props: Props) =>
  base(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5" />
      <circle cx="12" cy="16" r="0.15" fill="currentColor" stroke="none" />
    </>,
    props,
  );

export const IconoBitacora = (props: Props) =>
  base(
    <>
      <rect x="5.5" y="4" width="13" height="17" rx="1.5" />
      <path d="M9 4V3h6v1" />
      <path d="M8.5 10h7M8.5 13.5h7M8.5 17h4.5" />
    </>,
    props,
  );

export const IconoDocumentos = (props: Props) =>
  base(
    <>
      <path d="M6.5 3.5h8l4 4V20a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5V8h4" />
      <path d="M8.5 12.5h7M8.5 16h5" />
    </>,
    props,
  );

export const IconoLogout = (props: Props) =>
  base(
    <>
      <path d="M9.5 20H5.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4" />
      <path d="M16 16.5 20.5 12 16 7.5" />
      <path d="M20.5 12H10" />
    </>,
    props,
  );

export const IconoSol = (props: Props) =>
  base(
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </>,
    props,
  );

export const IconoLuna = (props: Props) =>
  base(<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />, props);

export const IconoEditar = (props: Props) =>
  base(
    <>
      <path d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z" />
      <path d="M14 6.5 17.5 10" />
    </>,
    props,
  );

export const IconoBloquear = (props: Props) =>
  base(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6.5 6.5l11 11" />
    </>,
    props,
  );

export const IconoRestaurar = (props: Props) =>
  base(
    <>
      <path d="M4.5 12a7.5 7.5 0 1 1 2.5 5.6" />
      <path d="M4.5 17.5V13h4.5" />
    </>,
    props,
  );

export const IconoMas = (props: Props) => base(<path d="M12 5v14M5 12h14" />, props);

export const IconoChevronDerecha = (props: Props) => base(<path d="M9 5.5 16 12l-7 6.5" />, props);

export const IconoBuscar = (props: Props) =>
  base(
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M19.5 19.5 15 15" />
    </>,
    props,
  );

export const IconoProductos = (props: Props) =>
  base(
    <>
      <path d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5Z" />
      <path d="M4 8l8 4.5L20 8" />
      <path d="M12 12.5V21" />
    </>,
    props,
  );

export const IconoPermisos = (props: Props) =>
  base(
    <>
      <path d="M12 3.5 19 6.5v5c0 5-3 8-7 9-4-1-7-4-7-9v-5l7-3Z" />
      <path d="M9.5 12l1.8 1.8L14.5 10" />
    </>,
    props,
  );

export const IconoUsuarios = (props: Props) =>
  base(
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" />
      <circle cx="17.5" cy="7.5" r="2.2" />
      <path d="M16 14.3c2.4.4 4 2.6 4 5.7" />
    </>,
    props,
  );
