const router = require('express').Router();
const mongoose = require('mongoose');
const Pedido = require('../models/Pedido');
const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Transportadora = require('../models/Transportadora');
const authMidd = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const { describeEmailError, getEmailFrom, sendMail } = require('../utils/mailer');
const { tienePermiso } = require('../utils/permisos');

const logoPath = path.resolve(__dirname, '../../seve-app/frontend/public/img/Logo.png');
const logoCid = 'seve-logo';

async function usuarioEsAdmin(userId) {
  const usuario = await Usuario.findById(userId).select('rol esAdmin permisos');
  if (!usuario) return false;
  return tienePermiso(usuario, 'gestion-pedidos');
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

async function adjuntarImagenesPedidos(pedidos) {
  const esArray = Array.isArray(pedidos);
  const lista = esArray ? pedidos : [pedidos];

  const idsValidos = new Set();
  lista.forEach((pedido) => {
    (pedido?.items || []).forEach((item) => {
      if (item.productoId && mongoose.Types.ObjectId.isValid(item.productoId)) {
        idsValidos.add(item.productoId);
      }
    });
  });

  if (idsValidos.size > 0) {
    const productos = await Producto.find({ _id: { $in: [...idsValidos] } })
      .select('imagen imagenes')
      .lean();

    const mapaImagenes = {};
    productos.forEach((p) => {
      mapaImagenes[String(p._id)] = p.imagen || p.imagenes?.[0] || '';
    });

    lista.forEach((pedido) => {
      if (!pedido) return;
      pedido.items = (pedido.items || []).map((item) => ({
        ...item,
        imagen: mapaImagenes[item.productoId] || '',
      }));
    });
  }

  return esArray ? lista : lista[0];
}

async function enviarCorreoRastreo({ pedido, usuario, transportadora }) {
  if (!usuario?.email) return;
  const trackingLink = `${transportadora.trackingUrl}${pedido.numeroRastreo}`;
  const pedidoId = pedido._id.toString().slice(-6).toUpperCase();

  await sendMail({
    from: getEmailFrom(),
    to: usuario.email,
    subject: `Tu pedido #${pedidoId} ya va en camino - SEVE Aluminios`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2f2f2;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- HEADER -->
        <tr>
          <td style="background:#8b1a10;padding:28px 40px;text-align:center;">
            <img src="https://sevealuminios.com/img/Logo.png" alt="SEVE Aluminios" style="height:64px;" />
          </td>
        </tr>

        <!-- BANNER -->
        <tr>
          <td style="background:#c0392b;padding:14px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:14px;letter-spacing:1px;text-transform:uppercase;font-weight:700;">📦 Tu pedido está en camino</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:36px 40px 24px;">
            <h2 style="margin:0 0 8px;color:#222222;font-size:22px;">Hola, ${usuario.nombres || 'cliente'}.</h2>
            <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.7;">
              Tu pedido ha sido despachado exitosamente. A continuación encuentras los datos para hacer seguimiento:
            </p>

            <!-- INFO CARD -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:10px;border:1px solid #eeeeee;margin-bottom:28px;">
              <tr>
                <td style="padding:24px 28px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:10px 0;border-bottom:1px solid #eeeeee;">
                        <span style="color:#888888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Número de pedido</span><br>
                        <strong style="color:#222222;font-size:16px;">#${pedidoId}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0;border-bottom:1px solid #eeeeee;">
                        <span style="color:#888888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Transportadora</span><br>
                        <strong style="color:#222222;font-size:16px;">${transportadora.nombre}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0;">
                        <span style="color:#888888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Número de rastreo</span><br>
                        <strong style="color:#c0392b;font-size:20px;letter-spacing:2px;">${pedido.numeroRastreo}</strong>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- BUTTON -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <a href="${trackingLink}" style="display:inline-block;background:#c0392b;color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:8px;font-weight:700;font-size:15px;">
                    Rastrear mi pedido
                  </a>
                </td>
              </tr>
            </table>

            <p style="color:#aaaaaa;font-size:12px;line-height:1.7;margin:0;">
              Si el botón no funciona, copia este enlace en tu navegador:<br>
              <a href="${trackingLink}" style="color:#c0392b;word-break:break-all;">${trackingLink}</a>
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
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
    await adjuntarImagenesPedidos(pedidos);
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
    await adjuntarImagenesPedidos(pedidos);
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
    await adjuntarImagenesPedidos(pedido);
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
    const pedidoConImagenes = await adjuntarImagenesPedidos(pedido.toObject());
    res.json(pedidoConImagenes);
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
    const pedidoConImagenes = await adjuntarImagenesPedidos(pedido.toObject());
    res.json(pedidoConImagenes);
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
    const pedidoConImagenes = await adjuntarImagenesPedidos(pedido.toObject());
    res.json(pedidoConImagenes);
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
    await adjuntarImagenesPedidos(respuesta);

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
    await adjuntarImagenesPedidos(respuesta);
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
