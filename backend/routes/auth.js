const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const Usuario  = require('../models/Usuario');

router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(400).json({ error: 'El correo ya está registrado' });
    const hash = await bcrypt.hash(password, 10);
    const usuario = new Usuario({ nombre, email, password: hash });
    await usuario.save();
    const token = jwt.sign(
      { id: usuario._id, nombre: usuario.nombre, esAdmin: usuario.esAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, nombre: usuario.nombre, esAdmin: usuario.esAdmin });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ error: 'Correo o contraseña incorrectos' });
    const valida = await bcrypt.compare(password, usuario.password);
    if (!valida) return res.status(400).json({ error: 'Correo o contraseña incorrectos' });
    const token = jwt.sign(
      { id: usuario._id, nombre: usuario.nombre, esAdmin: usuario.esAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, nombre: usuario.nombre, esAdmin: usuario.esAdmin });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;