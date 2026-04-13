const router   = require('express').Router();
const Pedido   = require('../models/Pedido');
const Usuario  = require('../models/Usuario');
const Transportadora = require('../models/Transportadora');
const authMidd = require('../middleware/auth');
const nodemailer = require('nodemailer');
const path = require('path');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const logoPath = path.resolve(__dirname, '../../seve-app/frontend/public/img/Logo.jpeg');
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

function calcularEstadoSegunChecklist(items = []) {
  const algunoMarcado = items.some((item) => item.checklist);
  return algunoMarcado ? 'espera' : 'nuevo';
}

async function enviarCorreoRastreo({ pedido, usuario, transportadora }) {
  if (!usuario?.email) return;
  await transporter.sendMail({
    from: `"SEVE Aluminios" <${process.env.EMAIL_USER}>`,
    to: usuario.email,
    subject: 'Tu pedido ya va en camino - SEVE Aluminios',
    attachments: [{ filename: 'Logo.jpeg', path: logoPath, cid: logoCid }],
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
        <img src="cid:${logoCid}" alt="SEVE" style="height:48px;margin-bottom:20px" />
        <h2 style="color:#c0392b">Hola, ${usuario.nombres || 'cliente'}.</h2>
        <p style="color:#444;line-height:1.6">
          Tu pedido <strong>#${pedido._id.toString().slice(-6)}</strong> ya fue despachado.
        </p>
        <p style="color:#444;line-height:1.6">
          Transportadora: <strong>${transportadora.nombre}</strong><br />
          Numero de rastreo: <strong>${pedido.numeroRastreo}</strong>
        </p>
        <a href="${transportadora.trackingUrl}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#c0392b;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
          Rastrear pedido
        </a>
        <p style="color:#666;line-height:1.6">
          Si el enlace no abre, puedes copiar este URL en tu navegador:<br />
          ${transportadora.trackingUrl}
        </p>
      </div>
    `,
  });
}

// ── Crear pedido (cliente) ────────────────────────────────────────
router.post('/', authMidd, async (req, res) => {
  try {
    const pedido = new Pedido({
      usuario:    req.usuario.id,
      items:      req.body.items,
      total:      req.body.total,
      metodoPago: req.body.metodoPago,
      direccion:  req.body.direccion,
      ciudad:     req.body.ciudad,
    });
    await pedido.save();
    res.json(pedido);
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar pedido' });
  }
});

// ── Historial propio (cliente) ────────────────────────────────────
router.get('/historial', authMidd, async (req, res) => {
  try {
    const pedidos = await Pedido.find({ usuario: req.usuario.id }).sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// ── Todos los pedidos (admin Y empleado) ──────────────────────────
router.get('/todos', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    const pedidos = await Pedido.find()
      .populate('usuario', 'nombres apellidos email')
      .sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

// ── Actualizar estado (admin Y empleado) ──────────────────────────
const ESTADOS_VALIDOS = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];

router.patch('/:id/estado', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    const { estado } = req.body;
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}` });
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

// ── Checklist (solo admin) ────────────────────────────────────────
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

// ── Despachar (solo admin) ────────────────────────────────────────
router.patch('/:id/despachar', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsAdmin(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    const pedido = await Pedido.findById(req.params.id).populate('usuario', 'nombres apellidos email');
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
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

// ── Registrar envio y rastreo (admin Y empleado) ──────────────────
// "despachado" = flujo admin | "enviado" = flujo empleado
const ESTADOS_PERMITIDOS_ENVIO = ['despachado', 'enviado', 'entregado', 'pendiente', 'procesando'];

router.patch('/:id/envio', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    const { transportadoraNombre, numeroRastreo } = req.body;
    if (!String(transportadoraNombre || '').trim() || !String(numeroRastreo || '').trim()) {
      return res.status(400).json({ error: 'Debes ingresar transportadora y numero de rastreo' });
    }
    const pedido = await Pedido.findById(req.params.id).populate('usuario', 'nombres apellidos email');
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (!ESTADOS_PERMITIDOS_ENVIO.includes(pedido.estado)) {
      return res.status(400).json({
        error: 'Solo puedes registrar envio para pedidos en estado "despachado" o "enviado"',
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
    pedido.transportadoraUrl    = transportadora.trackingUrl;
    pedido.numeroRastreo        = String(numeroRastreo || '').trim();
    pedido.enviadoAt            = new Date();
    await pedido.save();

    // Responde inmediatamente — el correo se envía en segundo plano
    res.json(pedido);

    enviarCorreoRastreo({ pedido, usuario: pedido.usuario, transportadora })
      .catch((err) => console.error('Error enviando correo de rastreo:', err));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar el envio' });
  }
});

module.exports = router;
