const router = require('express').Router();
const Pedido = require('../models/Pedido');
const Usuario = require('../models/Usuario');
const Transportadora = require('../models/Transportadora');
const authMidd = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const { describeEmailError, getEmailFrom, sendMail } = require('../utils/mailer');

const logoPath = path.resolve(__dirname, '../../seve-app/frontend/public/img/Logo.png');
const logoCid = 'seve-logo';

async function usuarioEsAdmin(userId) {
  const usuario = await Usuario.findById(userId).select('rol esAdmin');
  if (!usuario) return false;
  return usuario.esAdmin || usuario.rol === 'admin';
}

async function usuarioEsStaff(userId) {
  const usuario = await Usuario.findById(userId).select('rol esAdmin');
  if (!usuario) return false;
  return usuario.esAdmin || usuario.rol === 'admin' || usuario.rol === 'empleado';
}

async function usuarioPuedeVerPedido(pedido, userId) {
  if (!pedido) return false;
  const pedidoUsuarioId = pedido.usuario?._id || pedido.usuario;
  if (String(pedidoUsuarioId) === String(userId)) return true;
  return usuarioEsStaff(userId);
}

function calcularEstadoSegunChecklist(items = []) {
  const algunoMarcado = items.some((item) => item.checklist);
  return algunoMarcado ? 'espera' : 'nuevo';
}

