const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function calcularResumen(usuarioId, desde, hasta) {
  const ventasEfectivo = db
    .prepare(
      `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS cantidad
       FROM ventas
       WHERE usuario_id = ? AND metodo_pago = 'efectivo' AND estado = 'completada'
         AND creado_en >= ? AND creado_en <= ?`
    )
    .get(usuarioId, desde, hasta);

  const ventasPorMetodo = db
    .prepare(
      `SELECT metodo_pago, COALESCE(SUM(total), 0) AS total, COUNT(*) AS cantidad
       FROM ventas
       WHERE usuario_id = ? AND estado = 'completada'
         AND creado_en >= ? AND creado_en <= ?
       GROUP BY metodo_pago`
    )
    .all(usuarioId, desde, hasta);

  const abonosFiado = db
    .prepare(
      `SELECT COALESCE(SUM(monto), 0) AS total
       FROM pagos_credito WHERE usuario_id = ? AND creado_en >= ? AND creado_en <= ?`
    )
    .get(usuarioId, desde, hasta).total;

  const devolucionesEfectivo = db
    .prepare(
      `SELECT COALESCE(SUM(d.total), 0) AS total
       FROM devoluciones d JOIN ventas v ON v.id = d.venta_id
       WHERE d.usuario_id = ? AND v.metodo_pago = 'efectivo'
         AND d.creado_en >= ? AND d.creado_en <= ?`
    )
    .get(usuarioId, desde, hasta).total;

  return {
    ventas_efectivo: ventasEfectivo.total,
    ventas_efectivo_cantidad: ventasEfectivo.cantidad,
    ventas_por_metodo: ventasPorMetodo,
    abonos_fiado: abonosFiado,
    devoluciones_efectivo: devolucionesEfectivo,
  };
}

// Turno abierto actualmente para el usuario logueado (o null)
router.get('/actual', (req, res) => {
  const turno = db
    .prepare(`SELECT * FROM turnos_caja WHERE usuario_id = ? AND estado = 'abierto' ORDER BY abierto_en DESC LIMIT 1`)
    .get(req.user.id);
  if (!turno) return res.json(null);
  const resumen = calcularResumen(req.user.id, turno.abierto_en, new Date().toISOString().replace('T', ' ').slice(0, 19));
  res.json({ ...turno, resumen });
});

router.post('/', (req, res) => {
  const yaAbierto = db
    .prepare(`SELECT * FROM turnos_caja WHERE usuario_id = ? AND estado = 'abierto'`)
    .get(req.user.id);
  if (yaAbierto) {
    return res.status(400).json({ error: 'Ya tenés un turno abierto, cerralo antes de abrir uno nuevo' });
  }
  const { monto_apertura } = req.body || {};
  const info = db
    .prepare('INSERT INTO turnos_caja (usuario_id, monto_apertura) VALUES (?, ?)')
    .run(req.user.id, monto_apertura || 0);
  res.status(201).json(db.prepare('SELECT * FROM turnos_caja WHERE id = ?').get(info.lastInsertRowid));
});

router.post('/:id/cerrar', (req, res) => {
  const turno = db.prepare('SELECT * FROM turnos_caja WHERE id = ?').get(req.params.id);
  if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });
  if (turno.usuario_id !== req.user.id && !['administrador', 'supervisor'].includes(req.user.rol)) {
    return res.status(403).json({ error: 'No puede cerrar el turno de otro usuario' });
  }
  if (turno.estado === 'cerrado') {
    return res.status(400).json({ error: 'El turno ya está cerrado' });
  }

  const { efectivo_contado, notas } = req.body || {};
  if (efectivo_contado == null) {
    return res.status(400).json({ error: 'Indicá el efectivo contado para cerrar el turno' });
  }

  const ahora = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const resumen = calcularResumen(turno.usuario_id, turno.abierto_en, ahora);
  const efectivoEsperado = round2(
    turno.monto_apertura + resumen.ventas_efectivo + resumen.abonos_fiado - resumen.devoluciones_efectivo
  );
  const diferencia = round2(efectivo_contado - efectivoEsperado);

  db.prepare(
    `UPDATE turnos_caja SET estado = 'cerrado', efectivo_contado = ?, efectivo_esperado = ?, diferencia = ?, notas = ?, cerrado_en = ?
     WHERE id = ?`
  ).run(efectivo_contado, efectivoEsperado, diferencia, notas || null, ahora, turno.id);

  res.json({ ...db.prepare('SELECT * FROM turnos_caja WHERE id = ?').get(turno.id), resumen });
});

// Historial de turnos (para reportes de arqueo)
router.get('/', requireRole('administrador', 'supervisor'), (req, res) => {
  const { usuarioId, from, to } = req.query;
  let sql = `
    SELECT t.*, u.nombre_completo AS usuario_nombre
    FROM turnos_caja t JOIN usuarios u ON u.id = t.usuario_id
    WHERE 1=1
  `;
  const params = [];
  if (usuarioId) {
    sql += ' AND t.usuario_id = ?';
    params.push(usuarioId);
  }
  if (from) {
    sql += ' AND t.abierto_en >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND t.abierto_en <= ?';
    params.push(to);
  }
  sql += ' ORDER BY t.abierto_en DESC LIMIT 200';
  res.json(db.prepare(sql).all(...params));
});

router.get('/:id', (req, res) => {
  const turno = db
    .prepare(
      `SELECT t.*, u.nombre_completo AS usuario_nombre FROM turnos_caja t JOIN usuarios u ON u.id = t.usuario_id WHERE t.id = ?`
    )
    .get(req.params.id);
  if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });
  const hasta = turno.cerrado_en || new Date().toISOString().replace('T', ' ').slice(0, 19);
  const resumen = calcularResumen(turno.usuario_id, turno.abierto_en, hasta);
  res.json({ ...turno, resumen });
});

module.exports = router;
