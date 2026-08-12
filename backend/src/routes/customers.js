const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM clientes WHERE activo = 1';
  const params = [];
  if (search) {
    sql += ' AND (nombre LIKE ? OR identificacion LIKE ? OR telefono LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY nombre';
  res.json(db.prepare(sql).all(...params));
});

router.get('/:id', (req, res) => {
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(cliente);
});

router.get('/:id/sales', (req, res) => {
  const ventas = db
    .prepare(
      `SELECT v.*, u.nombre_completo AS cajero_nombre
       FROM ventas v LEFT JOIN usuarios u ON u.id = v.usuario_id
       WHERE v.cliente_id = ? ORDER BY v.creado_en DESC LIMIT 200`
    )
    .all(req.params.id);
  res.json(ventas);
});

router.get('/:id/payments', (req, res) => {
  res.json(
    db
      .prepare('SELECT * FROM pagos_credito WHERE cliente_id = ? ORDER BY creado_en DESC')
      .all(req.params.id)
  );
});

router.post('/', (req, res) => {
  const b = req.body || {};
  if (!b.nombre) return res.status(400).json({ error: 'El nombre es requerido' });
  try {
    const info = db
      .prepare(
        `INSERT INTO clientes (nombre, identificacion, telefono, correo, direccion, limite_credito)
         VALUES (@nombre, @identificacion, @telefono, @correo, @direccion, @limite_credito)`
      )
      .run({
        nombre: b.nombre.trim(),
        identificacion: b.identificacion || null,
        telefono: b.telefono || null,
        correo: b.correo || null,
        direccion: b.direccion || null,
        limite_credito: b.limite_credito || 0,
      });
    res.status(201).json(db.prepare('SELECT * FROM clientes WHERE id = ?').get(info.lastInsertRowid));
  } catch (err) {
    res.status(400).json({ error: 'Ya existe un cliente con esa identificación' });
  }
});

router.put('/:id', (req, res) => {
  const b = req.body || {};
  const existente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ error: 'Cliente no encontrado' });
  db.prepare(
    `UPDATE clientes SET nombre=@nombre, identificacion=@identificacion, telefono=@telefono,
     correo=@correo, direccion=@direccion, limite_credito=@limite_credito WHERE id=@id`
  ).run({
    id: req.params.id,
    nombre: b.nombre ?? existente.nombre,
    identificacion: b.identificacion ?? existente.identificacion,
    telefono: b.telefono ?? existente.telefono,
    correo: b.correo ?? existente.correo,
    direccion: b.direccion ?? existente.direccion,
    limite_credito: b.limite_credito ?? existente.limite_credito,
  });
  res.json(db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireRole('administrador'), (req, res) => {
  db.prepare('UPDATE clientes SET activo = 0 WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// Registrar abono a cuenta de fiado
router.post('/:id/payments', (req, res) => {
  const { monto } = req.body || {};
  if (!monto || monto <= 0) return res.status(400).json({ error: 'Monto inválido' });
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
  if (monto > cliente.saldo_credito) {
    return res.status(400).json({ error: 'El monto excede el saldo pendiente' });
  }

  const tx = db.transaction(() => {
    db.prepare('UPDATE clientes SET saldo_credito = saldo_credito - ? WHERE id = ?').run(
      monto,
      req.params.id
    );
    db.prepare(
      'INSERT INTO pagos_credito (cliente_id, monto, usuario_id) VALUES (?, ?, ?)'
    ).run(req.params.id, monto, req.user.id);
  });
  tx();

  res.status(201).json(db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id));
});

module.exports = router;
