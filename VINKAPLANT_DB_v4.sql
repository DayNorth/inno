-- =====================================================================================
-- VINKAPLANT_DB_v4.sql  -  Migracion ADITIVA (roll-forward)
---------------------------------------------------------------------------------------
-- Cierra 3 brechas identificadas en el analisis de mejoras del modelo ER:
--
-- 1) Tablas [dbo].[Permisos] y [dbo].[RolPermiso]: catalogo de permisos y su
--   asignacion a cada rol. Antes el control de acceso vivia SOLO en el codigo
--   (requerirRol(1,2) hardcodeado en cada ruta); ahora existe ademas una
--   representacion en base de datos, consultable y auditable, de que puede
--   hacer cada rol. El middleware de autorizacion (requerirRol por id_rol)
--   NO se reemplaza en este parche: RolPermiso documenta y expone via API
--   la misma matriz que ya aplican las rutas, sentando la base para que un
--   futuro middleware permission-based la lea en vez de tener los ids de rol
--   quemados. Ver seccion 3 para el detalle de la semilla.
--
-- 2) Columnas [mfa_activado], [intentos_fallidos] y [ultimo_acceso] en
--   [dbo].[Usuarios]: la mejora propuesta para deteccion de comportamiento
--   anomalo. Se wirean en Backend/services/auth.service.js: intentos_fallidos
--   se incrementa en cada password incorrecta y se resetea en login exitoso;
--   a partir de 5 intentos consecutivos la cuenta se bloquea temporalmente
--   (ver LIMITE_INTENTOS_FALLIDOS en auth.service.js). mfa_activado queda
--   como bandera para una futura verificacion MFA (fuera de alcance de este
--   parche: no se implementa el segundo factor en si).
--
-- 3) Columnas [cantidad_disponible], [estado_fitosanitario] y
--   [ubicacion_invernadero] en [dbo].[Productos]: inventario real, en vez
--   del catalogo de solo nombre/descripcion/estado que habia. Se exponen a
--   traves de POST /api/productos (ya existia) y del nuevo PUT
--   /api/productos/:id (que tambien cierra RF-10, pendiente de la revision
--   anterior).
--
-- *** ADVERTENCIA IMPORTANTE - LEER ANTES DE EJECUTAR ***
--
-- Igual que v3: parche ADITIVO, NO un full-create. No borra ni modifica datos
-- existentes; solo agrega tablas/columnas nuevas. Es IDEMPOTENTE (cada objeto
-- bajo IF NOT EXISTS). Requiere que VINKAPLANT_DB_v2.sql (y opcionalmente v3)
-- ya se hayan aplicado.
--
-- Rollback: ver VINKAPLANT_DB_v4_rollback.sql (archivo aparte, ejecutable directo).
-- =====================================================================================
 
USE [VINKAPLANT_DB]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
 
-- =======================================================================================
-- 1) USUARIOS - columnas de deteccion de comportamiento anomalo
-- =======================================================================================
 
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Usuarios') AND name = 'mfa_activado')
    ALTER TABLE [dbo].[Usuarios] ADD [mfa_activado] [bit] NOT NULL CONSTRAINT [DF_Usuarios_MfaActivado] DEFAULT (0)
GO
 
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Usuarios') AND name = 'intentos_fallidos')
    ALTER TABLE [dbo].[Usuarios] ADD [intentos_fallidos] [int] NOT NULL CONSTRAINT [DF_Usuarios_IntentosFallidos] DEFAULT (0)
GO
 
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Usuarios') AND name = 'ultimo_acceso')
    ALTER TABLE [dbo].[Usuarios] ADD [ultimo_acceso] [datetime2](3) NULL
GO
 
-- intentos_fallidos nunca deberia poder ser negativo (defensa en profundidad;
-- el service ya evita decrementar por debajo de 0).
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Usuarios_IntentosFallidos')
    ALTER TABLE [dbo].[Usuarios] WITH CHECK ADD CONSTRAINT [CK_Usuarios_IntentosFallidos] CHECK ([intentos_fallidos] >= 0)
