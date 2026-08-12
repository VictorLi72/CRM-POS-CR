const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function siguienteFolio() {
  const row = db.prepare('SELECT MAX(folio) AS maxFolio FROM ventas').get();
  return (row.maxFolio || 0) + 1;
}

// Crear venta (checkout del POS)
router.post('/', (req, res) => {
  const { items, cliente_id, metodo_pago, monto_recibido, descuento_total } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'La venta debe tener al menos un producto' });
  }
  if (!['efectivo', 'tarjeta', 'sinpe', 'fiado'].includes(metodo_pago)) {
    return res.status(400).json({ error: 'Método de pago inválido' });
  }
  if (metodo_pago === 'fiado' && !cliente_id) {
    return res.status(400).json({ error: 'Una venta fiada requiere seleccionar un cliente' });
  }

  try {
    const idVenta = db.transaction(() => {
      let subtotal = 0;
      let ivaTotal = 0;
      const itemsPreparados = [];

      for (const it of items) {
        const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(it.producto_id);
        if (!producto) throw new Error(`Producto ${it.producto_id} no encontrado`);
        if (producto.existencia < it.cantidad) {
          throw new Error(`Stock insuficiente para "${producto.nombre}" (disponible: ${producto.existencia})`);
        }
        const precioUnitario = it.precio_unitario ?? producto.precio_venta;
        const descuentoLinea = it.descuento || 0;
        const baseLinea = precioUnitario * it.cantidad - descuentoLinea;
        // Precio de venta incluye IVA (práctica común en tiquetes de super en CR)
        const tarifaIva = producto.tarifa_iva;
        const baseLineaSinIva = baseLinea / (1 + tarifaIva / 100);
        const ivaLinea = baseLinea - baseLineaSinIva;

        subtotal += baseLineaSinIva;
        ivaTotal += ivaLinea;

        itemsPreparados.push({
          producto,
          cantidad: it.cantidad,
          precio_unitario: precioUnitario,
          tarifa_iva: tarifaIva,
          descuento: descuentoLinea,
          subtotal: round2(baseLineaSinIva),
          monto_iva: round2(ivaLinea),
          total: round2(baseLinea),
        });
      }

      subtotal = round2(subtotal);
      ivaTotal = round2(ivaTotal);
      const descuento = round2(descuento_total || 0);
      const total = round2(subtotal + ivaTotal - descuento);

      if (metodo_pago === 'fiado') {
        const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(cliente_id);
        if (!cliente) throw new Error('Cliente no encontrado');
        const nuevoSaldo = cliente.saldo_credito + total;
        if (cliente.limite_credito > 0 && nuevoSaldo > cliente.limite_credito) {
          throw new Error('La venta supera el límite de crédito del cliente');
        }
      }

      const folio = siguienteFolio();
      const infoVenta = db
        .prepare(
          `INSERT INTO ventas (folio, usuario_id, cliente_id, subtotal, descuento_total, iva_total, total, metodo_pago, monto_recibido, vuelto)
           VALUES (@folio, @usuario_id, @cliente_id, @subtotal, @descuento_total, @iva_total, @total, @metodo_pago, @monto_recibido, @vuelto)`
        )
        .run({
          folio,
          usuario_id: req.user.id,
          cliente_id: cliente_id || null,
          subtotal,
          descuento_total: descuento,
          iva_total: ivaTotal,
          total,
          metodo_pago,
          monto_recibido: metodo_pago === 'efectivo' ? monto_recibido || total : null,
          vuelto: metodo_pago === 'efectivo' ? round2((monto_recibido || total) - total) : null,
        });

      const ventaId = infoVenta.lastInsertRowid;

      const insertarItem = db.prepare(
        `INSERT INTO detalle_ventas (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, tarifa_iva, descuento, subtotal, monto_iva, total)
         VALUES (@venta_id, @producto_id, @producto_nombre, @cantidad, @precio_unitario, @tarifa_iva, @descuento, @subtotal, @monto_iva, @total)`
      );
      const actualizarExistencia = db.prepare(
        "UPDATE productos SET existencia = existencia - ?, actualizado_en = datetime('now') WHERE id = ?"
      );
      const insertarMovimiento = db.prepare(
        `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, referencia, usuario_id) VALUES (?, 'venta', ?, ?, ?)`
      );

      for (const pi of itemsPreparados) {
        insertarItem.run({
          venta_id: ventaId,
          producto_id: pi.producto.id,
          producto_nombre: pi.producto.nombre,
          cantidad: pi.cantidad,
          precio_unitario: pi.precio_unitario,
          tarifa_iva: pi.tarifa_iva,
          descuento: pi.descuento,
          subtotal: pi.subtotal,
          monto_iva: pi.monto_iva,
          total: pi.total,
        });
        actualizarExistencia.run(pi.cantidad, pi.producto.id);
        insertarMovimiento.run(pi.producto.id, -pi.cantidad, `Venta #${folio}`, req.user.id);
      }

      if (metodo_pago === 'fiado') {
        db.prepare('UPDATE clientes SET saldo_credito = saldo_credito + ? WHERE id = ?').run(
          total,
          cliente_id
        );
      } else if (cliente_id) {
        // acumular puntos de lealtad: 1 punto por cada ₡1000 en compras
        const puntos = Math.floor(total / 1000);
        if (puntos > 0) {
          db.prepare('UPDATE clientes SET puntos_lealtad = puntos_lealtad + ? WHERE id = ?').run(
            puntos,
            cliente_id
          );
        }
      }

      return ventaId;
    })();

    const venta = db.prepare('SELECT * FROM ventas WHERE id = ?').get(idVenta);
    const itemsVenta = db.prepare('SELECT * FROM detalle_ventas WHERE venta_id = ?').all(idVenta);
    res.status(201).json({ ...venta, items: itemsVenta });
  } catch (err) {
    res.status(400).json({ error: err.message || 'No se pudo procesar la venta' });
  }
});

