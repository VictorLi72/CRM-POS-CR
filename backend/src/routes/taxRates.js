const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Cualquier usuario autenticado puede leer las tarifas (las necesita el modal
// de producto en Inventario y el filtro por IVA). Solo admin las administra.
router.get('/', (req, res) => {
  const { all } = req.query;
  const sql = all === 'true'
    ? 'SELECT * FROM tarifas_iva ORDER BY porcentaje'
    : 'SELECT * FROM tarifas_iva WHERE activo = 1 ORDER BY porcentaje';
  res.json(db.prepare(sql).all());
});

router.post('/', requireRole('administrador'), (req, res) => {
  const { porcentaje, nombre } = req.body || {};
  if (porcentaje == null || porcentaje < 0 || porcentaje > 100) {
    return res.status(400).json({ error: 'El porcentaje debe estar entre 0 y 100' });
  }
  try {
    const info = db
      .prepare('INSERT INTO tarifas_iva (porcentaje, nombre) VALUES (?, ?)')
      .run(porcentaje, nombre || null);
    res.status(201).json(db.prepare('SELECT * FROM tarifas_iva WHERE id = ?').get(info.lastInsertRowid));
  } catch (err) {
    res.status(400).json({ error: 'Ya existe una tarifa con ese porcentaje' });
  }
});

router.put('/:id', requireRole('administrador'), (req, res) => {
  const existente = db.prepare('SELECT * FROM tarifas_iva WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ error: 'Tarifa no encontrada' });
  const { porcentaje, nombre, activo } = req.body || {};
  if (porcentaje != null && (porcentaje < 0 || porcentaje > 100)) {
    return res.status(400).json({ error: 'El porcentaje debe estar entre 0 y 100' });
  }
  try {
    db.prepare('UPDATE tarifas_iva SET porcentaje = ?, nombre = ?, activo = ? WHERE id = ?').run(
      porcentaje ?? existente.porcentaje,
      nombre !== undefined ? nombre : existente.nombre,
      activo != null ? (activo ? 1 : 0) : existente.activo,
      req.params.id
    );
    res.json(db.prepare('SELECT * FROM tarifas_iva WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(400).json({ error: 'Ya existe una tarifa con ese porcentaje' });
  }
});

router.delete('/:id', requireRole('administrador'), (req, res) => {
  db.prepare('UPDATE tarifas_iva SET activo = 0 WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
