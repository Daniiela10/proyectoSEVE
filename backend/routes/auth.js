const router    = require('express').Router();
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Usuario   = require('../models/Usuario');
const auth      = require('../middleware/auth');

// Configurar Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── REGISTRO ─────────────────────────────────────────────────────
router.post('/registro', async (req, res) => {
  try {
    const { nombres, apellidos, email, password } = req.body;
    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(400).json({ error: 'El correo ya está registrado' });

    const hash = await bcrypt.hash(password, 10);

    // Token de verificación (expira en 24h)
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });

    const usuario = new Usuario({
      nombres:  nombres  || '',
      apellidos: apellidos || '',
      email,
      password: hash,
      verificationToken,
      isVerified: false,
    });
    await usuario.save();

    // Enviar correo de verificación
    const verifyURL = `${process.env.FRONTEND_URL}/verificar-email?token=${verificationToken}`;
    await transporter.sendMail({
      from: `"SEVE Aluminios" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '✅ Verifica tu correo - SEVE Aluminios',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
          <img src="${process.env.FRONTEND_URL}/img/Logo.jpeg" alt="SEVE" style="height:48px;margin-bottom:20px" />
          <h2 style="color:#c0392b">¡Hola, ${nombres}!</h2>
          <p style="color:#444;line-height:1.6">Gracias por registrarte en <strong>SEVE Aluminios</strong>. Haz clic en el botón para verificar tu cuenta:</p>
          <a href="${verifyURL}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#c0392b;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
            Verificar mi correo
          </a>
          <p style="color:#999;font-size:13px">Este enlace expira en 24 horas. Si no te registraste, ignora este correo.</p>
        </div>
      `,
    });

    res.json({ mensaje: 'Registro exitoso. Revisa tu correo para verificar tu cuenta.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── VERIFICAR CORREO ──────────────────────────────────────────────
router.get('/verificar-email', async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findOne({ email: decoded.email });

    if (!usuario)          return res.status(404).json({ error: 'Usuario no encontrado' });
    if (usuario.isVerified) return res.status(400).json({ error: 'La cuenta ya fue verificada' });

    usuario.isVerified        = true;
    usuario.verificationToken = null;
    await usuario.save();

    res.json({ mensaje: '¡Correo verificado! Ya puedes iniciar sesión.' });
  } catch (err) {
    res.status(400).json({ error: 'El enlace es inválido o ya expiró' });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ error: 'Correo o contraseña incorrectos' });

    const valida = await bcrypt.compare(password, usuario.password);
    if (!valida) return res.status(400).json({ error: 'Correo o contraseña incorrectos' });

    const token = jwt.sign(
      { id: usuario._id, nombre: `${usuario.nombres} ${usuario.apellidos}`.trim() || usuario.email, esAdmin: usuario.esAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      nombre:    `${usuario.nombres} ${usuario.apellidos}`.trim() || usuario.email,
      esAdmin:   usuario.esAdmin,
      email:     usuario.email,
      telefono:  usuario.telefono,
      direccion: usuario.direccion,
      barrio:    usuario.barrio,
      ciudad:    usuario.ciudad,
      municipio: usuario.municipio,
      nombres:   usuario.nombres,
      apellidos: usuario.apellidos,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── ME ────────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-password');
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── ACTUALIZAR PERFIL ─────────────────────────────────────────────
router.put('/perfil', auth, async (req, res) => {
  try {
    const { telefono, direccion, barrio, ciudad, municipio, nombres, apellidos, email } = req.body;
    const usuario = await Usuario.findById(req.usuario.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (email && email !== usuario.email) {
      const emailExistente = await Usuario.findOne({ email });
      if (emailExistente) return res.status(400).json({ error: 'El correo ya está en uso por otro usuario' });
      usuario.email = email;
    }

    if (telefono  !== undefined) usuario.telefono  = telefono;
    if (direccion !== undefined) usuario.direccion = direccion;
    if (barrio    !== undefined) usuario.barrio    = barrio;
    if (ciudad    !== undefined) usuario.ciudad    = ciudad;
    if (municipio !== undefined) usuario.municipio = municipio;
    if (nombres   !== undefined) usuario.nombres   = nombres;
    if (apellidos !== undefined) usuario.apellidos = apellidos;

    await usuario.save();
    res.json({ email: usuario.email, telefono: usuario.telefono, direccion: usuario.direccion, barrio: usuario.barrio, ciudad: usuario.ciudad, municipio: usuario.municipio, nombres: usuario.nombres, apellidos: usuario.apellidos });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;