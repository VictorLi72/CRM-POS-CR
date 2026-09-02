-- ============================================================================
-- CRM Super CR — Esquema MySQL (POS/CRM para supermercado, Costa Rica)
-- ============================================================================
-- Script de referencia: crea la base, todas las tablas, llaves foráneas e
-- índices que usa el backend Java (Spring Boot + JPA/Hibernate). No hace
-- falta correrlo a mano: con `spring.jpa.hibernate.ddl-auto=update` (ver
-- application.yml) Hibernate crea/ajusta el esquema solo en el primer
-- arranque. Se deja este script como documentación versionada del esquema y
-- como opción para quien prefiera crear la base explícitamente antes de
-- levantar el backend.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS crm_super_pos
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE crm_super_pos;

-- ----------------------------------------------------------------------------
-- usuarios
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario           VARCHAR(100) NOT NULL,
  contrasena_hash   VARCHAR(255) NOT NULL,
  nombre_completo   VARCHAR(255) NOT NULL,
  rol               VARCHAR(20)  NOT NULL,
  activo            TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_usuarios_usuario UNIQUE (usuario),
  CONSTRAINT chk_usuarios_rol CHECK (rol IN ('administrador', 'supervisor', 'cajero'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- categorias
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id      BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(255) NOT NULL,
  CONSTRAINT uq_categorias_nombre UNIQUE (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- productos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  codigo_barras       VARCHAR(255),
  nombre              VARCHAR(255) NOT NULL,
  categoria_id        BIGINT,
  precio_costo        DECIMAL(12,2) NOT NULL DEFAULT 0,
  precio_venta        DECIMAL(12,2) NOT NULL DEFAULT 0,
  tarifa_iva          DECIMAL(5,2)  NOT NULL DEFAULT 13,
  codigo_cabys        VARCHAR(255),
  unidad_medida       VARCHAR(255) NOT NULL DEFAULT 'unidad',
  existencia          DECIMAL(12,3) NOT NULL DEFAULT 0,
  existencia_minima   DECIMAL(12,3) NOT NULL DEFAULT 5,
  acceso_rapido       TINYINT(1) NOT NULL DEFAULT 0,
  activo              TINYINT(1) NOT NULL DEFAULT 1,
  creado_en           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_productos_codigo_barras UNIQUE (codigo_barras),
  CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_productos_nombre ON productos(nombre);

-- ----------------------------------------------------------------------------
-- clientes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(255) NOT NULL,
  identificacion   VARCHAR(255),
  telefono         VARCHAR(255),
  correo           VARCHAR(255),
  direccion        VARCHAR(255),
  limite_credito   DECIMAL(12,2) NOT NULL DEFAULT 0,
  saldo_credito    DECIMAL(12,2) NOT NULL DEFAULT 0,
  puntos_lealtad   INT NOT NULL DEFAULT 0,
  activo           TINYINT(1) NOT NULL DEFAULT 1,
  creado_en        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_clientes_identificacion UNIQUE (identificacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ventas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ventas (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  folio             BIGINT NOT NULL,
  usuario_id        BIGINT NOT NULL,
  cliente_id        BIGINT,
  subtotal          DECIMAL(12,2) NOT NULL,
  descuento_total   DECIMAL(12,2) NOT NULL DEFAULT 0,
  iva_total         DECIMAL(12,2) NOT NULL,
  total             DECIMAL(12,2) NOT NULL,
  metodo_pago       VARCHAR(20) NOT NULL,
  monto_recibido    DECIMAL(12,2),
  vuelto            DECIMAL(12,2),
  estado            VARCHAR(20) NOT NULL DEFAULT 'completada',
  creado_en         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_ventas_folio UNIQUE (folio),
  CONSTRAINT fk_ventas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT fk_ventas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  CONSTRAINT chk_ventas_metodo_pago CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'sinpe', 'fiado')),
  CONSTRAINT chk_ventas_estado CHECK (estado IN ('completada', 'anulada'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ventas_creado_en ON ventas(creado_en);
CREATE INDEX idx_ventas_cliente ON ventas(cliente_id);

-- ----------------------------------------------------------------------------
-- detalle_ventas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_ventas (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  venta_id          BIGINT NOT NULL,
  producto_id       BIGINT NOT NULL,
  producto_nombre   VARCHAR(255) NOT NULL,
  cantidad          DECIMAL(12,3) NOT NULL,
  precio_unitario   DECIMAL(12,2) NOT NULL,
  tarifa_iva        DECIMAL(5,2) NOT NULL,
  descuento         DECIMAL(12,2) NOT NULL DEFAULT 0,
  subtotal          DECIMAL(12,2) NOT NULL,
  monto_iva         DECIMAL(12,2) NOT NULL,
  total             DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_detalle_ventas_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_ventas_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_detalle_ventas_venta ON detalle_ventas(venta_id);
CREATE INDEX idx_detalle_ventas_producto ON detalle_ventas(producto_id);

-- ----------------------------------------------------------------------------
-- movimientos_inventario
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  producto_id   BIGINT NOT NULL,
  tipo          VARCHAR(20) NOT NULL,
  cantidad      DECIMAL(12,3) NOT NULL,
  referencia    VARCHAR(255),
  usuario_id    BIGINT,
  creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_movimientos_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
  CONSTRAINT fk_movimientos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT chk_movimientos_tipo CHECK (tipo IN ('entrada', 'salida', 'ajuste', 'venta', 'anulacion'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- pagos_credito
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos_credito (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  cliente_id   BIGINT NOT NULL,
  venta_id     BIGINT,
  monto        DECIMAL(12,2) NOT NULL,
  usuario_id   BIGINT,
  creado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pagos_credito_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  CONSTRAINT fk_pagos_credito_venta FOREIGN KEY (venta_id) REFERENCES ventas(id),
  CONSTRAINT fk_pagos_credito_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- devoluciones
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS devoluciones (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  venta_id     BIGINT NOT NULL,
  usuario_id   BIGINT,
  motivo       VARCHAR(255),
  total        DECIMAL(12,2) NOT NULL,
  creado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_devoluciones_venta FOREIGN KEY (venta_id) REFERENCES ventas(id),
  CONSTRAINT fk_devoluciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_devoluciones_venta ON devoluciones(venta_id);

-- ----------------------------------------------------------------------------
-- devolucion_items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS devolucion_items (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  devolucion_id       BIGINT NOT NULL,
  detalle_venta_id    BIGINT NOT NULL,
  producto_id         BIGINT NOT NULL,
  producto_nombre     VARCHAR(255) NOT NULL,
  cantidad            DECIMAL(12,3) NOT NULL,
  precio_unitario     DECIMAL(12,2) NOT NULL,
  total               DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_devolucion_items_devolucion FOREIGN KEY (devolucion_id) REFERENCES devoluciones(id) ON DELETE CASCADE,
  CONSTRAINT fk_devolucion_items_detalle FOREIGN KEY (detalle_venta_id) REFERENCES detalle_ventas(id),
  CONSTRAINT fk_devolucion_items_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_devolucion_items_detalle ON devolucion_items(detalle_venta_id);

-- ----------------------------------------------------------------------------
-- turnos_caja (apertura/cierre de caja, arqueo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS turnos_caja (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id          BIGINT NOT NULL,
  monto_apertura      DECIMAL(12,2) NOT NULL DEFAULT 0,
  efectivo_contado    DECIMAL(12,2),
  efectivo_esperado   DECIMAL(12,2),
  diferencia          DECIMAL(12,2),
  notas               VARCHAR(255),
  estado              VARCHAR(20) NOT NULL DEFAULT 'abierto',
  abierto_en          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cerrado_en          DATETIME,
  CONSTRAINT fk_turnos_caja_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT chk_turnos_caja_estado CHECK (estado IN ('abierto', 'cerrado'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_turnos_caja_usuario ON turnos_caja(usuario_id);

-- ----------------------------------------------------------------------------
-- tarifas_iva (catálogo de tarifas de IVA disponibles para productos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tarifas_iva (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  porcentaje   DECIMAL(5,2) NOT NULL,
  nombre       VARCHAR(255),
  activo       TINYINT(1) NOT NULL DEFAULT 1,
  creado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_tarifas_iva_porcentaje UNIQUE (porcentaje)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- descuentos (descuentos con nombre que el cajero elige en el POS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS descuentos (
  id        BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(255) NOT NULL,
  tipo      VARCHAR(20) NOT NULL,
  valor     DECIMAL(12,2) NOT NULL,
  activo    TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_descuentos_tipo CHECK (tipo IN ('porcentaje', 'monto'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- folio_counter (contador atómico del folio consecutivo de ventas; se
-- bloquea con SELECT ... FOR UPDATE dentro de la transacción de venta para
-- que varias cajas creando ventas al mismo tiempo no repitan folio)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS folio_counter (
  id             BIGINT PRIMARY KEY,
  ultimo_folio   BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO folio_counter (id, ultimo_folio)
SELECT 1, 0 WHERE NOT EXISTS (SELECT 1 FROM folio_counter WHERE id = 1);

-- ----------------------------------------------------------------------------
-- bitacora (auditoría de acciones de negocio: quién hizo qué y cuándo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bitacora (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id       BIGINT,
  usuario_nombre   VARCHAR(255),
  accion           VARCHAR(30) NOT NULL,
  entidad          VARCHAR(50) NOT NULL,
  entidad_id       BIGINT,
  detalle          TEXT,
  creado_en        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bitacora_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_bitacora_creado_en ON bitacora(creado_en);
CREATE INDEX idx_bitacora_usuario ON bitacora(usuario_id);
