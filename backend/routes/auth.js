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
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2f2f2;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#8b1a10;padding:28px 40px;text-align:center;">
            <img src="https://sevealuminios.com/img/Logo.png" alt="SEVE Aluminios" style="height:64px;" />
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px 24px;">
            <h2 style="margin:0 0 8px;color:#222222;font-size:22px;">Hola, ${nombre || 'usuario'}.</h2>
            <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.7;">${mensaje}</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:20px 0;">
                  <div style="display:inline-block;background:#f9f9f9;border:2px solid #c0392b;border-radius:10px;padding:20px 40px;font-size:36px;font-weight:700;letter-spacing:10px;color:#c0392b;">${codigo}</div>
                </td>
              </tr>
            </table>
            <p style="color:#666666;font-size:14px;line-height:1.7;margin:16px 0 0;">
              Este código vence en <strong>${CODIGO_EXPIRACION_MINUTOS} minutos</strong>. Si no creaste esta cuenta, puedes ignorar este correo.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;border-top:1px solid #eeeeee;padding:20px 40px;text-align:center;">
            <p style="margin:0 0 6px;color:#aaaaaa;font-size:12px;">Este mensaje fue generado automáticamente, por favor no respondas.</p>
            <p style="margin:0;color:#aaaaaa;font-size:12px;">© ${new Date().getFullYear()} SEVE Aluminios &nbsp;·&nbsp; <a href="https://sevealuminios.com" style="color:#c0392b;text-decoration:none;">sevealuminios.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

async function enviarEnlacePorCorreo({ to, nombre, asunto, mensaje, botonTexto, botonUrl }) {
  await sendMail({
    from: getEmailFrom(),
    to,
    subject: asunto,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2f2f2;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#8b1a10;padding:28px 40px;text-align:center;">
            <img src="https://sevealuminios.com/img/Logo.png" alt="SEVE Aluminios" style="height:64px;" />
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px 24px;">
            <h2 style="margin:0 0 8px;color:#222222;font-size:22px;">Hola, ${nombre || 'usuario'}.</h2>
            <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.7;">${mensaje}</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 28px;">
                  <a href="${botonUrl}" style="display:inline-block;background:#c0392b;color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:8px;font-weight:700;font-size:15px;">
                    ${botonTexto}
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#aaaaaa;font-size:12px;line-height:1.7;margin:0;">
              Este enlace vence en <strong>15 minutos</strong>. Si no solicitaste este cambio, puedes ignorar este correo.<br><br>
              Si el botón no funciona, copia este enlace:<br>
              <a href="${botonUrl}" style="color:#c0392b;word-break:break-all;">${botonUrl}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;border-top:1px solid #eeeeee;padding:20px 40px;text-align:center;">
            <p style="margin:0 0 6px;color:#aaaaaa;font-size:12px;">Este mensaje fue generado automáticamente, por favor no respondas.</p>
            <p style="margin:0;color:#aaaaaa;font-size:12px;">© ${new Date().getFullYear()} SEVE Aluminios &nbsp;·&nbsp; <a href="https://sevealuminios.com" style="color:#c0392b;text-decoration:none;">sevealuminios.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
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
