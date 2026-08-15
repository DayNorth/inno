# Fuentes self-hosted

Aquí van los `.woff2` que declara `app/estilos/fuentes.css`:

- `ibm-plex-sans-400.woff2`
- `ibm-plex-sans-600.woff2`
- `fraunces-600.woff2`

**Nunca se cargan desde Google Fonts ni desde ningún CDN.** La CSP de producción
declara `font-src 'self'` y `default-src 'self'`, así que un `<link>` a un host
externo se bloquearía y la tipografía se rompería en silencio. Además, servirlas
desde el propio origen evita filtrar a un tercero qué usuario carga qué página y
cuándo (`docs/frontend-seguridad.md` §3.3).

Mientras los archivos no estén, la aplicación cae a las fuentes del sistema
declaradas en la cadena de respaldo de `tokens.css` y todo sigue funcionando:
`font-display: swap` lo garantiza. Los avisos del build sobre estas rutas son
esperados hasta que se añadan los binarios.
