const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('administrador'));

function sanear(usuario) {
  const { contrasena_hash, ...resto } = usuario;
  return resto;
}

router.get('/', (req, res) => {
  const usuarios = db.prepare('SELECT * FROM usuarios ORDER BY nombre_completo').all();
  res.json(usuarios.map(sanear));
});

router.get('/:id', (req, res) => {
  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.params.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(sanear(usuario));
});

router.post('/', (req, res) => {
  const { username, password, nombre_completo, rol } = req.body || {};
  if (!username || !password || !nombre_completo || !rol) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  if (!['administrador', 'supervisor', 'cajero'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }
  try {
    const hash = bcrypt.hashSync(password, 10);
    const info = db
      .prepare('INSERT INTO usuarios (usuario, contrasena_hash, nombre_completo, rol) VALUES (?, ?, ?, ?)')
      .run(username.trim(), hash, nombre_completo.trim(), rol);
    res.status(201).json(sanear(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(info.lastInsertRowid)));
  } catch (err) {
    res.status(400).json({ error: 'Ya existe un usuario con ese nombre de usuario' });
  }
});

router.put('/:id', (req, res) => {
  const { nombre_completo, rol, activo, password } = req.body || {};
  const existente = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (rol && !['administrador', 'supervisor', 'cajero'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  db.prepare('UPDATE usuarios SET nombre_completo = ?, rol = ?, activo = ? WHERE id = ?').run(
    nombre_completo ?? existente.nombre_completo,
    rol ?? existente.rol,
    activo != null ? (activo ? 1 : 0) : existente.activo,
    req.params.id
  );

  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE usuarios SET contrasena_hash = ? WHERE id = ?').run(hash, req.params.id);
  }

  res.json(sanear(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.params.id)));
});

router.delete('/:id', (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'No puede desactivar su propio usuario' });
  }
  db.prepare('UPDATE usuarios SET activo = 0 WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