async function enviarCorreoRastreo({ pedido, usuario, transportadora }) {
  if (!usuario?.email) return;
  const attachments = fs.existsSync(logoPath)
    ? [{ filename: 'Logo.png', path: logoPath, cid: logoCid }]
    : [];

  await sendMail({
    from: getEmailFrom(),
    to: usuario.email,
    subject: 'Tu pedido ya va en camino - SEVE Aluminios',
    attachments,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
        ${attachments.length ? `<img src="cid:${logoCid}" alt="SEVE" style="height:48px;margin-bottom:20px" />` : ''}
        <h2 style="color:#c0392b">Hola, ${usuario.nombres || 'cliente'}.</h2>
        <p style="color:#444;line-height:1.6">
          Tu pedido <strong>#${pedido._id.toString().slice(-6)}</strong> ya fue despachado.
        </p>
        <p style="color:#444;line-height:1.6">
          Transportadora: <strong>${transportadora.nombre}</strong><br />
          Número de rastreo: <strong>${pedido.numeroRastreo}</strong>
        </p>
        <a href="${transportadora.trackingUrl}${pedido.numeroRastreo}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#c0392b;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
          Rastrear pedido
        </a>
        <p style="color:#666;line-height:1.6">
          Si el enlace no abre, puedes copiar este URL en tu navegador:<br />
          ${transportadora.trackingUrl}${pedido.numeroRastreo}
        </p>
        <p style="color:#999;font-size:12px;line-height:1.6">
          Si no ves este mensaje en tu bandeja principal, revisa la carpeta de spam o correo no deseado.
        </p>
      </div>
    `,
  });
}

async function enviarCorreoRastreoPedido(pedido) {
  const usuarioCorreo = pedido.usuario?.email
    ? pedido.usuario
    : await Usuario.findById(pedido.usuario).select('nombres apellidos email');

  if (!usuarioCorreo?.email) {
    throw new Error('El cliente no tiene correo para enviar la notificacion');
  }

  const transportadora = await Transportadora.findOne({ nombre: pedido.transportadoraNombre });
  if (!transportadora) {
    throw new Error('La transportadora del pedido no existe');
  }

  await enviarCorreoRastreo({ pedido, usuario: usuarioCorreo, transportadora });
}

router.post('/', authMidd, async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const total = Number(req.body.total || 0);
    const metodoPago = String(req.body.metodoPago || '').trim();

    if (!items.length) {
      return res.status(400).json({ error: 'Debes enviar al menos un producto en el pedido' });
    }
    if (!metodoPago) {
      return res.status(400).json({ error: 'Debes indicar el metodo de pago' });
    }
    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ error: 'El total del pedido no es valido' });
    }

    const esPagoWompi = metodoPago.toLowerCase().includes('wompi');

    const tipoValido = req.body.tipo === 'mayorista' ? 'mayorista' : 'normal';

    const pedido = new Pedido({
      usuario: req.usuario.id,
      tipo: tipoValido,
      items,
      total,
      metodoPago,
      direccion: req.body.direccion,
      ciudad: req.body.ciudad,
      estado: 'nuevo',
      wompiEstado: esPagoWompi ? 'PENDING' : '',
    });

    await pedido.save();
    res.json(pedido);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar pedido' });
  }
});

router.get('/historial', authMidd, async (req, res) => {
  try {
    const pedidos = await Pedido.find({ usuario: req.usuario.id }).sort({ createdAt: -1 }).lean();
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

router.get('/todos', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    const pedidos = await Pedido.find()
      .populate('usuario', 'nombres apellidos email')
      .sort({ createdAt: -1 })
      .lean();
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

router.get('/:id', authMidd, async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id).populate('usuario', 'nombres apellidos email').lean();
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (!(await usuarioPuedeVerPedido(pedido, req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    res.json(pedido);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el pedido' });
  }
});

const ESTADOS_VALIDOS = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];

router.patch('/:id/estado', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    const { estado } = req.body;
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: `Estado invalido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}` });
    }
    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    ).populate('usuario', 'nombres apellidos email');
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(pedido);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar estado del pedido' });
  }
});

router.patch('/:id/checklist', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsAdmin(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    const { items } = req.body;
    const pedido = await Pedido.findById(req.params.id).populate('usuario', 'nombres apellidos email');
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (pedido.estado === 'despachado') {
      return res.status(400).json({ error: 'Un pedido despachado ya no se puede modificar' });
    }
    pedido.items = pedido.items.map((item, index) => ({
      ...item.toObject(),
      checklist: Boolean(items?.[index]?.checklist),
    }));
    pedido.estado = calcularEstadoSegunChecklist(pedido.items);
    await pedido.save();
    res.json(pedido);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar checklist' });
  }
});

router.patch('/:id/despachar', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsAdmin(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    const pedido = await Pedido.findById(req.params.id).populate('usuario', 'nombres apellidos email');
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (pedido.wompiEstado === 'PENDING') {
      return res.status(400).json({ error: 'No puedes despachar un pedido con pago pendiente' });
    }
    if (pedido.estado === 'despachado') {
      return res.status(400).json({ error: 'El pedido ya fue despachado' });
    }
    const todosMarcados = pedido.items.length > 0 && pedido.items.every((item) => item.checklist);
    if (!todosMarcados) {
      return res.status(400).json({ error: 'Debes completar todos los checklist antes de despachar' });
    }
    pedido.estado = 'despachado';
    await pedido.save();
    res.json(pedido);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al despachar pedido' });
  }
});

const ESTADOS_PERMITIDOS_ENVIO = [
  'nuevo',
  'espera',
  'despachado',
  'enviado',
  'entregado',
  'pendiente',
  'procesando',
];

router.patch('/:id/envio', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    const { transportadoraNombre, numeroRastreo } = req.body;
    if (!String(transportadoraNombre || '').trim() || !String(numeroRastreo || '').trim()) {
      return res.status(400).json({ error: 'Debes ingresar transportadora y número de rastreo' });
    }
    const pedido = await Pedido.findById(req.params.id).populate('usuario', 'nombres apellidos email');
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (pedido.wompiEstado === 'PENDING') {
      return res.status(400).json({ error: 'No puedes registrar envio porque el pago todavia esta pendiente' });
    }

    if (!ESTADOS_PERMITIDOS_ENVIO.includes(pedido.estado)) {
      return res.status(400).json({
        error: 'Solo puedes registrar envio para pedidos aprobados o en preparacion',
      });
    }
    if (pedido.numeroRastreo || pedido.enviadoAt) {
      return res.status(400).json({ error: 'Este envio ya fue registrado y no se puede editar' });
    }

    const transportadora = await Transportadora.findOne({ nombre: transportadoraNombre });
    if (!transportadora) {
      return res.status(400).json({ error: 'La transportadora seleccionada no existe' });
    }

    pedido.transportadoraNombre = transportadora.nombre;
    pedido.transportadoraUrl = transportadora.trackingUrl;
    pedido.numeroRastreo = String(numeroRastreo || '').trim();
    pedido.enviadoAt = new Date();
    await pedido.save();

    const respuesta = pedido.toObject();

    try {
      await enviarCorreoRastreoPedido(pedido);
      respuesta.correoRastreoEnviado = true;
      return res.json(respuesta);
    } catch (correoErr) {
      console.error('Error enviando correo de rastreo:', correoErr);
      respuesta.correoRastreoEnviado = false;
      respuesta.correoRastreoError = `Envio registrado, pero no se pudo enviar el correo al cliente. ${describeEmailError(correoErr)}`;
      return res.json(respuesta);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar el envio' });
  }
});

router.post('/:id/envio/correo', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const pedido = await Pedido.findById(req.params.id).populate('usuario', 'nombres apellidos email');
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (!pedido.transportadoraNombre || !pedido.numeroRastreo) {
      return res.status(400).json({ error: 'Primero debes registrar transportadora y numero de rastreo' });
    }

    await enviarCorreoRastreoPedido(pedido);

    const respuesta = pedido.toObject();
    respuesta.correoRastreoEnviado = true;
    res.json(respuesta);
  } catch (err) {
    console.error('Error reenviando correo de rastreo:', err);
    res.status(500).json({
      error: describeEmailError(err),
      correoRastreoEnviado: false,
    });
  }
});

module.exports = router;