GO
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Usuarios_IntentosFallidos')
    ALTER TABLE [dbo].[Usuarios] CHECK CONSTRAINT [CK_Usuarios_IntentosFallidos]
GO
 
-- =======================================================================================
-- 2) PRODUCTOS - inventario real
-- =======================================================================================
 
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Productos') AND name = 'cantidad_disponible')
    ALTER TABLE [dbo].[Productos] ADD [cantidad_disponible] [int] NOT NULL CONSTRAINT [DF_Productos_CantidadDisponible] DEFAULT (0)
GO
 
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Productos') AND name = 'estado_fitosanitario')
    ALTER TABLE [dbo].[Productos] ADD [estado_fitosanitario] [varchar](30) NOT NULL CONSTRAINT [DF_Productos_EstadoFitosanitario] DEFAULT ('Sano')
GO
 
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Productos') AND name = 'ubicacion_invernadero')
    ALTER TABLE [dbo].[Productos] ADD [ubicacion_invernadero] [varchar](100) NULL
GO
 
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Productos_CantidadDisponible')
    ALTER TABLE [dbo].[Productos] WITH CHECK ADD CONSTRAINT [CK_Productos_CantidadDisponible] CHECK ([cantidad_disponible] >= 0)
GO
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Productos_CantidadDisponible')
    ALTER TABLE [dbo].[Productos] CHECK CONSTRAINT [CK_Productos_CantidadDisponible]
GO
 
-- =======================================================================================
-- 3) PERMISOS Y ROLPERMISO - catalogo de permisos granular
--    Semilla: refleja EXACTAMENTE la matriz de requerirRol(...) ya vigente en las rutas
--    del backend, para que RolPermiso sea un espejo fiel (y consultable) del control de
--    acceso real, no un catalogo aspiracional desconectado del codigo. Administrador (1)
--    recibe todos los permisos; Operador (2) los operativos; Auditor (3) solo lectura de
--    bitacora.
-- =======================================================================================
 
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Permisos' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[Permisos](
        [id_permiso]   [int] IDENTITY(1,1) NOT NULL,
        [nombre_permiso] [varchar](100) NOT NULL,
        [descripcion]  [varchar](255) NULL,
        CONSTRAINT [PK_Permisos] PRIMARY KEY CLUSTERED ([id_permiso] ASC)
    )
END
GO
 
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_Permisos_Nombre' AND object_id = OBJECT_ID('dbo.Permisos'))
    ALTER TABLE [dbo].[Permisos] ADD CONSTRAINT [UQ_Permisos_Nombre] UNIQUE ([nombre_permiso])
GO
 
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'RolPermiso' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[RolPermiso](
        [id_rol_permiso] [int] IDENTITY(1,1) NOT NULL,
        [id_rol]         [int] NOT NULL,
        [id_permiso]     [int] NOT NULL,
        CONSTRAINT [PK_RolPermiso] PRIMARY KEY CLUSTERED ([id_rol_permiso] ASC)
    )
END
GO
 
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_RolPermiso_Rol_Permiso' AND object_id = OBJECT_ID('dbo.RolPermiso'))
    ALTER TABLE [dbo].[RolPermiso] ADD CONSTRAINT [UQ_RolPermiso_Rol_Permiso] UNIQUE ([id_rol], [id_permiso])
GO
 
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_RolPermiso_Rol')
BEGIN
    ALTER TABLE [dbo].[RolPermiso] WITH CHECK ADD CONSTRAINT [FK_RolPermiso_Rol] FOREIGN KEY([id_rol]) REFERENCES [dbo].[Roles] ([id_rol])
    ALTER TABLE [dbo].[RolPermiso] CHECK CONSTRAINT [FK_RolPermiso_Rol]
END
GO
 
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_RolPermiso_Permiso')
BEGIN
    ALTER TABLE [dbo].[RolPermiso] WITH CHECK ADD CONSTRAINT [FK_RolPermiso_Permiso] FOREIGN KEY([id_permiso]) REFERENCES [dbo].[Permisos] ([id_permiso])
    ALTER TABLE [dbo].[RolPermiso] CHECK CONSTRAINT [FK_RolPermiso_Permiso]
