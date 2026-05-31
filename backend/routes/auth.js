const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const Usuario = require('../models/Usuario');
const auth = require('../middleware/auth');
const { getEmailFrom, sendMail } = require('../utils/mailer');

const CODIGO_EXPIRACION_MINUTOS = 15;

const logoPath = path.resolve(__dirname, '../../seve-app/frontend/public/img/Logo.png');
const logoCid = 'seve-logo';

function normalizarUrlBase(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

function esLocalhost(url) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizarUrlBase(url));
}

function obtenerOrigenUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return '';
  }
}

function obtenerHostUrl(url) {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

function obtenerFrontendUrl(req) {
  const frontendUrl = normalizarUrlBase(process.env.PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL);
  const origen = normalizarUrlBase(req.get('origin'));
  const refererOrigen = obtenerOrigenUrl(req.get('referer') || '');
  const backendHost = req.get('host');

  if (frontendUrl && !esLocalhost(frontendUrl)) return frontendUrl;
  if (origen && !esLocalhost(origen) && obtenerHostUrl(origen) !== backendHost) return origen;
  if (refererOrigen && !esLocalhost(refererOrigen) && obtenerHostUrl(refererOrigen) !== backendHost) return refererOrigen;

  return frontendUrl || 'http://localhost:5173';
}

function construirResetPasswordUrl(req, resetPasswordToken) {
  return `${obtenerFrontendUrl(req)}/restablecer-password?token=${encodeURIComponent(resetPasswordToken)}`;
}

function generarCodigoVerificacion() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function obtenerExpiracionCodigo() {
  return new Date(Date.now() + CODIGO_EXPIRACION_MINUTOS * 60 * 1000);
}

function obtenerExpiracionResetPassword() {
  return new Date(Date.now() + 15 * 60 * 1000);
}

function obtenerRolUsuario(usuario) {
  if (usuario?.esAdmin) return 'admin';
  if (usuario?.rol) return usuario.rol;
  return 'cliente';
}

function construirRespuestaUsuario(usuario, extras = {}) {
  const nombre = `${usuario.nombres} ${usuario.apellidos}`.trim() || usuario.email;
  const rol = obtenerRolUsuario(usuario);

  return {
    nombre,
    rol,
    esAdmin: rol === 'admin',
    id: usuario._id.toString(),
    email: usuario.email,
    telefono: usuario.telefono,
    direccion: usuario.direccion,
    barrio: usuario.barrio,
    ciudad: usuario.ciudad,
    municipio: usuario.municipio,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    fotoPerfil: usuario.fotoPerfil || null,
    ...extras,
  };
}

async function asegurarAdmin(req, res, next) {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('rol esAdmin');
    const rol = obtenerRolUsuario(usuario);

    if (!usuario || rol !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta accion' });
    }

    req.usuarioAdmin = usuario;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
}

async function enviarCodigoVerificacion(usuario) {
  return enviarCodigoPorCorreo({
    to: usuario.email,
    nombre: usuario.nombres || 'usuario',
    codigo: usuario.verificationCode,
    asunto: 'Codigo de verificacion - SEVE Aluminios',
    mensaje: 'Gracias por registrarte en <strong>SEVE Aluminios</strong>. Ingresa este codigo de 6 digitos para verificar tu cuenta:',
  });
}

async function enviarCodigoPorCorreo({ to, nombre, codigo, asunto, mensaje }) {
  await sendMail({
    from: getEmailFrom(),
    to,
    subject: asunto,
    attachments: [
      {
        filename: 'Logo.png',
        path: logoPath,
        cid: logoCid,
      },
    ],
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
        <img src="cid:${logoCid}" alt="SEVE" style="height:48px;margin-bottom:20px" />
        <h2 style="color:#c0392b">Hola, ${nombre || 'usuario'}.</h2>
        <p style="color:#444;line-height:1.6">
          ${mensaje}
        </p>
        <div style="margin:24px 0;padding:18px 24px;background:#f8f8f8;border-radius:10px;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#c0392b">
          ${codigo}
        </div>
        <p style="color:#666;line-height:1.6">
          Este codigo vence en ${CODIGO_EXPIRACION_MINUTOS} minutos. Si no creaste esta cuenta, puedes ignorar este correo.
        </p>
        <p style="color:#999;font-size:12px;line-height:1.6">
          Si no ves este mensaje en tu bandeja principal, revisa la carpeta de spam o correo no deseado.
        </p>
      </div>
    `,
  });
}

async function enviarEnlacePorCorreo({ to, nombre, asunto, mensaje, botonTexto, botonUrl }) {
  await sendMail({
    from: getEmailFrom(),
    to,
    subject: asunto,
    attachments: [
      {
        filename: 'Logo.png',
        path: logoPath,
        cid: logoCid,
      },
    ],
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
        <img src="cid:${logoCid}" alt="SEVE" style="height:48px;margin-bottom:20px" />
        <h2 style="color:#c0392b">Hola, ${nombre || 'usuario'}.</h2>
        <p style="color:#444;line-height:1.6">${mensaje}</p>
        <a href="${botonUrl}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#c0392b;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
          ${botonTexto}
        </a>
        <p style="color:#666;line-height:1.6">
          Este enlace vence en 15 minutos. Si no solicitaste este cambio, puedes ignorar este correo.
        </p>
        <p style="color:#999;font-size:12px;line-height:1.6">
          Si no ves este mensaje en tu bandeja principal, revisa la carpeta de spam o correo no deseado.
        </p>
      </div>
    `,
  });
}

async function generarResetPasswordParaUsuario(usuario) {
  const resetPasswordToken = jwt.sign(
    { id: usuario._id.toString(), email: usuario.email, tipo: 'reset-password' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  usuario.resetPasswordToken = resetPasswordToken;
  usuario.resetPasswordExpiresAt = obtenerExpiracionResetPassword();
  await usuario.save();

  return resetPasswordToken;
}

router.post('/registro', async (req, res) => {
  try {
    const { nombres, apellidos, email, password } = req.body;
    const correoNormalizado = String(email || '').trim().toLowerCase();

    const existe = await Usuario.findOne({ email: correoNormalizado });
    if (existe) return res.status(400).json({ error: 'El correo ya esta registrado' });

    const hash = await bcrypt.hash(password, 10);
    const verificationCode = generarCodigoVerificacion();
    const verificationCodeExpiresAt = obtenerExpiracionCodigo();

    const usuario = new Usuario({
      nombres: nombres || '',
      apellidos: apellidos || '',
      email: correoNormalizado,
      password: hash,
      rol: 'cliente',
      verificationToken: null,
      verificationCode,
      verificationCodeExpiresAt,
      isVerified: false,
    });
    await usuario.save();

    await enviarCodigoVerificacion(usuario);

    res.json({
      mensaje: 'Registro exitoso. Revisa tu correo para verificar tu cuenta con el codigo enviado.',
      email: usuario.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/verificar-email', async (req, res) => {
  try {
    const { email, codigo } = req.body;
    const correoNormalizado = String(email || '').trim().toLowerCase();
    const codigoNormalizado = String(codigo || '').trim();

    const usuario = await Usuario.findOne({ email: correoNormalizado });

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (usuario.isVerified) return res.status(400).json({ error: 'La cuenta ya fue verificada' });
    if (!usuario.verificationCode || !usuario.verificationCodeExpiresAt) {
      return res.status(400).json({ error: 'No hay un codigo de verificacion activo para esta cuenta' });
    }
    if (usuario.verificationCodeExpiresAt < new Date()) {
      return res.status(400).json({ error: 'El codigo de verificacion ya expiro' });
    }
    if (usuario.verificationCode !== codigoNormalizado) {
      return res.status(400).json({ error: 'El codigo de verificacion es incorrecto' });
    }

    usuario.isVerified = true;
    usuario.verificationToken = null;
    usuario.verificationCode = null;
    usuario.verificationCodeExpiresAt = null;
    await usuario.save();

    res.json({ mensaje: 'Correo verificado. Ya puedes iniciar sesion.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/verificar-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token de verificacion no proporcionado' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findOne({ email: String(decoded.email || '').trim().toLowerCase() });

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (usuario.isVerified) return res.status(400).json({ error: 'La cuenta ya fue verificada' });

    usuario.isVerified = true;
    usuario.verificationToken = null;
    usuario.verificationCode = null;
    usuario.verificationCodeExpiresAt = null;
    await usuario.save();

    res.json({ mensaje: 'Correo verificado. Ya puedes iniciar sesion.' });
  } catch (err) {
    res.status(400).json({ error: 'El enlace de verificacion es invalido o ya expiro' });
  }
});

router.post('/reenviar-codigo-verificacion', async (req, res) => {
  try {
    const { email } = req.body;
    const correoNormalizado = String(email || '').trim().toLowerCase();
    const usuario = await Usuario.findOne({ email: correoNormalizado });

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (usuario.isVerified) return res.status(400).json({ error: 'La cuenta ya fue verificada' });

    usuario.verificationCode = generarCodigoVerificacion();
    usuario.verificationCodeExpiresAt = obtenerExpiracionCodigo();
    await usuario.save();

    await enviarCodigoVerificacion(usuario);

    res.json({ mensaje: 'Te enviamos un nuevo codigo de verificacion a tu correo.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const correoNormalizado = String(email || '').trim().toLowerCase();
    const usuario = await Usuario.findOne({ email: correoNormalizado });

    if (!usuario) {
      return res.json({ mensaje: 'Si el correo existe, enviaremos un enlace para restablecer la contraseña.' });
    }

    const resetPasswordToken = await generarResetPasswordParaUsuario(usuario);

    const resetURL = construirResetPasswordUrl(req, resetPasswordToken);

    await enviarEnlacePorCorreo({
      to: usuario.email,
      nombre: usuario.nombres || 'usuario',
      asunto: 'Restablece tu contraseña - SEVE Aluminios',
      mensaje: 'Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>SEVE Aluminios</strong>. Haz clic en el boton para continuar:',
      botonTexto: 'Restablecer contraseña',
      botonUrl: resetURL,
    });

    res.json({ mensaje: 'Si el correo existe, enviaremos un enlace para restablecer la contraseña.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const decoded = jwt.verify(String(token || ''), process.env.JWT_SECRET);

    if (decoded.tipo !== 'reset-password') {
      return res.status(400).json({ error: 'El enlace de recuperacion es invalido' });
    }

    const usuario = await Usuario.findById(decoded.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (!usuario.resetPasswordToken || usuario.resetPasswordToken !== token) {
      return res.status(400).json({ error: 'El enlace de recuperacion es invalido' });
    }
    if (!usuario.resetPasswordExpiresAt || usuario.resetPasswordExpiresAt < new Date()) {
      return res.status(400).json({ error: 'El enlace de recuperacion ya expiro' });
    }

    usuario.password = await bcrypt.hash(password, 10);
    usuario.resetPasswordToken = null;
    usuario.resetPasswordExpiresAt = null;
    await usuario.save();

    res.json({ mensaje: 'Contraseña actualizada correctamente. Ya puedes iniciar sesion.' });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'El enlace de recuperacion es invalido o ya expiro' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const correoNormalizado = String(email || '').trim().toLowerCase();
    const usuario = await Usuario.findOne({ email: correoNormalizado });
    if (!usuario) return res.status(400).json({ error: 'Correo o contraseña incorrectos' });

    const valida = await bcrypt.compare(password, usuario.password);
    if (!valida) return res.status(400).json({ error: 'Correo o contraseña incorrectos' });
    if (!usuario.isVerified) {
      return res.status(403).json({ error: 'Debes verificar tu correo con el codigo enviado antes de iniciar sesion' });
    }

    const rol = obtenerRolUsuario(usuario);
    const token = jwt.sign(
      { id: usuario._id, nombre: `${usuario.nombres} ${usuario.apellidos}`.trim() || usuario.email, esAdmin: rol === 'admin', rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      ...construirRespuestaUsuario(usuario),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id)
      .select('-password -verificationToken -verificationCode -verificationCodeExpiresAt -pendingEmailVerificationCode -pendingEmailVerificationExpiresAt -resetPasswordToken -resetPasswordExpiresAt');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({
      ...usuario.toObject(),
      rol: obtenerRolUsuario(usuario),
      esAdmin: obtenerRolUsuario(usuario) === 'admin',
      nombre: `${usuario.nombres} ${usuario.apellidos}`.trim() || usuario.email,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/perfil', auth, async (req, res) => {
  try {
    const { telefono, direccion, barrio, ciudad, municipio, nombres, apellidos, email, fotoPerfil } = req.body;
    const usuario = await Usuario.findById(req.usuario.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (email && email !== usuario.email) {
      const correoNormalizado = String(email).trim().toLowerCase();
      const emailExistente = await Usuario.findOne({
        _id: { $ne: usuario._id },
        $or: [
          { email: correoNormalizado },
          { pendingEmail: correoNormalizado },
        ],
      });
      if (emailExistente) return res.status(400).json({ error: 'El correo ya esta en uso por otro usuario' });

      usuario.pendingEmail = correoNormalizado;
      usuario.pendingEmailVerificationCode = generarCodigoVerificacion();
      usuario.pendingEmailVerificationExpiresAt = obtenerExpiracionCodigo();

      await enviarCodigoPorCorreo({
        to: correoNormalizado,
        nombre: usuario.nombres || 'usuario',
        codigo: usuario.pendingEmailVerificationCode,
        asunto: 'Codigo para cambiar tu correo - SEVE Aluminios',
        mensaje: 'Recibimos una solicitud para cambiar el correo de tu cuenta en <strong>SEVE Aluminios</strong>. Ingresa este codigo de 6 digitos para confirmar el nuevo correo:',
      });
    }

    if (telefono !== undefined) usuario.telefono = telefono;
    if (direccion !== undefined) usuario.direccion = direccion;
    if (barrio !== undefined) usuario.barrio = barrio;
    if (ciudad !== undefined) usuario.ciudad = ciudad;
    if (municipio !== undefined) usuario.municipio = municipio;
    if (nombres !== undefined) usuario.nombres = nombres;
    if (apellidos !== undefined) usuario.apellidos = apellidos;
    if (fotoPerfil !== undefined) usuario.fotoPerfil = fotoPerfil || null;

    await usuario.save();
    res.json({
      ...construirRespuestaUsuario(usuario),
      emailChangePending: Boolean(usuario.pendingEmail),
      pendingEmail: usuario.pendingEmail,
      mensaje: email && email !== usuario.email
        ? 'Guardamos tus cambios. Verifica el nuevo correo con el codigo enviado para completar la actualizacion.'
        : 'Datos guardados correctamente',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/perfil/verificar-cambio-email', auth, async (req, res) => {
  try {
    const { codigo } = req.body;
    const codigoNormalizado = String(codigo || '').trim();
    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (!usuario.pendingEmail || !usuario.pendingEmailVerificationCode || !usuario.pendingEmailVerificationExpiresAt) {
      return res.status(400).json({ error: 'No hay un cambio de correo pendiente para verificar' });
    }
    if (usuario.pendingEmailVerificationExpiresAt < new Date()) {
      return res.status(400).json({ error: 'El codigo de verificacion ya expiro' });
    }
    if (usuario.pendingEmailVerificationCode !== codigoNormalizado) {
      return res.status(400).json({ error: 'El codigo de verificacion es incorrecto' });
    }

    usuario.email = usuario.pendingEmail;
    usuario.pendingEmail = null;
    usuario.pendingEmailVerificationCode = null;
    usuario.pendingEmailVerificationExpiresAt = null;
    await usuario.save();

    res.json({
      mensaje: 'Correo actualizado correctamente.',
      ...construirRespuestaUsuario(usuario),
      emailChangePending: false,
      pendingEmail: null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/perfil/reenviar-cambio-email', auth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (!usuario.pendingEmail) {
      return res.status(400).json({ error: 'No hay un cambio de correo pendiente para reenviar' });
    }

    usuario.pendingEmailVerificationCode = generarCodigoVerificacion();
    usuario.pendingEmailVerificationExpiresAt = obtenerExpiracionCodigo();

    await enviarCodigoPorCorreo({
      to: usuario.pendingEmail,
      nombre: usuario.nombres || 'usuario',
      codigo: usuario.pendingEmailVerificationCode,
      asunto: 'Codigo para cambiar tu correo - SEVE Aluminios',
      mensaje: 'Ingresa este codigo de 6 digitos para confirmar el nuevo correo de tu cuenta en <strong>SEVE Aluminios</strong>:',
    });

    await usuario.save();

    res.json({ mensaje: 'Te enviamos un nuevo codigo al correo pendiente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/usuarios', auth, asegurarAdmin, async (req, res) => {
  try {
    const usuarios = await Usuario.find({})
      .select('-password -verificationToken -verificationCode -verificationCodeExpiresAt -pendingEmailVerificationCode -pendingEmailVerificationExpiresAt -resetPasswordToken -resetPasswordExpiresAt')
      .sort({ createdAt: -1 });

    res.json(usuarios.map((usuario) => ({
      _id: usuario._id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      nombre: `${usuario.nombres} ${usuario.apellidos}`.trim() || usuario.email,
      email: usuario.email,
      telefono: usuario.telefono,
      rol: obtenerRolUsuario(usuario),
      esAdmin: obtenerRolUsuario(usuario) === 'admin',
      isVerified: usuario.isVerified,
      createdAt: usuario.createdAt,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.patch('/usuarios/:id/rol', auth, asegurarAdmin, async (req, res) => {
  try {
    const { rol } = req.body;

    if (!['cliente', 'empleado', 'admin'].includes(rol)) {
      return res.status(400).json({ error: 'Rol invalido' });
    }

    const usuarioObjetivo = await Usuario.findById(req.params.id);
    if (!usuarioObjetivo) return res.status(404).json({ error: 'Usuario no encontrado' });

    usuarioObjetivo.rol = rol;
    await usuarioObjetivo.save();

    res.json({
      mensaje: 'Rol actualizado correctamente',
      usuario: {
        _id: usuarioObjetivo._id,
        nombres: usuarioObjetivo.nombres,
        apellidos: usuarioObjetivo.apellidos,
        nombre: `${usuarioObjetivo.nombres} ${usuarioObjetivo.apellidos}`.trim() || usuarioObjetivo.email,
        email: usuarioObjetivo.email,
        telefono: usuarioObjetivo.telefono,
        rol: obtenerRolUsuario(usuarioObjetivo),
        esAdmin: obtenerRolUsuario(usuarioObjetivo) === 'admin',
        isVerified: usuarioObjetivo.isVerified,
        createdAt: usuarioObjetivo.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.patch('/usuarios/:id', auth, asegurarAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    const usuarioObjetivo = await Usuario.findById(req.params.id);
    if (!usuarioObjetivo) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (email !== undefined) {
      const correoNormalizado = String(email || '').trim().toLowerCase();
      if (!correoNormalizado) {
        return res.status(400).json({ error: 'Debes ingresar un correo valido' });
      }

      const emailExistente = await Usuario.findOne({
        _id: { $ne: usuarioObjetivo._id },
        $or: [
          { email: correoNormalizado },
          { pendingEmail: correoNormalizado },
        ],
      });

      if (emailExistente) {
        return res.status(400).json({ error: 'El correo ya esta en uso por otro usuario' });
      }

      usuarioObjetivo.email = correoNormalizado;
      usuarioObjetivo.pendingEmail = null;
      usuarioObjetivo.pendingEmailVerificationCode = null;
      usuarioObjetivo.pendingEmailVerificationExpiresAt = null;

      const resetPasswordToken = await generarResetPasswordParaUsuario(usuarioObjetivo);
      const resetURL = construirResetPasswordUrl(req, resetPasswordToken);

      await enviarEnlacePorCorreo({
        to: usuarioObjetivo.email,
        nombre: usuarioObjetivo.nombres || 'usuario',
        asunto: 'Tu correo fue actualizado por un administrador - SEVE Aluminios',
        mensaje: 'Un administrador actualizo el correo de acceso de tu cuenta en <strong>SEVE Aluminios</strong>. Usa este enlace para gestionar tu acceso o restablecer tu contraseña si lo necesitas:',
        botonTexto: 'Gestionar acceso',
        botonUrl: resetURL,
      });
    }

    await usuarioObjetivo.save();

    res.json({
      mensaje: 'Usuario actualizado correctamente',
      usuario: {
        _id: usuarioObjetivo._id,
        nombres: usuarioObjetivo.nombres,
        apellidos: usuarioObjetivo.apellidos,
        nombre: `${usuarioObjetivo.nombres} ${usuarioObjetivo.apellidos}`.trim() || usuarioObjetivo.email,
        email: usuarioObjetivo.email,
        telefono: usuarioObjetivo.telefono,
        rol: obtenerRolUsuario(usuarioObjetivo),
        esAdmin: obtenerRolUsuario(usuarioObjetivo) === 'admin',
        isVerified: usuarioObjetivo.isVerified,
        createdAt: usuarioObjetivo.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
