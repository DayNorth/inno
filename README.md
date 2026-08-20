# VinkaPlant

Sistema de gestión documental / pedidos de VinkaPlant. Monorepo con:

- **Backend/** — API REST (Node.js + Express 5 + SQL Server)
- **Frontend/** — SPA (React 19 + Vite)
- **VINKAPLANT_DB_v2.sql** / **VINKAPLANT_DB_v3.sql** / **VINKAPLANT_DB_v4.sql** — scripts de
  base de datos (SQL Server).

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (motor de
  contenedores para SQL Server).
- Node.js 20+ y npm.
- Cliente `sqlcmd` **no** hace falta instalarlo en el host: se usa el que trae
  la propia imagen del contenedor.

## 1. Levantar SQL Server (Docker)

Copiar el `.env.example` de la raíz como `.env` y completar la contraseña de
`sa`:

```bash
cp .env.example .env
```

```env
DB_SA_PASSWORD=<una-contrasena-fuerte>
DB_HOST_PORT=1434
```

> La contraseña debe cumplir la política de complejidad de SQL Server
> (mayúscula, minúscula, número y símbolo, mínimo 8 caracteres). Se usa
> `1434` en el host (no `1433`) para no chocar con una instalación local de
> SQL Server que ya esté escuchando en el puerto por defecto.

> Si ya existe un contenedor SQL Server creado a mano (por ejemplo
> `vinkaplant-sql-dev`) escuchando en el mismo puerto, hay que pararlo antes
> para que `docker compose up` no falle por puerto ocupado:
> `docker stop vinkaplant-sql-dev`. Los datos del contenedor manual no se
> migran solos: si tenía datos que querés conservar, respaldalos antes
> (`docker exec ... sqlcmd ... BACKUP DATABASE`) o aplicá los scripts del
> paso 2 sobre el contenedor nuevo para partir de datos semilla limpios.

Levantar el contenedor:

```bash
docker compose up -d
```

Esperar a que el healthcheck quede en `healthy`:

```bash
docker compose ps
```

## 2. Aplicar los scripts de base de datos

Los scripts `.sql` de la raíz **no se aplican todos**: `VINKAPLANT_DB.sql` es
la versión original (sin el módulo VinkaGuard) y quedó **obsoleta**, superada
por `VINKAPLANT_DB_v2.sql`. Sobre un contenedor nuevo se aplican, **en este
orden**:

1. **`VINKAPLANT_DB_v2.sql`** — script full-create (crea la base, el esquema
   completo y datos semilla). Es **destructivo**: si se vuelve a ejecutar
   sobre una base con datos reales, hace `DROP DATABASE` y los borra. Solo
   usarlo para inicializar una base vacía.
2. **`VINKAPLANT_DB_v3.sql`** — parche aditivo (agrega la tabla
   `RefreshTokens` para el login access/refresh). Es idempotente: se puede
   volver a ejecutar sin riesgo.
3. **`VINKAPLANT_DB_v4.sql`** — parche aditivo (agrega las tablas `Permisos`
   y `RolPermiso`; las columnas `mfa_activado`, `intentos_fallidos` y
   `ultimo_acceso` en `Usuarios`; y `cantidad_disponible`,
   `estado_fitosanitario` y `ubicacion_invernadero` en `Productos`). También
   es idempotente. Su reversión manual vive aparte, en
   `VINKAPLANT_DB_v4_rollback.sql` (no se ejecuta con nada; es solo para
   cuando de verdad se quiera deshacer v4).

Copiar los scripts dentro del contenedor y ejecutarlos con el `sqlcmd` que
trae la imagen:

```bash
docker cp VINKAPLANT_DB_v2.sql vinkaplant-sql:/tmp/v2.sql
docker cp VINKAPLANT_DB_v3.sql vinkaplant-sql:/tmp/v3.sql
docker cp VINKAPLANT_DB_v4.sql vinkaplant-sql:/tmp/v4.sql

docker exec -it vinkaplant-sql /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$DB_SA_PASSWORD" -C -i /tmp/v2.sql

docker exec -it vinkaplant-sql /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$DB_SA_PASSWORD" -C -i /tmp/v3.sql

docker exec -it vinkaplant-sql /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$DB_SA_PASSWORD" -C -i /tmp/v4.sql
```

(En PowerShell, reemplazar `$DB_SA_PASSWORD` por el valor real o por
`$env:DB_SA_PASSWORD` si lo cargaste como variable de sesión. Escribir cada
comando en **una sola línea**: la continuación de línea con `\` es sintaxis
de bash, no de PowerShell.)

> **Nota Windows/PowerShell:** si vas a editar o volver a guardar alguno de
> estos `.sql` en Windows, guárdalo siempre en **UTF-8 sin BOM** y evitá
> herramientas que "autocorrijan" el texto (algunos editores convierten
> secuencias de guiones en otros caracteres). Antes de copiarlo al
> contenedor, podés verificar que no se coló ningún carácter raro con:
> `Select-String -Path .\VINKAPLANT_DB_v4.sql -Pattern '[^\x00-\x7F]'`
> (no debe devolver ningún resultado).

Verificación rápida:

```bash
docker exec -it vinkaplant-sql /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$DB_SA_PASSWORD" -C \
  -Q "SELECT name FROM sys.databases WHERE name = 'VINKAPLANT_DB'; USE VINKAPLANT_DB; SELECT COUNT(*) AS usuarios FROM dbo.Usuarios; SELECT COUNT(*) AS permisos FROM dbo.Permisos;"
```

`permisos` debe dar `13`.

## 3. Backend

```bash
cd Backend
npm install
cp .env.example .env
```

Completar `Backend/.env`:

- `DB_SERVER=localhost`, `DB_PORT=1434` (o el que hayas puesto en
  `DB_HOST_PORT`), `DB_DATABASE=VINKAPLANT_DB`, `DB_USER=sa`,
  `DB_PASSWORD=<la misma contraseña de DB_SA_PASSWORD del paso 1>`.
- `PORT=3001` (el 3000 puede chocar con Grafana u otras herramientas locales).
- `JWT_SECRET` / `JWT_REFRESH_SECRET` / `REFRESH_TOKEN_PEPPER`: tres secretos
  **distintos entre sí**, de al menos 32 bytes. Generar cada uno con:

  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
  ```

- `CORS_ORIGIN=http://localhost:5173` (puerto por defecto de Vite).

Arrancar en modo desarrollo (con recarga automática):

```bash
npm run dev
```

Debe loguear `Servidor ejecutándose en http://localhost:3001` y `Conectado a
VINKAPLANT_DB`.

## 4. Frontend

```bash
cd Frontend
npm install
cp .env.example .env
```

`Frontend/.env` ya trae por defecto:

```env
VITE_API_URL=http://localhost:3001
```

Arrancar:

```bash
npm run dev
```

Vite sirve en `http://localhost:5173`.

## Credenciales de prueba

El seed de `VINKAPLANT_DB_v2.sql` crea usuarios de ejemplo (rol
Administrador/Operador). Para iniciar sesión:

```
correo:     admin@vinkaplant.com
contraseña: admin12345*
```

El login tiene dos capas de límite:

- **Por IP**: rate limiting general (10 intentos / 15 min por IP, fijo en
  backend). Si te bloqueás probando credenciales, esperá la ventana o
  reiniciá el backend en desarrollo.
- **Por cuenta**: tras **5 intentos fallidos consecutivos** con la misma
  cuenta, esa cuenta se bloquea (`intentos_fallidos` en `Usuarios`) hasta que
  un Administrador la desbloquea desde la pantalla **Usuarios**, o
  manualmente en base de datos:

  ```sql
  UPDATE Usuarios SET intentos_fallidos = 0 WHERE correo = 'admin@vinkaplant.com';
  ```

## Verificación end-to-end

- `docker compose ps` → contenedor `vinkaplant-sql` con estado `healthy`.
- Backend: `curl http://localhost:3001/` → `200`.
- Frontend: abrir `http://localhost:5173`, iniciar sesión con las
  credenciales de prueba. El menú lateral debe mostrar Productos, Usuarios y
  Permisos (los dos últimos solo si el usuario es Administrador).

## Problemas comunes

- **`ECONNREFUSED` al backend contra SQL Server**: el contenedor tarda unos
  segundos en aceptar conexiones tras `docker compose up`; esperar a que el
  healthcheck esté `healthy` antes de arrancar el backend.
- **Puerto 3000/1433 ocupado**: este proyecto usa 3001 (backend) y 1434 (SQL
  Server en el host) justamente para evitar choques con Grafana u otra
  instancia de SQL Server local.
- **`docker compose up` falla por contraseña débil**: SQL Server rechaza
  contraseñas de `sa` que no cumplan su política de complejidad; usar una
  contraseña larga con mayúsculas, minúsculas, números y símbolos.
- **`sqlcmd` falla con `Missing end comment mark '*/'` al aplicar un `.sql`**:
  la versión de `sqlcmd` de `mssql-tools18` (reescrita en Go) separa lotes
  buscando líneas que digan literalmente `GO`, sin fijarse si están dentro de
  un comentario `/* */`. Evitar bloques de comentario que contengan una línea
  `GO` sola; usar comentarios de línea (`--`) para bloques largos de texto en
  los `.sql` de este proyecto.