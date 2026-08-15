USE [master]
GO
/****** Object:  Database [VINKAPLANT_DB]    Script actualizado con modulo VinkaGuard ******/
IF DB_ID(N'VINKAPLANT_DB') IS NOT NULL
BEGIN
    ALTER DATABASE [VINKAPLANT_DB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE
    DROP DATABASE [VINKAPLANT_DB]
END
GO
CREATE DATABASE [VINKAPLANT_DB]
GO
ALTER DATABASE [VINKAPLANT_DB] SET COMPATIBILITY_LEVEL = 160
GO
USE [VINKAPLANT_DB]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* ===================================================================
   TABLAS ORIGINALES (sistema de gestion documental / pedidos)
   =================================================================== */

CREATE TABLE [dbo].[Roles](
    [id_rol] [int] IDENTITY(1,1) NOT NULL,
    [nombre] [varchar](50) NOT NULL,
    CONSTRAINT [PK_Roles] PRIMARY KEY CLUSTERED ([id_rol] ASC)
)
GO

CREATE TABLE [dbo].[Usuarios](
    [id_usuario] [int] IDENTITY(1,1) NOT NULL,
    [nombre] [varchar](100) NOT NULL,
    [correo] [varchar](100) NOT NULL,
    [password] [varchar](255) NOT NULL,
    [id_rol] [int] NOT NULL,
    [estado] [varchar](20) NOT NULL,
    CONSTRAINT [PK_Usuarios] PRIMARY KEY CLUSTERED ([id_usuario] ASC)
)
GO

CREATE TABLE [dbo].[Clientes](
    [id_cliente] [int] IDENTITY(1,1) NOT NULL,
    [nombre] [varchar](150) NOT NULL,
    [pais] [varchar](100) NULL,
    [correo] [varchar](100) NULL,
    [telefono] [varchar](30) NULL,
    [estado] [varchar](20) NOT NULL,
    CONSTRAINT [PK_Clientes] PRIMARY KEY CLUSTERED ([id_cliente] ASC)
)
GO

CREATE TABLE [dbo].[Productos](
    [id_producto] [int] IDENTITY(1,1) NOT NULL,
    [nombre_producto] [varchar](150) NOT NULL,
    [descripcion] [varchar](255) NULL,
    [estado] [varchar](20) NOT NULL,
    CONSTRAINT [PK_Productos] PRIMARY KEY CLUSTERED ([id_producto] ASC)
)
GO

CREATE TABLE [dbo].[Pedidos](
    [id_pedido] [int] IDENTITY(1,1) NOT NULL,
    [id_cliente] [int] NOT NULL,
    [id_usuario] [int] NOT NULL,
    [fecha] [date] NOT NULL,
    [estado] [varchar](30) NOT NULL,
    CONSTRAINT [PK_Pedidos] PRIMARY KEY CLUSTERED ([id_pedido] ASC)
)
GO

CREATE TABLE [dbo].[DetallePedido](
    [id_detalle] [int] IDENTITY(1,1) NOT NULL,
    [id_pedido] [int] NOT NULL,
    [id_producto] [int] NOT NULL,
    [cantidad] [int] NOT NULL,
    [precio_unitario] [decimal](12, 2) NOT NULL,
    [subtotal] AS (CONVERT([decimal](14,2), [cantidad] * [precio_unitario])) PERSISTED,
    CONSTRAINT [PK_DetallePedido] PRIMARY KEY CLUSTERED ([id_detalle] ASC)
)
GO

CREATE TABLE [dbo].[Plataformas](
    [id_plataforma] [int] IDENTITY(1,1) NOT NULL,
    [nombre] [varchar](50) NOT NULL,
    CONSTRAINT [PK_Plataformas] PRIMARY KEY CLUSTERED ([id_plataforma] ASC)
)
GO

CREATE TABLE [dbo].[TiposDocumento](
    [id_tipo] [int] IDENTITY(1,1) NOT NULL,
    [nombre] [varchar](100) NOT NULL,
    CONSTRAINT [PK_TiposDocumento] PRIMARY KEY CLUSTERED ([id_tipo] ASC)
)
GO

CREATE TABLE [dbo].[Documentos](
    [id_documento] [int] IDENTITY(1,1) NOT NULL,
    [id_pedido] [int] NOT NULL,
    [id_tipo] [int] NOT NULL,
    [id_plataforma] [int] NOT NULL,
    [nombre_archivo] [varchar](255) NOT NULL,
    [ruta_archivo] [varchar](255) NULL,
    [fecha_subida] [datetime] NULL,
    [id_usuario] [int] NOT NULL,
    CONSTRAINT [PK_Documentos] PRIMARY KEY CLUSTERED ([id_documento] ASC)
)
GO

CREATE TABLE [dbo].[Bitacora](
    [id_bitacora] [int] IDENTITY(1,1) NOT NULL,
    [id_usuario] [int] NOT NULL,
    [accion] [varchar](255) NOT NULL,
    [fecha] [datetime] NULL,
    CONSTRAINT [PK_Bitacora] PRIMARY KEY CLUSTERED ([id_bitacora] ASC)
)
GO

/* ===================================================================
   TABLAS NUEVAS - Modulo VinkaGuard (seguridad de la informacion)
   Basadas en Modelo ER Mejorado
   =================================================================== */

-- Pantalla 1 (Accesos): reutiliza Usuarios + Plataformas, agregando
-- nivel de privilegio y ultima revision de acceso.
CREATE TABLE [dbo].[AccesosPlataforma](
    [id_acceso] [int] IDENTITY(1,1) NOT NULL,
    [id_usuario] [int] NOT NULL,
    [id_plataforma] [int] NOT NULL,
    [rol_acceso] [varchar](100) NOT NULL,
    [fecha_alta] [date] NOT NULL,
    [fecha_ultima_revision] [date] NULL,
    [estado] [varchar](20) NOT NULL CONSTRAINT [DF_AccesosPlataforma_Estado] DEFAULT ('Vigente'),
    CONSTRAINT [PK_AccesosPlataforma] PRIMARY KEY CLUSTERED ([id_acceso] ASC)
)
GO

-- Pantalla 2 (Dispositivos)
CREATE TABLE [dbo].[Dispositivos](
    [id_dispositivo] [int] IDENTITY(1,1) NOT NULL,
    [id_usuario] [int] NOT NULL,
    [codigo_equipo] [varchar](30) NOT NULL,
    [tipo_dispositivo] [varchar](50) NOT NULL,
    [sistema_operativo] [varchar](100) NULL,
    [antivirus_activo] [bit] NOT NULL CONSTRAINT [DF_Dispositivos_Antivirus] DEFAULT (0),
    [fecha_ultima_actualizacion] [date] NULL,
    [tiene_ups] [bit] NOT NULL CONSTRAINT [DF_Dispositivos_Ups] DEFAULT (0),
    [estado_seguridad] [varchar](20) NOT NULL CONSTRAINT [DF_Dispositivos_Estado] DEFAULT ('No cumple'),
    CONSTRAINT [PK_Dispositivos] PRIMARY KEY CLUSTERED ([id_dispositivo] ASC),
    CONSTRAINT [UQ_Dispositivos_Codigo] UNIQUE ([codigo_equipo])
)
GO

-- Pantalla 3 (Riesgos)
CREATE TABLE [dbo].[Riesgos](
    [id_riesgo] [int] IDENTITY(1,1) NOT NULL,
    [sistema] [varchar](50) NOT NULL,
    [categoria] [varchar](30) NOT NULL,
    [descripcion] [varchar](255) NOT NULL,
    [probabilidad] [int] NOT NULL,
    [impacto] [int] NOT NULL,
    [control_mitigante] [varchar](255) NULL,
    [fecha_registro] [datetime] NULL CONSTRAINT [DF_Riesgos_Fecha] DEFAULT (getdate()),
    CONSTRAINT [PK_Riesgos] PRIMARY KEY CLUSTERED ([id_riesgo] ASC),
    CONSTRAINT [CK_Riesgos_Probabilidad] CHECK ([probabilidad] BETWEEN 1 AND 5),
    CONSTRAINT [CK_Riesgos_Impacto] CHECK ([impacto] BETWEEN 1 AND 5)
)
GO

-- Pantalla 4 (Incidentes): caidas/fallas de plataformas externas
CREATE TABLE [dbo].[Incidentes](
    [id_incidente] [int] IDENTITY(1,1) NOT NULL,
    [id_plataforma] [int] NOT NULL,
    [id_usuario_responsable] [int] NOT NULL,
    [titulo] [varchar](150) NOT NULL,
    [fecha_inicio] [datetime] NOT NULL,
    [fecha_resolucion] [datetime] NULL,
    [procedimiento_alterno] [varchar](500) NULL,
    [estado] [varchar](20) NOT NULL CONSTRAINT [DF_Incidentes_Estado] DEFAULT ('Abierto'),
    CONSTRAINT [PK_Incidentes] PRIMARY KEY CLUSTERED ([id_incidente] ASC)
)
GO

-- Pantalla 5 (Proveedores)
CREATE TABLE [dbo].[ProveedorTecnologico](
    [id_proveedor] [int] IDENTITY(1,1) NOT NULL,
    [nombre_proveedor] [varchar](150) NOT NULL,
    [tipo_servicio] [varchar](150) NULL,
    [estado_contrato] [varchar](20) NOT NULL CONSTRAINT [DF_ProveedorTecnologico_Estado] DEFAULT ('Activo'),
    CONSTRAINT [PK_ProveedorTecnologico] PRIMARY KEY CLUSTERED ([id_proveedor] ASC)
)
GO

CREATE TABLE [dbo].[EvaluacionSeguridad](
    [id_evaluacion] [int] IDENTITY(1,1) NOT NULL,
    [id_proveedor] [int] NOT NULL,
    [fecha_evaluacion] [date] NOT NULL,
    [cifrado_datos] [bit] NOT NULL CONSTRAINT [DF_EvaluacionSeguridad_Cifrado] DEFAULT (0),
    [mfa_disponible] [bit] NOT NULL CONSTRAINT [DF_EvaluacionSeguridad_Mfa] DEFAULT (0),
    [sla_definido] [bit] NOT NULL CONSTRAINT [DF_EvaluacionSeguridad_Sla] DEFAULT (0),
    [certificaciones_vigentes] [bit] NOT NULL CONSTRAINT [DF_EvaluacionSeguridad_Cert] DEFAULT (0),
    [puntaje_total] [int] NOT NULL,
    [resultado] [varchar](20) NOT NULL,
    [nivel_riesgo] [varchar](20) NOT NULL,
    CONSTRAINT [PK_EvaluacionSeguridad] PRIMARY KEY CLUSTERED ([id_evaluacion] ASC),
    CONSTRAINT [CK_EvaluacionSeguridad_Puntaje] CHECK ([puntaje_total] BETWEEN 0 AND 100)
)
GO

CREATE TABLE [dbo].[PlanContingencia](
    [id_plan] [int] IDENTITY(1,1) NOT NULL,
    [id_proveedor] [int] NOT NULL,
    [escenario] [varchar](255) NOT NULL,
    [procedimiento_alterno] [varchar](500) NOT NULL,
    [responsable] [varchar](100) NULL,
    [fecha_actualizacion] [date] NULL,
    CONSTRAINT [PK_PlanContingencia] PRIMARY KEY CLUSTERED ([id_plan] ASC)
)
GO

/* ===================================================================
   DEFAULTS Y FOREIGN KEYS - tablas originales
   =================================================================== */
ALTER TABLE [dbo].[Bitacora] ADD DEFAULT (getdate()) FOR [fecha]
GO
ALTER TABLE [dbo].[Clientes] ADD CONSTRAINT [DF_Clientes_Estado] DEFAULT ('Activo') FOR [estado]
GO
ALTER TABLE [dbo].[Documentos] ADD DEFAULT (getdate()) FOR [fecha_subida]
GO
ALTER TABLE [dbo].[Pedidos] ADD DEFAULT (getdate()) FOR [fecha]
GO
ALTER TABLE [dbo].[Pedidos] ADD DEFAULT ('Pendiente') FOR [estado]
GO
ALTER TABLE [dbo].[Productos] ADD CONSTRAINT [DF_Productos_Estado] DEFAULT ('Activo') FOR [estado]
GO
ALTER TABLE [dbo].[Usuarios] ADD DEFAULT ('Activo') FOR [estado]
GO

ALTER TABLE [dbo].[Productos] ADD CONSTRAINT [UQ_Productos_Nombre] UNIQUE ([nombre_producto])
GO
ALTER TABLE [dbo].[Usuarios] ADD CONSTRAINT [UQ_Usuarios_Correo] UNIQUE ([correo])
GO
ALTER TABLE [dbo].[Plataformas] ADD CONSTRAINT [UQ_Plataformas_Nombre] UNIQUE ([nombre])
GO
ALTER TABLE [dbo].[TiposDocumento] ADD CONSTRAINT [UQ_TiposDocumento_Nombre] UNIQUE ([nombre])
GO

ALTER TABLE [dbo].[Bitacora] WITH CHECK ADD CONSTRAINT [FK_Bitacora_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuarios] ([id_usuario])
GO
ALTER TABLE [dbo].[Bitacora] CHECK CONSTRAINT [FK_Bitacora_Usuario]
GO
ALTER TABLE [dbo].[DetallePedido] WITH CHECK ADD CONSTRAINT [FK_DetallePedido_Pedido] FOREIGN KEY([id_pedido]) REFERENCES [dbo].[Pedidos] ([id_pedido])
GO
ALTER TABLE [dbo].[DetallePedido] CHECK CONSTRAINT [FK_DetallePedido_Pedido]
GO
ALTER TABLE [dbo].[DetallePedido] WITH CHECK ADD CONSTRAINT [FK_DetallePedido_Producto] FOREIGN KEY([id_producto]) REFERENCES [dbo].[Productos] ([id_producto])
GO
ALTER TABLE [dbo].[DetallePedido] CHECK CONSTRAINT [FK_DetallePedido_Producto]
GO
ALTER TABLE [dbo].[Documentos] WITH CHECK ADD CONSTRAINT [FK_Documento_Pedido] FOREIGN KEY([id_pedido]) REFERENCES [dbo].[Pedidos] ([id_pedido])
GO
ALTER TABLE [dbo].[Documentos] CHECK CONSTRAINT [FK_Documento_Pedido]
GO
ALTER TABLE [dbo].[Documentos] WITH CHECK ADD CONSTRAINT [FK_Documento_Plataforma] FOREIGN KEY([id_plataforma]) REFERENCES [dbo].[Plataformas] ([id_plataforma])
GO
ALTER TABLE [dbo].[Documentos] CHECK CONSTRAINT [FK_Documento_Plataforma]
GO
ALTER TABLE [dbo].[Documentos] WITH CHECK ADD CONSTRAINT [FK_Documento_Tipo] FOREIGN KEY([id_tipo]) REFERENCES [dbo].[TiposDocumento] ([id_tipo])
GO
ALTER TABLE [dbo].[Documentos] CHECK CONSTRAINT [FK_Documento_Tipo]
GO
ALTER TABLE [dbo].[Documentos] WITH CHECK ADD CONSTRAINT [FK_Documento_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuarios] ([id_usuario])
GO
ALTER TABLE [dbo].[Documentos] CHECK CONSTRAINT [FK_Documento_Usuario]
GO
ALTER TABLE [dbo].[Pedidos] WITH CHECK ADD CONSTRAINT [FK_Pedido_Cliente] FOREIGN KEY([id_cliente]) REFERENCES [dbo].[Clientes] ([id_cliente])
GO
ALTER TABLE [dbo].[Pedidos] CHECK CONSTRAINT [FK_Pedido_Cliente]
GO
ALTER TABLE [dbo].[Pedidos] WITH CHECK ADD CONSTRAINT [FK_Pedido_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuarios] ([id_usuario])
GO
ALTER TABLE [dbo].[Pedidos] CHECK CONSTRAINT [FK_Pedido_Usuario]
GO
ALTER TABLE [dbo].[Usuarios] WITH CHECK ADD CONSTRAINT [FK_Usuarios_Roles] FOREIGN KEY([id_rol]) REFERENCES [dbo].[Roles] ([id_rol])
GO
ALTER TABLE [dbo].[Usuarios] CHECK CONSTRAINT [FK_Usuarios_Roles]
GO
ALTER TABLE [dbo].[DetallePedido] WITH CHECK ADD CONSTRAINT [CK_DetallePedido_Cantidad] CHECK (([cantidad] > (0)))
GO
ALTER TABLE [dbo].[DetallePedido] CHECK CONSTRAINT [CK_DetallePedido_Cantidad]
GO
ALTER TABLE [dbo].[DetallePedido] WITH CHECK ADD CONSTRAINT [CK_DetallePedido_Precio] CHECK (([precio_unitario] >= (0)))
GO
ALTER TABLE [dbo].[DetallePedido] CHECK CONSTRAINT [CK_DetallePedido_Precio]
GO

/* ===================================================================
   FOREIGN KEYS - tablas nuevas
   =================================================================== */
ALTER TABLE [dbo].[AccesosPlataforma] WITH CHECK ADD CONSTRAINT [FK_Acceso_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuarios] ([id_usuario])
GO
ALTER TABLE [dbo].[AccesosPlataforma] CHECK CONSTRAINT [FK_Acceso_Usuario]
GO
ALTER TABLE [dbo].[AccesosPlataforma] WITH CHECK ADD CONSTRAINT [FK_Acceso_Plataforma] FOREIGN KEY([id_plataforma]) REFERENCES [dbo].[Plataformas] ([id_plataforma])
GO
ALTER TABLE [dbo].[AccesosPlataforma] CHECK CONSTRAINT [FK_Acceso_Plataforma]
GO

ALTER TABLE [dbo].[Dispositivos] WITH CHECK ADD CONSTRAINT [FK_Dispositivo_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuarios] ([id_usuario])
GO
ALTER TABLE [dbo].[Dispositivos] CHECK CONSTRAINT [FK_Dispositivo_Usuario]
GO

ALTER TABLE [dbo].[Incidentes] WITH CHECK ADD CONSTRAINT [FK_Incidente_Plataforma] FOREIGN KEY([id_plataforma]) REFERENCES [dbo].[Plataformas] ([id_plataforma])
GO
ALTER TABLE [dbo].[Incidentes] CHECK CONSTRAINT [FK_Incidente_Plataforma]
GO
ALTER TABLE [dbo].[Incidentes] WITH CHECK ADD CONSTRAINT [FK_Incidente_Usuario] FOREIGN KEY([id_usuario_responsable]) REFERENCES [dbo].[Usuarios] ([id_usuario])
GO
ALTER TABLE [dbo].[Incidentes] CHECK CONSTRAINT [FK_Incidente_Usuario]
GO

ALTER TABLE [dbo].[EvaluacionSeguridad] WITH CHECK ADD CONSTRAINT [FK_Evaluacion_Proveedor] FOREIGN KEY([id_proveedor]) REFERENCES [dbo].[ProveedorTecnologico] ([id_proveedor])
GO
ALTER TABLE [dbo].[EvaluacionSeguridad] CHECK CONSTRAINT [FK_Evaluacion_Proveedor]
GO

ALTER TABLE [dbo].[PlanContingencia] WITH CHECK ADD CONSTRAINT [FK_Plan_Proveedor] FOREIGN KEY([id_proveedor]) REFERENCES [dbo].[ProveedorTecnologico] ([id_proveedor])
GO
ALTER TABLE [dbo].[PlanContingencia] CHECK CONSTRAINT [FK_Plan_Proveedor]
GO

/* ===================================================================
   DATOS SEMILLA
   =================================================================== */
SET IDENTITY_INSERT [dbo].[Roles] ON
INSERT [dbo].[Roles] ([id_rol], [nombre]) VALUES (1, N'Administrador')
INSERT [dbo].[Roles] ([id_rol], [nombre]) VALUES (2, N'Operador')
INSERT [dbo].[Roles] ([id_rol], [nombre]) VALUES (3, N'Auditor')
SET IDENTITY_INSERT [dbo].[Roles] OFF
GO

SET IDENTITY_INSERT [dbo].[Usuarios] ON
/* admin@vinkaplant.com / admin12345* */
INSERT [dbo].[Usuarios] ([id_usuario], [nombre], [correo], [password], [id_rol], [estado])
VALUES (1, N'Administrador', N'admin@vinkaplant.com', N'$2b$10$jgFzxiM6T3dy2lelMy6TGeDrD4wWy2Ovby50T1fIaf8DiehXKmNsS', 1, N'Activo')
INSERT [dbo].[Usuarios] ([id_usuario], [nombre], [correo], [password], [id_rol], [estado])
VALUES (2, N'Jennifer Vega', N'jvega@vinkaplant.com', N'$2b$10$jgFzxiM6T3dy2lelMy6TGeDrD4wWy2Ovby50T1fIaf8DiehXKmNsS', 2, N'Activo')
INSERT [dbo].[Usuarios] ([id_usuario], [nombre], [correo], [password], [id_rol], [estado])
VALUES (3, N'Jose P. Quiros', N'jquiros@vinkaplant.com', N'$2b$10$jgFzxiM6T3dy2lelMy6TGeDrD4wWy2Ovby50T1fIaf8DiehXKmNsS', 2, N'Activo')
INSERT [dbo].[Usuarios] ([id_usuario], [nombre], [correo], [password], [id_rol], [estado])
VALUES (4, N'Santiago Vindas', N'svindas@vinkaplant.com', N'$2b$10$jgFzxiM6T3dy2lelMy6TGeDrD4wWy2Ovby50T1fIaf8DiehXKmNsS', 1, N'Activo')
SET IDENTITY_INSERT [dbo].[Usuarios] OFF
GO

SET IDENTITY_INSERT [dbo].[Clientes] ON
INSERT [dbo].[Clientes] ([id_cliente], [nombre], [pais], [correo], [telefono], [estado]) VALUES (2, N'Pacific Plants Inc.', N'Estados Unidos', N'orders@pacificplants.com', N'+1 305 555 2200', N'Inactivo')
INSERT [dbo].[Clientes] ([id_cliente], [nombre], [pais], [correo], [telefono], [estado]) VALUES (3, N'Asia Botanical Trading', N'Japon', N'sales@asiabotanical.jp', N'+81 3 5555 3301', N'Activo')
SET IDENTITY_INSERT [dbo].[Clientes] OFF
GO

SET IDENTITY_INSERT [dbo].[Productos] ON
INSERT [dbo].[Productos] ([id_producto], [nombre_producto], [descripcion], [estado]) VALUES (1, N'Dracaena Marginata', N'Planta ornamental', N'Activo')
INSERT [dbo].[Productos] ([id_producto], [nombre_producto], [descripcion], [estado]) VALUES (2, N'Yucca Elephantipes', N'Planta ornamental', N'Activo')
INSERT [dbo].[Productos] ([id_producto], [nombre_producto], [descripcion], [estado]) VALUES (3, N'Sansevieria', N'Planta ornamental', N'Activo')
INSERT [dbo].[Productos] ([id_producto], [nombre_producto], [descripcion], [estado]) VALUES (4, N'Croton Petra', N'Planta ornamental', N'Activo')
SET IDENTITY_INSERT [dbo].[Productos] OFF
GO

SET IDENTITY_INSERT [dbo].[Pedidos] ON
INSERT [dbo].[Pedidos] ([id_pedido], [id_cliente], [id_usuario], [fecha], [estado]) VALUES (3, 2, 1, CAST(N'2026-07-16' AS Date), N'En proceso')
INSERT [dbo].[Pedidos] ([id_pedido], [id_cliente], [id_usuario], [fecha], [estado]) VALUES (4, 3, 1, CAST(N'2026-07-16' AS Date), N'Completado')
INSERT [dbo].[Pedidos] ([id_pedido], [id_cliente], [id_usuario], [fecha], [estado]) VALUES (5, 3, 1, CAST(N'2026-07-17' AS Date), N'Cancelado')
SET IDENTITY_INSERT [dbo].[Pedidos] OFF
GO

SET IDENTITY_INSERT [dbo].[DetallePedido] ON
INSERT [dbo].[DetallePedido] ([id_detalle], [id_pedido], [id_producto], [cantidad], [precio_unitario]) VALUES (1, 5, 4, 70, CAST(10.00 AS Decimal(12,2)))
INSERT [dbo].[DetallePedido] ([id_detalle], [id_pedido], [id_producto], [cantidad], [precio_unitario]) VALUES (2, 5, 1, 100, CAST(90.00 AS Decimal(12,2)))
SET IDENTITY_INSERT [dbo].[DetallePedido] OFF
GO

SET IDENTITY_INSERT [dbo].[Plataformas] ON
INSERT [dbo].[Plataformas] ([id_plataforma], [nombre]) VALUES (1, N'VUCE')
INSERT [dbo].[Plataformas] ([id_plataforma], [nombre]) VALUES (2, N'Integrama')
INSERT [dbo].[Plataformas] ([id_plataforma], [nombre]) VALUES (3, N'Manual')
SET IDENTITY_INSERT [dbo].[Plataformas] OFF
GO

SET IDENTITY_INSERT [dbo].[TiposDocumento] ON
INSERT [dbo].[TiposDocumento] ([id_tipo], [nombre]) VALUES (1, N'Factura')
INSERT [dbo].[TiposDocumento] ([id_tipo], [nombre]) VALUES (2, N'Packing List')
INSERT [dbo].[TiposDocumento] ([id_tipo], [nombre]) VALUES (3, N'Certificado Fitosanitario')
INSERT [dbo].[TiposDocumento] ([id_tipo], [nombre]) VALUES (4, N'DUA')
INSERT [dbo].[TiposDocumento] ([id_tipo], [nombre]) VALUES (5, N'Otro')
SET IDENTITY_INSERT [dbo].[TiposDocumento] OFF
GO

SET IDENTITY_INSERT [dbo].[Bitacora] ON
INSERT [dbo].[Bitacora] ([id_bitacora], [id_usuario], [accion], [fecha]) VALUES (1, 1, N'Inicio de sesion exitoso', CAST(N'2026-07-16T20:57:49.873' AS DateTime))
SET IDENTITY_INSERT [dbo].[Bitacora] OFF
GO

-- Pantalla 1: Accesos
SET IDENTITY_INSERT [dbo].[AccesosPlataforma] ON
INSERT [dbo].[AccesosPlataforma] ([id_acceso], [id_usuario], [id_plataforma], [rol_acceso], [fecha_alta], [fecha_ultima_revision], [estado]) VALUES (1, 2, 2, N'Edicion contable', '2023-02-01', '2026-05-01', N'Vigente')
INSERT [dbo].[AccesosPlataforma] ([id_acceso], [id_usuario], [id_plataforma], [rol_acceso], [fecha_alta], [fecha_ultima_revision], [estado]) VALUES (2, 3, 1, N'Tramitador exportacion', '2022-06-15', '2026-04-10', N'Revisar')
INSERT [dbo].[AccesosPlataforma] ([id_acceso], [id_usuario], [id_plataforma], [rol_acceso], [fecha_alta], [fecha_ultima_revision], [estado]) VALUES (3, 4, 2, N'Administrador', '2024-01-10', '2026-07-01', N'Vigente')
INSERT [dbo].[AccesosPlataforma] ([id_acceso], [id_usuario], [id_plataforma], [rol_acceso], [fecha_alta], [fecha_ultima_revision], [estado]) VALUES (4, 4, 1, N'Administrador', '2024-01-10', '2026-07-01', N'Vigente')
SET IDENTITY_INSERT [dbo].[AccesosPlataforma] OFF
GO

-- Pantalla 2: Dispositivos
SET IDENTITY_INSERT [dbo].[Dispositivos] ON
INSERT [dbo].[Dispositivos] ([id_dispositivo], [id_usuario], [codigo_equipo], [tipo_dispositivo], [sistema_operativo], [antivirus_activo], [fecha_ultima_actualizacion], [tiene_ups], [estado_seguridad]) VALUES (1, 2, N'EQ-CONT-01', N'Laptop', N'Windows 11 Pro', 1, '2026-06-20', 1, N'Cumple')
INSERT [dbo].[Dispositivos] ([id_dispositivo], [id_usuario], [codigo_equipo], [tipo_dispositivo], [sistema_operativo], [antivirus_activo], [fecha_ultima_actualizacion], [tiene_ups], [estado_seguridad]) VALUES (2, 3, N'EQ-LOG-02', N'Desktop', N'Windows 10 Pro', 0, '2025-11-05', 0, N'No cumple')
SET IDENTITY_INSERT [dbo].[Dispositivos] OFF
GO

-- Pantalla 3: Riesgos
SET IDENTITY_INSERT [dbo].[Riesgos] ON
INSERT [dbo].[Riesgos] ([id_riesgo], [sistema], [categoria], [descripcion], [probabilidad], [impacto], [control_mitigante]) VALUES (1, N'Integrama', N'Software', N'Caida no programada afecta registro contable', 3, 4, N'Plantilla temporal en hoja de calculo controlada')
INSERT [dbo].[Riesgos] ([id_riesgo], [sistema], [categoria], [descripcion], [probabilidad], [impacto], [control_mitigante]) VALUES (2, N'VUCE', N'Software', N'Lentitud o falla de acceso retrasa tramites', 3, 5, N'Procedimiento alterno + contacto directo con PROCOMER')
INSERT [dbo].[Riesgos] ([id_riesgo], [sistema], [categoria], [descripcion], [probabilidad], [impacto], [control_mitigante]) VALUES (3, N'Integrama', N'Humanware', N'Conocimiento de cierre contable concentrado en 1 persona', 2, 4, N'Capacitacion cruzada del area contable')
SET IDENTITY_INSERT [dbo].[Riesgos] OFF
GO

-- Pantalla 4: Incidentes
SET IDENTITY_INSERT [dbo].[Incidentes] ON
INSERT [dbo].[Incidentes] ([id_incidente], [id_plataforma], [id_usuario_responsable], [titulo], [fecha_inicio], [fecha_resolucion], [procedimiento_alterno], [estado]) VALUES (1, 1, 4, N'VUCE - sin acceso desde las 8:40 a.m.', '2026-07-14 08:40', NULL, N'Registro manual de tramites en plantilla de respaldo hasta restablecer conexion.', N'Abierto')
INSERT [dbo].[Incidentes] ([id_incidente], [id_plataforma], [id_usuario_responsable], [titulo], [fecha_inicio], [fecha_resolucion], [procedimiento_alterno], [estado]) VALUES (2, 2, 4, N'Integrama - mantenimiento no programado', '2026-06-02 14:10', '2026-06-02 16:45', N'Hoja de calculo temporal para facturacion, migrada al sistema al restablecerse el servicio.', N'Resuelto')
SET IDENTITY_INSERT [dbo].[Incidentes] OFF
GO

-- Pantalla 5: Proveedores
SET IDENTITY_INSERT [dbo].[ProveedorTecnologico] ON
INSERT [dbo].[ProveedorTecnologico] ([id_proveedor], [nombre_proveedor], [tipo_servicio], [estado_contrato]) VALUES (1, N'PROCOMER / VUCE', N'Ventanilla unica de comercio exterior', N'Activo')
INSERT [dbo].[ProveedorTecnologico] ([id_proveedor], [nombre_proveedor], [tipo_servicio], [estado_contrato]) VALUES (2, N'Softland Integrama', N'Sistema contable', N'Activo')
SET IDENTITY_INSERT [dbo].[ProveedorTecnologico] OFF
GO

SET IDENTITY_INSERT [dbo].[EvaluacionSeguridad] ON
INSERT [dbo].[EvaluacionSeguridad] ([id_evaluacion], [id_proveedor], [fecha_evaluacion], [cifrado_datos], [mfa_disponible], [sla_definido], [certificaciones_vigentes], [puntaje_total], [resultado], [nivel_riesgo]) VALUES (1, 1, '2026-07-01', 1, 1, 1, 0, 85, N'Aprobado', N'Bajo')
SET IDENTITY_INSERT [dbo].[EvaluacionSeguridad] OFF
GO

SET IDENTITY_INSERT [dbo].[PlanContingencia] ON
INSERT [dbo].[PlanContingencia] ([id_plan], [id_proveedor], [escenario], [procedimiento_alterno], [responsable], [fecha_actualizacion]) VALUES (1, 1, N'Caida total de VUCE', N'Contacto directo con PROCOMER y registro manual en plantilla de respaldo', N'Santiago Vindas', '2026-06-01')
SET IDENTITY_INSERT [dbo].[PlanContingencia] OFF
GO

PRINT 'Script VinkaGuard aplicado correctamente.'
GO