END
GO
 
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RolPermiso_Permiso' AND object_id = OBJECT_ID('dbo.RolPermiso'))
    CREATE NONCLUSTERED INDEX [IX_RolPermiso_Permiso] ON [dbo].[RolPermiso] ([id_permiso] ASC)
GO
 
-- Semilla del catalogo de permisos (idempotente: solo inserta lo que falte).
INSERT INTO [dbo].[Permisos] ([nombre_permiso], [descripcion])
SELECT v.nombre_permiso, v.descripcion
FROM (VALUES
    ('clientes.gestionar',   'Crear, editar, inactivar y reactivar clientes'),
    ('productos.gestionar',  'Crear y editar productos, incluido el inventario'),
    ('pedidos.gestionar',    'Crear, editar, cambiar estado y cancelar pedidos'),
    ('documentos.subir',     'Subir documentos asociados a un pedido'),
    ('documentos.eliminar',  'Eliminar documentos subidos'),
    ('accesos.gestionar',    'Registrar y actualizar accesos a plataformas externas'),
    ('accesos.revocar',      'Revocar accesos a plataformas externas'),
    ('dispositivos.gestionar','Registrar dispositivos y su estado de seguridad'),
    ('riesgos.gestionar',    'Registrar riesgos de seguridad de la informacion'),
    ('incidentes.gestionar', 'Registrar y actualizar incidentes de plataformas externas'),
    ('proveedores.gestionar','Registrar proveedores tecnologicos y sus evaluaciones'),
    ('bitacora.consultar',   'Consultar los registros de auditoria de la bitacora'),
    ('permisos.gestionar',   'Consultar y asignar permisos a los roles')
) AS v(nombre_permiso, descripcion)
WHERE NOT EXISTS (
    SELECT 1 FROM [dbo].[Permisos] p WHERE p.nombre_permiso = v.nombre_permiso
)
GO
 
-- Semilla de RolPermiso: Administrador (1) = todos los permisos.
INSERT INTO [dbo].[RolPermiso] ([id_rol], [id_permiso])
SELECT 1, p.id_permiso
FROM [dbo].[Permisos] p
WHERE NOT EXISTS (
    SELECT 1 FROM [dbo].[RolPermiso] rp WHERE rp.id_rol = 1 AND rp.id_permiso = p.id_permiso
)
GO
 
-- Operador (2) = permisos operativos (misma lista que requerirRol(1, 2) en las rutas).
INSERT INTO [dbo].[RolPermiso] ([id_rol], [id_permiso])
SELECT 2, p.id_permiso
FROM [dbo].[Permisos] p
WHERE p.nombre_permiso IN (
    'clientes.gestionar', 'productos.gestionar', 'pedidos.gestionar',
    'documentos.subir', 'accesos.gestionar', 'dispositivos.gestionar',
    'riesgos.gestionar', 'incidentes.gestionar', 'proveedores.gestionar'
)
AND NOT EXISTS (
    SELECT 1 FROM [dbo].[RolPermiso] rp WHERE rp.id_rol = 2 AND rp.id_permiso = p.id_permiso
)
GO
 
-- Auditor (3) = solo lectura de bitacora (misma lista que requerirRol(1, 3) en app.js).
INSERT INTO [dbo].[RolPermiso] ([id_rol], [id_permiso])
SELECT 3, p.id_permiso
FROM [dbo].[Permisos] p
WHERE p.nombre_permiso IN ('bitacora.consultar')
AND NOT EXISTS (
    SELECT 1 FROM [dbo].[RolPermiso] rp WHERE rp.id_rol = 3 AND rp.id_permiso = p.id_permiso
)
GO
 
PRINT 'Migracion v4 (Permisos/RolPermiso, seguridad de Usuarios, inventario de Productos) aplicada correctamente.'
GO
 
-- Rollback: ver VINKAPLANT_DB_v4_rollback.sql (script aparte, NO ejecutar salvo
-- que se quiera revertir esta migracion a proposito).