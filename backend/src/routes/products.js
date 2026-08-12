const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// --- Categorías ---
router.get('/categories', (req, res) => {
  res.json(db.prepare('SELECT * FROM categorias ORDER BY nombre').all());
});

router.post('/categories', requireRole('administrador', 'supervisor'), (req, res) => {
  const { nombre } = req.body || {};
  if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });
  try {
    const info = db.prepare('INSERT INTO categorias (nombre) VALUES (?)').run(nombre.trim());
    res.status(201).json({ id: info.lastInsertRowid, nombre: nombre.trim() });
  } catch (err) {
    res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
  }
});

router.delete('/categories/:id', requireRole('administrador'), (req, res) => {
  db.prepare('DELETE FROM categorias WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// --- Productos ---
router.get('/', (req, res) => {
  const { search, lowStock, categoryId, quickAccess } = req.query;
  let sql = `
    SELECT p.*, c.nombre AS categoria_nombre
    FROM productos p
    LEFT JOIN categorias c ON c.id = p.categoria_id
    WHERE p.activo = 1
  `;
  const params = [];
  if (search) {
    sql += ' AND (p.nombre LIKE ? OR p.codigo_barras LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (categoryId) {
    sql += ' AND p.categoria_id = ?';
    params.push(categoryId);
  }
  if (lowStock === 'true') {
    sql += ' AND p.existencia <= p.existencia_minima';
  }
  if (quickAccess === 'true') {
    sql += ' AND p.acceso_rapido = 1';
  }
  sql += ' ORDER BY p.nombre';
  res.json(db.prepare(sql).all(...params));
});

router.get('/barcode/:barcode', (req, res) => {
  const producto = db
    .prepare('SELECT * FROM productos WHERE codigo_barras = ? AND activo = 1')
    .get(req.params.barcode);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(producto);
});

router.get('/:id', (req, res) => {
  const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(producto);
});

router.post('/', requireRole('administrador', 'supervisor'), (req, res) => {
  const b = req.body || {};
  if (!b.nombre || b.precio_venta == null) {
    return res.status(400).json({ error: 'Nombre y precio de venta son requeridos' });
  }
  try {
    const info = db
      .prepare(
        `INSERT INTO productos (codigo_barras, nombre, categoria_id, precio_costo, precio_venta, tarifa_iva, codigo_cabys, unidad_medida, existencia, existencia_minima, acceso_rapido)
         VALUES (@codigo_barras, @nombre, @categoria_id, @precio_costo, @precio_venta, @tarifa_iva, @codigo_cabys, @unidad_medida, @existencia, @existencia_minima, @acceso_rapido)`
      )
      .run({
        codigo_barras: b.codigo_barras || null,
        nombre: b.nombre.trim(),
        categoria_id: b.categoria_id || null,
        precio_costo: b.precio_costo || 0,
        precio_venta: b.precio_venta,
        tarifa_iva: b.tarifa_iva ?? 13,
        codigo_cabys: b.codigo_cabys || null,
        unidad_medida: b.unidad_medida || 'unidad',
        existencia: b.existencia || 0,
        existencia_minima: b.existencia_minima ?? 5,
        acceso_rapido: b.acceso_rapido ? 1 : 0,
      });
    const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(producto);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear el producto (código de barras duplicado?)' });
  }
});

router.put('/:id', requireRole('administrador', 'supervisor'), (req, res) => {
  const b = req.body || {};
  const existente = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ error: 'Producto no encontrado' });
  try {
    db.prepare(
      `UPDATE productos SET
        codigo_barras = @codigo_barras, nombre = @nombre, categoria_id = @categoria_id,
        precio_costo = @precio_costo, precio_venta = @precio_venta, tarifa_iva = @tarifa_iva,
        codigo_cabys = @codigo_cabys, unidad_medida = @unidad_medida, existencia_minima = @existencia_minima,
        acceso_rapido = @acceso_rapido,
        actualizado_en = datetime('now')
       WHERE id = @id`
    ).run({
      id: req.params.id,
      codigo_barras: b.codigo_barras ?? existente.codigo_barras,
      nombre: b.nombre ?? existente.nombre,
      categoria_id: b.categoria_id ?? existente.categoria_id,
      precio_costo: b.precio_costo ?? existente.precio_costo,
      precio_venta: b.precio_venta ?? existente.precio_venta,
      tarifa_iva: b.tarifa_iva ?? existente.tarifa_iva,
      codigo_cabys: b.codigo_cabys ?? existente.codigo_cabys,
      unidad_medida: b.unidad_medida ?? existente.unidad_medida,
      existencia_minima: b.existencia_minima ?? existente.existencia_minima,
      acceso_rapido: b.acceso_rapido != null ? (b.acceso_rapido ? 1 : 0) : existente.acceso_rapido,
    });
    res.json(db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(400).json({ error: 'No se pudo actualizar el producto' });
  }
});

router.delete('/:id', requireRole('administrador'), (req, res) => {
  db.prepare('UPDATE productos SET activo = 0 WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// --- Ajuste manual de inventario (entrada/salida/ajuste) ---
router.post('/:id/stock', requireRole('administrador', 'supervisor'), (req, res) => {
  const { tipo, cantidad, referencia } = req.body || {};
  if (!['entrada', 'salida', 'ajuste'].includes(tipo) || cantidad == null) {
    return res.status(400).json({ error: 'Tipo y cantidad son requeridos' });
  }
  const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  const delta = tipo === 'salida' ? -Math.abs(cantidad) : Math.abs(cantidad);
  const nuevaExistencia = tipo === 'ajuste' ? cantidad : producto.existencia + delta;

  const tx = db.transaction(() => {
    db.prepare("UPDATE productos SET existencia = ?, actualizado_en = datetime('now') WHERE id = ?").run(
      nuevaExistencia,
      req.params.id
    );
    db.prepare(
      `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, referencia, usuario_id)
       VALUES (?, ?, ?, ?, ?)`
    ).run(req.params.id, tipo, tipo === 'ajuste' ? nuevaExistencia - producto.existencia : delta, referencia || null, req.user.id);
  });
  tx();

  res.json(db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id));
});

router.get('/:id/movements', (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT m.*, u.nombre_completo AS usuario_nombre
         FROM movimientos_inventario m LEFT JOIN usuarios u ON u.id = m.usuario_id
         WHERE m.producto_id = ? ORDER BY m.creado_en DESC LIMIT 100`
      )
      .all(req.params.id)
  );
});

module.exports = router;
