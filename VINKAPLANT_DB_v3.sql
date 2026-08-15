/* =====================================================================================
   VINKAPLANT_DB_v3.sql  -  Migracion ADITIVA (roll-forward)
   -------------------------------------------------------------------------------------
   Anade la tabla [dbo].[RefreshTokens] para autenticacion access+refresh
   (ADR-002 / ADR-003) con rotacion de refresh tokens y deteccion de reuso.

   *** ADVERTENCIA IMPORTANTE - LEER ANTES DE EJECUTAR ***

   1) Este script es un PARCHE ADITIVO, NO un full-create.
      - NO ejecuta DROP DATABASE ni CREATE DATABASE.
      - NO altera ni elimina ninguna tabla, columna, constraint ni indice existente.
      - Solo AGREGA la tabla RefreshTokens, sus constraints y sus indices.

   2) A diferencia de VINKAPLANT_DB.sql y VINKAPLANT_DB_v2.sql, que son scripts
      FULL-CREATE DESTRUCTIVOS (hacen DROP DATABASE y recrean todo el esquema con
      datos semilla), este v3 NUNCA borra datos.
      >>> NUNCA ejecute VINKAPLANT_DB.sql ni VINKAPLANT_DB_v2.sql sobre una base
          de datos con datos de negocio: BORRARIAN TODA LA BASE (DROP DATABASE). <<<
      Sobre una BD poblada, aplique SOLO este v3.

   3) Es IDEMPOTENTE: seguro de re-ejecutar. Cada objeto se crea bajo IF NOT EXISTS,
      por lo que correrlo varias veces no falla ni duplica objetos.

   4) ROLLBACK documentado al final del archivo (bloque comentado "DROP inverso").
      NO se ejecuta automaticamente; es un artefacto de reversion manual.

   Requisito previo: la base [VINKAPLANT_DB] ya debe existir con la tabla
   [dbo].[Usuarios] (VINKAPLANT_DB_v2.sql), a la que apunta la FK de este script.

   Idioma e identificadores en espanol, consistentes con VINKAPLANT_DB_v2.sql.
   ===================================================================================== */

USE [VINKAPLANT_DB]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* -------------------------------------------------------------------------------------
   1) Tabla RefreshTokens + PK clustered + UNIQUE(token_hash) + CHECKs de coherencia.
      Se crea SOLO si no existe (idempotente).
   ------------------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'RefreshTokens' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[RefreshTokens](
        [id_refresh_token]   [int] IDENTITY(1,1) NOT NULL,
        [token_hash]         [char](64) NOT NULL,          -- HMAC-SHA256(pepper, refresh_token) en hex minuscula = 64 chars exactos. NUNCA el token en claro (ADR-003 / gate Decision 2). El backend calcula el HMAC; aqui solo se define el tipo/longitud.
        [id_familia]         [uniqueidentifier] NOT NULL,  -- agrupa la cadena de rotacion (una por login/sesion); vive en indice NO clustered, no en la PK
        [id_usuario]         [int] NOT NULL,               -- dueno del token; mismo tipo que Usuarios.id_usuario
        [fecha_emision]      [datetime2](3) NOT NULL CONSTRAINT [DF_RefreshTokens_FechaEmision] DEFAULT (SYSUTCDATETIME()),  -- UTC: evita ambiguedad de zona horaria en la expiracion
        [fecha_expiracion]   [datetime2](3) NOT NULL,      -- UTC = emision + JWT_REFRESH_TTL (7d); vigencia y predicado de la purga
        [revocado]           [bit] NOT NULL CONSTRAINT [DF_RefreshTokens_Revocado] DEFAULT (0),
        [fecha_revocado]     [datetime2](3) NULL,          -- UTC; null mientras el token esta vigente
        [reemplazado_por]    [int] NULL,                    -- FK auto-referencial: fila del token que lo rota (null = punta de la cadena)
        [motivo_revocacion]  [varchar](30) NULL,            -- valores esperados: logout, rotado, reuso_detectado, expirado (etiqueta de auditoria)
        CONSTRAINT [PK_RefreshTokens] PRIMARY KEY CLUSTERED ([id_refresh_token] ASC),
        CONSTRAINT [UQ_RefreshTokens_TokenHash] UNIQUE ([token_hash]),
        CONSTRAINT [CK_RefreshTokens_Expiracion] CHECK ([fecha_expiracion] > [fecha_emision]),
        CONSTRAINT [CK_RefreshTokens_Revocado] CHECK (
            ([revocado] = 0 AND [fecha_revocado] IS NULL AND [motivo_revocacion] IS NULL)
            OR ([revocado] = 1 AND [fecha_revocado] IS NOT NULL)
        )
    )
END
GO

