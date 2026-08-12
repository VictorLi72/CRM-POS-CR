const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }
  const usuario = db.prepare('SELECT * FROM usuarios WHERE usuario = ?').get(username);
  if (!usuario || !usuario.activo) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }
  const valido = bcrypt.compareSync(password, usuario.contrasena_hash);
  if (!valido) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }
  const payload = {
    id: usuario.id,
    usuario: usuario.usuario,
    nombre_completo: usuario.nombre_completo,
    rol: usuario.rol,
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: payload });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