router.get('/', (req, res) => {
  const { from, to, userId, status } = req.query;
  let sql = `
    SELECT v.*, u.nombre_completo AS cajero_nombre, c.nombre AS cliente_nombre
    FROM ventas v
    LEFT JOIN usuarios u ON u.id = v.usuario_id
    LEFT JOIN clientes c ON c.id = v.cliente_id
    WHERE 1=1
  `;
  const params = [];
  if (from) {
    sql += ' AND v.creado_en >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND v.creado_en <= ?';
    params.push(to);
  }
  if (userId) {
    sql += ' AND v.usuario_id = ?';
    params.push(userId);
  }
  if (status) {
    sql += ' AND v.estado = ?';
    params.push(status);
  }
  sql += ' ORDER BY v.creado_en DESC LIMIT 500';
  res.json(db.prepare(sql).all(...params));
});

// Buscar venta por número de folio (el que aparece impreso en el tiquete)
router.get('/by-folio/:folio', (req, res) => {
  const venta = db
    .prepare(
      `SELECT v.*, u.nombre_completo AS cajero_nombre, c.nombre AS cliente_nombre
       FROM ventas v LEFT JOIN usuarios u ON u.id = v.usuario_id LEFT JOIN clientes c ON c.id = v.cliente_id
       WHERE v.folio = ?`
    )
    .get(req.params.folio);
  if (!venta) return res.status(404).json({ error: 'No existe una venta con ese folio' });
  const items = db.prepare('SELECT * FROM detalle_ventas WHERE venta_id = ?').all(venta.id);
  const devueltoPorItem = db
    .prepare(
      `SELECT detalle_venta_id, COALESCE(SUM(cantidad), 0) AS cantidad_devuelta
       FROM devolucion_items WHERE detalle_venta_id IN (SELECT id FROM detalle_ventas WHERE venta_id = ?)
       GROUP BY detalle_venta_id`
    )
    .all(venta.id);
  const devueltoMap = Object.fromEntries(devueltoPorItem.map((d) => [d.detalle_venta_id, d.cantidad_devuelta]));
  res.json({
    ...venta,
    items: items.map((it) => ({ ...it, cantidad_devuelta: devueltoMap[it.id] || 0 })),
  });
});

router.get('/:id', (req, res) => {
  const venta = db
    .prepare(
      `SELECT v.*, u.nombre_completo AS cajero_nombre, c.nombre AS cliente_nombre
       FROM ventas v LEFT JOIN usuarios u ON u.id = v.usuario_id LEFT JOIN clientes c ON c.id = v.cliente_id
       WHERE v.id = ?`
    )
    .get(req.params.id);
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
  const items = db.prepare('SELECT * FROM detalle_ventas WHERE venta_id = ?').all(req.params.id);
  res.json({ ...venta, items });
});

// Anular venta (revierte stock y saldo de fiado si aplica)
router.post('/:id/cancel', requireRole('administrador', 'supervisor'), (req, res) => {
  const venta = db.prepare('SELECT * FROM ventas WHERE id = ?').get(req.params.id);
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
  if (venta.estado === 'anulada') return res.status(400).json({ error: 'La venta ya está anulada' });

  db.transaction(() => {
    const items = db.prepare('SELECT * FROM detalle_ventas WHERE venta_id = ?').all(venta.id);
    const actualizarExistencia = db.prepare(
      "UPDATE productos SET existencia = existencia + ?, actualizado_en = datetime('now') WHERE id = ?"
    );
    const insertarMovimiento = db.prepare(
      `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, referencia, usuario_id) VALUES (?, 'anulacion', ?, ?, ?)`
    );
    for (const it of items) {
      actualizarExistencia.run(it.cantidad, it.producto_id);
      insertarMovimiento.run(it.producto_id, it.cantidad, `Anulación venta #${venta.folio}`, req.user.id);
    }
    if (venta.metodo_pago === 'fiado' && venta.cliente_id) {
      db.prepare('UPDATE clientes SET saldo_credito = saldo_credito - ? WHERE id = ?').run(
        venta.total,
        venta.cliente_id
      );
    }
    db.prepare("UPDATE ventas SET estado = 'anulada' WHERE id = ?").run(venta.id);
  })();

  res.json(db.prepare('SELECT * FROM ventas WHERE id = ?').get(venta.id));
});