/* -------------------------------------------------------------------------------------
   2) FK a Usuarios (dueno del token). Aditiva: referencia Usuarios(id_usuario) SIN
      modificarla. Sin ON DELETE CASCADE (estilo del esquema; Usuarios usa baja logica
      via el campo estado, no DELETE fisico).
   ------------------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_RefreshTokens_Usuario')
BEGIN
    ALTER TABLE [dbo].[RefreshTokens] WITH CHECK ADD CONSTRAINT [FK_RefreshTokens_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuarios] ([id_usuario])
    ALTER TABLE [dbo].[RefreshTokens] CHECK CONSTRAINT [FK_RefreshTokens_Usuario]
END
GO

/* -------------------------------------------------------------------------------------
   3) FK auto-referencial (cadena de rotacion). Sin CASCADE (SQL Server no permite
      CASCADE en auto-referencias; ademas se preserva la cadena para auditoria).
   ------------------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_RefreshTokens_Reemplazo')
BEGIN
    ALTER TABLE [dbo].[RefreshTokens] WITH CHECK ADD CONSTRAINT [FK_RefreshTokens_Reemplazo] FOREIGN KEY([reemplazado_por]) REFERENCES [dbo].[RefreshTokens] ([id_refresh_token])
    ALTER TABLE [dbo].[RefreshTokens] CHECK CONSTRAINT [FK_RefreshTokens_Reemplazo]
END
GO

/* -------------------------------------------------------------------------------------
   4) Indices por patron de acceso real (cada uno IF NOT EXISTS).
      Nota: el lookup por token_hash (P1: /refresh y /logout) YA lo provee el indice
      unico no clustered del UNIQUE UQ_RefreshTokens_TokenHash; crear otro indice sobre
      token_hash seria REDUNDANTE, por eso NO se crea.
   ------------------------------------------------------------------------------------- */

-- P2: rotacion y deteccion de reuso (revocar la familia: UPDATE ... WHERE id_familia = @fam)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RefreshTokens_Familia' AND object_id = OBJECT_ID('dbo.RefreshTokens'))
    CREATE NONCLUSTERED INDEX [IX_RefreshTokens_Familia] ON [dbo].[RefreshTokens] ([id_familia] ASC)
GO

-- P3: revocacion masiva por usuario (baneo o forzar relogin) y soporte de la FK a Usuarios
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RefreshTokens_Usuario' AND object_id = OBJECT_ID('dbo.RefreshTokens'))
    CREATE NONCLUSTERED INDEX [IX_RefreshTokens_Usuario] ON [dbo].[RefreshTokens] ([id_usuario] ASC)
GO

-- P4: purga de expirados (seek de rango: WHERE fecha_expiracion < @ahora)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RefreshTokens_Expiracion' AND object_id = OBJECT_ID('dbo.RefreshTokens'))
    CREATE NONCLUSTERED INDEX [IX_RefreshTokens_Expiracion] ON [dbo].[RefreshTokens] ([fecha_expiracion] ASC)
GO

PRINT 'Migracion v3 (RefreshTokens) aplicada correctamente.'
GO

/* =====================================================================================
   ============================  ROLLBACK - NO EJECUTAR  ===============================
   =====================================================================================
   Bloque COMENTADO a proposito. NO se ejecuta con este script; es un artefacto de
   reversion manual (roll-back / DROP inverso).

   Para revertir la migracion v3: copie el bloque de abajo a una ventana nueva,
   descomentelo y ejecutelo de forma consciente.

   EFECTO: elimina la tabla RefreshTokens y TODO el estado de sesion de refresh.
           Todas las sesiones de refresh se pierden y los usuarios deben
           re-autenticarse (el access token en memoria sigue valido hasta unos 15 min).
           NO afecta ninguna tabla existente (Usuarios, Bitacora, etc. quedan intactas).
           RefreshTokens es estado de sesion efimero, no datos de dominio: no hay
           perdida de datos de negocio.

   Orden inverso al roll-forward: indices, luego FKs, luego la tabla. Idempotente (IF EXISTS).

   -------------------------------------------------------------------------------------

   USE [VINKAPLANT_DB]
   GO
   IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RefreshTokens_Expiracion' AND object_id = OBJECT_ID('dbo.RefreshTokens'))
       DROP INDEX [IX_RefreshTokens_Expiracion] ON [dbo].[RefreshTokens]
   GO
   IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RefreshTokens_Usuario' AND object_id = OBJECT_ID('dbo.RefreshTokens'))
       DROP INDEX [IX_RefreshTokens_Usuario] ON [dbo].[RefreshTokens]
   GO
   IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RefreshTokens_Familia' AND object_id = OBJECT_ID('dbo.RefreshTokens'))
       DROP INDEX [IX_RefreshTokens_Familia] ON [dbo].[RefreshTokens]
   GO
   IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_RefreshTokens_Reemplazo')
       ALTER TABLE [dbo].[RefreshTokens] DROP CONSTRAINT [FK_RefreshTokens_Reemplazo]
   GO
   IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_RefreshTokens_Usuario')
       ALTER TABLE [dbo].[RefreshTokens] DROP CONSTRAINT [FK_RefreshTokens_Usuario]
   GO
   IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'RefreshTokens' AND schema_id = SCHEMA_ID('dbo'))
       DROP TABLE [dbo].[RefreshTokens]
   GO
   PRINT 'Rollback v3 (RefreshTokens) aplicado. Tabla eliminada; nada existente afectado.'
   GO

   ===================================================================================== */
