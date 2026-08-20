-- =====================================================================================
-- VINKAPLANT_DB_v4_rollback.sql  -  Reversion de la migracion v4
-- ---------------------------------------------------------------------------------------
-- NO se ejecuta automaticamente con nada. Es un artefacto de reversion manual: solo
-- correrlo si de verdad se quiere deshacer VINKAPLANT_DB_v4.sql.
--
-- EFECTO: elimina RolPermiso y Permisos por completo, y las columnas nuevas de Usuarios
-- y Productos. Los datos de negocio existentes en Usuarios/Productos (filas y columnas
-- originales) NO se ven afectados.
--
-- Orden inverso al roll-forward: indices/FKs, luego tablas, luego columnas. Idempotente
-- (cada paso bajo IF EXISTS): correrlo mas de una vez no falla.
-- =====================================================================================

USE [VINKAPLANT_DB]
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RolPermiso_Permiso' AND object_id = OBJECT_ID('dbo.RolPermiso'))
    DROP INDEX [IX_RolPermiso_Permiso] ON [dbo].[RolPermiso]
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_RolPermiso_Permiso')
    ALTER TABLE [dbo].[RolPermiso] DROP CONSTRAINT [FK_RolPermiso_Permiso]
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_RolPermiso_Rol')
    ALTER TABLE [dbo].[RolPermiso] DROP CONSTRAINT [FK_RolPermiso_Rol]
GO

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'RolPermiso' AND schema_id = SCHEMA_ID('dbo'))
    DROP TABLE [dbo].[RolPermiso]
GO

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Permisos' AND schema_id = SCHEMA_ID('dbo'))
    DROP TABLE [dbo].[Permisos]
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Productos_CantidadDisponible')
    ALTER TABLE [dbo].[Productos] DROP CONSTRAINT [CK_Productos_CantidadDisponible]
GO

IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Productos_EstadoFitosanitario')
    ALTER TABLE [dbo].[Productos] DROP CONSTRAINT [DF_Productos_EstadoFitosanitario]
GO

IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Productos_CantidadDisponible')
    ALTER TABLE [dbo].[Productos] DROP CONSTRAINT [DF_Productos_CantidadDisponible]
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Productos') AND name = 'ubicacion_invernadero')
    ALTER TABLE [dbo].[Productos] DROP COLUMN [ubicacion_invernadero]
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Productos') AND name = 'estado_fitosanitario')
    ALTER TABLE [dbo].[Productos] DROP COLUMN [estado_fitosanitario]
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Productos') AND name = 'cantidad_disponible')
    ALTER TABLE [dbo].[Productos] DROP COLUMN [cantidad_disponible]
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Usuarios_IntentosFallidos')
    ALTER TABLE [dbo].[Usuarios] DROP CONSTRAINT [CK_Usuarios_IntentosFallidos]
GO

IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Usuarios_IntentosFallidos')
    ALTER TABLE [dbo].[Usuarios] DROP CONSTRAINT [DF_Usuarios_IntentosFallidos]
GO

IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Usuarios_MfaActivado')
    ALTER TABLE [dbo].[Usuarios] DROP CONSTRAINT [DF_Usuarios_MfaActivado]
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Usuarios') AND name = 'ultimo_acceso')
    ALTER TABLE [dbo].[Usuarios] DROP COLUMN [ultimo_acceso]
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Usuarios') AND name = 'intentos_fallidos')
    ALTER TABLE [dbo].[Usuarios] DROP COLUMN [intentos_fallidos]
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Usuarios') AND name = 'mfa_activado')
    ALTER TABLE [dbo].[Usuarios] DROP COLUMN [mfa_activado]
GO

PRINT 'Rollback v4 aplicado. Tablas/columnas nuevas eliminadas; nada existente afectado.'
GO