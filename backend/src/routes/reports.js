const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('administrador', 'supervisor'));

// Las fechas se guardan en UTC (datetime('now') de SQLite), pero el negocio opera en
// hora de Costa Rica (UTC-6, sin horario de verano). Todas las consultas que agrupan o
// filtran por "día" desplazan creado_en -6 horas antes de extraer la fecha, para que
// "hoy" y los rangos de fecha coincidan con el reloj de Costa Rica y no con UTC (si no,
// el dashboard de "ventas de hoy" se vaciaría cada tarde a partir de las 6pm hora CR).
const CR_OFFSET = '-6 hours';

function hoyCR() {
  const desplazado = new Date(Date.now() - 6 * 60 * 60 * 1000);
  return desplazado.toISOString().slice(0, 10);
}

// Resumen general para el dashboard
router.get('/summary', (req, res) => {
  const hoy = hoyCR();

  const ventasHoy = db
    .prepare(
      `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS cantidad
       FROM ventas WHERE estado = 'completada' AND date(creado_en, ?) = ?`
    )
    .get(CR_OFFSET, hoy);

  const ventasMes = db
    .prepare(
      `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS cantidad
       FROM ventas WHERE estado = 'completada' AND strftime('%Y-%m', creado_en, ?) = strftime('%Y-%m', ?)`
    )
    .get(CR_OFFSET, hoy);

  const productosStockBajo = db
    .prepare('SELECT COUNT(*) AS cantidad FROM productos WHERE activo = 1 AND existencia <= existencia_minima')
    .get().cantidad;

  const fiadoPendienteTotal = db
    .prepare('SELECT COALESCE(SUM(saldo_credito), 0) AS total FROM clientes')
    .get().total;

  const productosTopHoy = db
    .prepare(
      `SELECT dv.producto_nombre, SUM(dv.cantidad) AS cantidad, SUM(dv.total) AS ingreso
       FROM detalle_ventas dv
       JOIN ventas v ON v.id = dv.venta_id
       WHERE v.estado = 'completada' AND date(v.creado_en, ?) = ?
       GROUP BY dv.producto_id ORDER BY ingreso DESC LIMIT 5`
    )
    .all(CR_OFFSET, hoy);

  res.json({
    ventas_hoy: ventasHoy,
    ventas_mes: ventasMes,
    productos_stock_bajo: productosStockBajo,
    fiado_pendiente_total: fiadoPendienteTotal,
    productos_top_hoy: productosTopHoy,
  });
});

// Ventas agrupadas por día (para gráfico de tendencia)
router.get('/sales-by-day', (req, res) => {
  const { from, to } = req.query;
  const params = [CR_OFFSET];
  let sql = `
    SELECT date(creado_en, ?) AS dia, SUM(total) AS total, COUNT(*) AS cantidad
    FROM ventas WHERE estado = 'completada'
  `;
  if (from) {
    sql += ' AND datetime(creado_en, ?) >= ?';
    params.push(CR_OFFSET, from);
  }
  if (to) {
    sql += ' AND datetime(creado_en, ?) <= ?';
    params.push(CR_OFFSET, to);
  }
  sql += ' GROUP BY dia ORDER BY dia';
  res.json(db.prepare(sql).all(...params));
});

router.get('/sales-by-product', (req, res) => {
  const { from, to, limit } = req.query;
  const params = [];
  let sql = `
    SELECT dv.producto_nombre, SUM(dv.cantidad) AS cantidad, SUM(dv.total) AS ingreso
    FROM detalle_ventas dv JOIN ventas v ON v.id = dv.venta_id
    WHERE v.estado = 'completada'
  `;
  if (from) {
    sql += ' AND datetime(v.creado_en, ?) >= ?';
    params.push(CR_OFFSET, from);
  }
  if (to) {
    sql += ' AND datetime(v.creado_en, ?) <= ?';
    params.push(CR_OFFSET, to);
  }
  sql += ' GROUP BY dv.producto_id ORDER BY ingreso DESC LIMIT ?';
  params.push(Number(limit) || 10);
  res.json(db.prepare(sql).all(...params));
});

router.get('/sales-by-category', (req, res) => {
  const { from, to } = req.query;
  const params = [];
  let sql = `
    SELECT COALESCE(c.nombre, 'Sin categoría') AS categoria, SUM(dv.total) AS ingreso, SUM(dv.cantidad) AS cantidad
    FROM detalle_ventas dv
    JOIN ventas v ON v.id = dv.venta_id
    JOIN productos p ON p.id = dv.producto_id
    LEFT JOIN categorias c ON c.id = p.categoria_id
    WHERE v.estado = 'completada'
  `;
  if (from) {
    sql += ' AND datetime(v.creado_en, ?) >= ?';
    params.push(CR_OFFSET, from);
  }
  if (to) {
    sql += ' AND datetime(v.creado_en, ?) <= ?';
    params.push(CR_OFFSET, to);
  }
  sql += ' GROUP BY categoria ORDER BY ingreso DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/sales-by-cashier', (req, res) => {
  const { from, to } = req.query;
  const params = [];
  let sql = `
    SELECT u.nombre_completo AS cajero_nombre, SUM(v.total) AS ingreso, COUNT(*) AS cantidad
    FROM ventas v JOIN usuarios u ON u.id = v.usuario_id
    WHERE v.estado = 'completada'
  `;
  if (from) {
    sql += ' AND datetime(v.creado_en, ?) >= ?';
    params.push(CR_OFFSET, from);
  }
  if (to) {
    sql += ' AND datetime(v.creado_en, ?) <= ?';
    params.push(CR_OFFSET, to);
  }
  sql += ' GROUP BY v.usuario_id ORDER BY ingreso DESC';
  res.json(db.prepare(sql).all(...params));
});

// Margen de ganancia por producto (precio venta vs costo, en ventas del periodo)
router.get('/profit', (req, res) => {
  const { from, to } = req.query;
  const params = [];
  let sql = `
    SELECT dv.producto_nombre,
           SUM(dv.cantidad) AS cantidad,
           SUM(dv.subtotal) AS ingreso_sin_iva,
           SUM(dv.cantidad * p.precio_costo) AS costo,
           SUM(dv.subtotal) - SUM(dv.cantidad * p.precio_costo) AS ganancia
    FROM detalle_ventas dv
    JOIN ventas v ON v.id = dv.venta_id
    JOIN productos p ON p.id = dv.producto_id
    WHERE v.estado = 'completada'
  `;
  if (from) {
    sql += ' AND datetime(v.creado_en, ?) >= ?';
    params.push(CR_OFFSET, from);
  }
  if (to) {
    sql += ' AND datetime(v.creado_en, ?) <= ?';
    params.push(CR_OFFSET, to);
  }
  sql += ' GROUP BY dv.producto_id ORDER BY ganancia DESC';
  res.json(db.prepare(sql).all(...params));
});

module.exports = router;
