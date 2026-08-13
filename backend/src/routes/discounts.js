const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Cualquier usuario autenticado puede leer los descuentos activos (el POS los
// necesita para el selector de descuentos del carrito). Solo admin los administra.
router.get('/', (req, res) => {
  const { all } = req.query;
  const sql = all === 'true'
    ? 'SELECT * FROM descuentos ORDER BY nombre'
    : 'SELECT * FROM descuentos WHERE activo = 1 ORDER BY nombre';
  res.json(db.prepare(sql).all());
});

router.post('/', requireRole('administrador'), (req, res) => {
  const { nombre, tipo, valor } = req.body || {};
  if (!nombre || !['porcentaje', 'monto'].includes(tipo) || valor == null || valor < 0) {
    return res.status(400).json({ error: 'Nombre, tipo (porcentaje/monto) y valor son requeridos' });
  }
  if (tipo === 'porcentaje' && valor > 100) {
    return res.status(400).json({ error: 'Un descuento por porcentaje no puede superar 100' });
  }
  const info = db
    .prepare('INSERT INTO descuentos (nombre, tipo, valor) VALUES (?, ?, ?)')
    .run(nombre.trim(), tipo, valor);
  res.status(201).json(db.prepare('SELECT * FROM descuentos WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', requireRole('administrador'), (req, res) => {
  const existente = db.prepare('SELECT * FROM descuentos WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ error: 'Descuento no encontrado' });
  const { nombre, tipo, valor, activo } = req.body || {};
  if (tipo && !['porcentaje', 'monto'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo inválido' });
  }
  if (valor != null && valor < 0) {
    return res.status(400).json({ error: 'El valor no puede ser negativo' });
  }
  db.prepare('UPDATE descuentos SET nombre = ?, tipo = ?, valor = ?, activo = ? WHERE id = ?').run(
    nombre !== undefined ? nombre.trim() : existente.nombre,
    tipo ?? existente.tipo,
    valor ?? existente.valor,
    activo != null ? (activo ? 1 : 0) : existente.activo,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM descuentos WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireRole('administrador'), (req, res) => {
  db.prepare('UPDATE descuentos SET activo = 0 WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