// Registrar devolución parcial o total de una venta (no anula la venta original)
router.post('/:id/devolucion', requireRole('administrador', 'supervisor'), (req, res) => {
  const { items, motivo } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'La devolución debe tener al menos un producto' });
  }

  const venta = db.prepare('SELECT * FROM ventas WHERE id = ?').get(req.params.id);
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
  if (venta.estado === 'anulada') {
    return res.status(400).json({ error: 'No se puede devolver una venta anulada' });
  }

  try {
    const idDevolucion = db.transaction(() => {
      let total = 0;
      const itemsPreparados = [];

      for (const it of items) {
        if (!it.cantidad || it.cantidad <= 0) continue;
        const detalle = db
          .prepare('SELECT * FROM detalle_ventas WHERE id = ? AND venta_id = ?')
          .get(it.detalle_venta_id, venta.id);
        if (!detalle) throw new Error(`El detalle ${it.detalle_venta_id} no pertenece a esta venta`);

        const yaDevuelto = db
          .prepare('SELECT COALESCE(SUM(cantidad), 0) AS total FROM devolucion_items WHERE detalle_venta_id = ?')
          .get(detalle.id).total;
        const disponibleParaDevolver = detalle.cantidad - yaDevuelto;
        if (it.cantidad > disponibleParaDevolver + 1e-9) {
          throw new Error(
            `No se puede devolver ${it.cantidad} de "${detalle.producto_nombre}" (ya disponible para devolver: ${disponibleParaDevolver})`
          );
        }

        // Monto proporcional al precio efectivo de la línea (incluye descuento e IVA ya aplicados)
        const totalLinea = round2((detalle.total / detalle.cantidad) * it.cantidad);
        total += totalLinea;

        itemsPreparados.push({
          detalle_venta_id: detalle.id,
          producto_id: detalle.producto_id,
          producto_nombre: detalle.producto_nombre,
          cantidad: it.cantidad,
          precio_unitario: detalle.precio_unitario,
          total: totalLinea,
        });
      }

      if (itemsPreparados.length === 0) {
        throw new Error('No hay cantidades válidas para devolver');
      }

      total = round2(total);

      const infoDevolucion = db
        .prepare(
          `INSERT INTO devoluciones (venta_id, usuario_id, motivo, total) VALUES (?, ?, ?, ?)`
        )
        .run(venta.id, req.user.id, motivo || null, total);
      const devolucionId = infoDevolucion.lastInsertRowid;

      const insertarItem = db.prepare(
        `INSERT INTO devolucion_items (devolucion_id, detalle_venta_id, producto_id, producto_nombre, cantidad, precio_unitario, total)
         VALUES (@devolucion_id, @detalle_venta_id, @producto_id, @producto_nombre, @cantidad, @precio_unitario, @total)`
      );
      const actualizarExistencia = db.prepare(
        "UPDATE productos SET existencia = existencia + ?, actualizado_en = datetime('now') WHERE id = ?"
      );
      const insertarMovimiento = db.prepare(
        `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, referencia, usuario_id) VALUES (?, 'entrada', ?, ?, ?)`
      );

      for (const pi of itemsPreparados) {
        insertarItem.run({ ...pi, devolucion_id: devolucionId });
        actualizarExistencia.run(pi.cantidad, pi.producto_id);
        insertarMovimiento.run(pi.producto_id, pi.cantidad, `Devolución venta #${venta.folio}`, req.user.id);
      }

      if (venta.metodo_pago === 'fiado' && venta.cliente_id) {
        db.prepare('UPDATE clientes SET saldo_credito = saldo_credito - ? WHERE id = ?').run(
          total,
          venta.cliente_id
        );
      }

      return devolucionId;
    })();

    const devolucion = db.prepare('SELECT * FROM devoluciones WHERE id = ?').get(idDevolucion);
    const devolucionItems = db.prepare('SELECT * FROM devolucion_items WHERE devolucion_id = ?').all(idDevolucion);
    res.status(201).json({ ...devolucion, items: devolucionItems });
  } catch (err) {
    res.status(400).json({ error: err.message || 'No se pudo procesar la devolución' });
  }
});

router.get('/:id/devoluciones', (req, res) => {
  const devoluciones = db
    .prepare(
      `SELECT d.*, u.nombre_completo AS usuario_nombre
       FROM devoluciones d LEFT JOIN usuarios u ON u.id = d.usuario_id
       WHERE d.venta_id = ? ORDER BY d.creado_en DESC`
    )
    .all(req.params.id);
  const conItems = devoluciones.map((d) => ({
    ...d,
    items: db.prepare('SELECT * FROM devolucion_items WHERE devolucion_id = ?').all(d.id),
  }));
  res.json(conItems);
});

module.exports = router;
