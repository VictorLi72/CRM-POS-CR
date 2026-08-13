-- Esquema de base de datos: CRM/POS para supermercado (Costa Rica)
-- IVA: tarifas vigentes en CR: 13 (general), 4, 2, 1, 0 (exento/canasta básica)

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT NOT NULL UNIQUE,
  contrasena_hash TEXT NOT NULL,
  nombre_completo TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('administrador', 'supervisor', 'cajero')),
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_barras TEXT UNIQUE,
  nombre TEXT NOT NULL,
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  precio_costo REAL NOT NULL DEFAULT 0,
  precio_venta REAL NOT NULL DEFAULT 0,
  tarifa_iva REAL NOT NULL DEFAULT 13,
  codigo_cabys TEXT,
  unidad_medida TEXT NOT NULL DEFAULT 'unidad',
  existencia REAL NOT NULL DEFAULT 0,
  existencia_minima REAL NOT NULL DEFAULT 5,
  acceso_rapido INTEGER NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  identificacion TEXT UNIQUE,
  telefono TEXT,
  correo TEXT,
  direccion TEXT,
  limite_credito REAL NOT NULL DEFAULT 0,
  saldo_credito REAL NOT NULL DEFAULT 0,
  puntos_lealtad INTEGER NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folio INTEGER NOT NULL UNIQUE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  subtotal REAL NOT NULL,
  descuento_total REAL NOT NULL DEFAULT 0,
  iva_total REAL NOT NULL,
  total REAL NOT NULL,
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'sinpe', 'fiado')),
  monto_recibido REAL,
  vuelto REAL,
  estado TEXT NOT NULL DEFAULT 'completada' CHECK (estado IN ('completada', 'anulada')),
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ventas_creado_en ON ventas(creado_en);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id);

CREATE TABLE IF NOT EXISTS detalle_ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  producto_nombre TEXT NOT NULL,
  cantidad REAL NOT NULL,
  precio_unitario REAL NOT NULL,
  tarifa_iva REAL NOT NULL,
  descuento REAL NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL,
  monto_iva REAL NOT NULL,
  total REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_detalle_ventas_venta ON detalle_ventas(venta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_producto ON detalle_ventas(producto_id);

CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste', 'venta', 'anulacion')),
  cantidad REAL NOT NULL,
  referencia TEXT,
  usuario_id INTEGER REFERENCES usuarios(id),
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pagos_credito (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  venta_id INTEGER REFERENCES ventas(id),
  monto REAL NOT NULL,
  usuario_id INTEGER REFERENCES usuarios(id),
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS devoluciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER NOT NULL REFERENCES ventas(id),
  usuario_id INTEGER REFERENCES usuarios(id),
  motivo TEXT,
  total REAL NOT NULL,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS devolucion_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  devolucion_id INTEGER NOT NULL REFERENCES devoluciones(id) ON DELETE CASCADE,
  detalle_venta_id INTEGER NOT NULL REFERENCES detalle_ventas(id),
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  producto_nombre TEXT NOT NULL,
  cantidad REAL NOT NULL,
  precio_unitario REAL NOT NULL,
  total REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_devoluciones_venta ON devoluciones(venta_id);
CREATE INDEX IF NOT EXISTS idx_devolucion_items_detalle ON devolucion_items(detalle_venta_id);

CREATE TABLE IF NOT EXISTS turnos_caja (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  monto_apertura REAL NOT NULL DEFAULT 0,
  efectivo_contado REAL,
  efectivo_esperado REAL,
  diferencia REAL,
  notas TEXT,
  estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
  abierto_en TEXT NOT NULL DEFAULT (datetime('now')),
  cerrado_en TEXT
);

CREATE INDEX IF NOT EXISTS idx_turnos_caja_usuario ON turnos_caja(usuario_id);

-- Catálogo de tarifas de IVA disponibles para los productos (reemplaza la lista
-- fija que antes vivía solo en el código del frontend). No es llave foránea de
-- productos.tarifa_iva a propósito: ese campo sigue guardando el porcentaje
-- directamente, así que borrar/desactivar una tarifa acá no afecta productos
-- que ya la usan, solo dejan de ofrecerla para productos nuevos.
CREATE TABLE IF NOT EXISTS tarifas_iva (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  porcentaje REAL NOT NULL UNIQUE,
  nombre TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Descuentos con nombre que el cajero puede elegir en el POS en vez de escribir
-- el monto a mano (ej. "Empleado 10%"). "tipo" define si "valor" es un
-- porcentaje de la línea o un monto fijo en colones.
CREATE TABLE IF NOT EXISTS descuentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('porcentaje', 'monto')),
  valor REAL NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
