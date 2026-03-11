const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const Usuario  = require('../models/Usuario');
const auth     = require('../middleware/auth');

router.post('/registro', async (req, res) => {
  try {
    const { nombres, apellidos, email, password } = req.body;
    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(400).json({ error: 'El correo ya está registrado' });
    const hash = await bcrypt.hash(password, 10);
    const usuario = new Usuario({ 
      nombres: nombres || '', 
      apellidos: apellidos || '', 
      email, 
      password: hash 
    });
    await usuario.save();
    const token = jwt.sign(
      { id: usuario._id, nombre: `${usuario.nombres} ${usuario.apellidos}`.trim() || usuario.email, esAdmin: usuario.esAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ 
      token, 
      nombre: `${usuario.nombres} ${usuario.apellidos}`.trim() || usuario.email, 
      esAdmin: usuario.esAdmin 
    });
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
    res.json({ 
      token, 
      nombre: usuario.nombre, 
      esAdmin: usuario.esAdmin,
      email: usuario.email,
      telefono: usuario.telefono,
      direccion: usuario.direccion,
      barrio: usuario.barrio,
      ciudad: usuario.ciudad,
      municipio: usuario.municipio,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos
    });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener datos del usuario actual
router.get('/me', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-password');
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Actualizar perfil del usuario
router.put('/perfil', auth, async (req, res) => {
  try {
    const { telefono, direccion, barrio, ciudad, municipio, nombres, apellidos, email } = req.body;
    const usuario = await Usuario.findById(req.usuario.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    // Verificar si el nuevo email ya está en uso por otro usuario
    if (email && email !== usuario.email) {
      const emailExistente = await Usuario.findOne({ email });
      if (emailExistente) {
        return res.status(400).json({ error: 'El correo ya está en uso por otro usuario' });
      }
      usuario.email = email;
    }
    
    if (telefono !== undefined) usuario.telefono = telefono;
    if (direccion !== undefined) usuario.direccion = direccion;
    if (barrio !== undefined) usuario.barrio = barrio;
    if (ciudad !== undefined) usuario.ciudad = ciudad;
    if (municipio !== undefined) usuario.municipio = municipio;
    if (nombres !== undefined) usuario.nombres = nombres;
    if (apellidos !== undefined) usuario.apellidos = apellidos;
    
    await usuario.save();
    res.json({
      email: usuario.email,
      telefono: usuario.telefono,
      direccion: usuario.direccion,
      barrio: usuario.barrio,
      ciudad: usuario.ciudad,
      municipio: usuario.municipio,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos
    });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;

