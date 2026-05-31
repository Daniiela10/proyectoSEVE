const router = require('express').Router();
const crypto = require('crypto');
const path = require('path');
const Pedido = require('../models/Pedido');
const Usuario = require('../models/Usuario');
const authMidd = require('../middleware/auth');
const { createMailer, getEmailFrom } = require('../utils/mailer');

const WOMPI_CURRENCY = 'COP';
const logoPath = path.resolve(__dirname, '../../seve-app/frontend/public/img/Logo.png');
const logoCid = 'seve-logo';

function obtenerLlavePublica() {
  const key = String(process.env.WOMPI_PUBLIC_KEY || '').trim();

  if (!key) {
    throw new Error('Falta WOMPI_PUBLIC_KEY en variables de entorno');
  }

  return key;
}

function esSandbox(publicKey = '') {
  return publicKey.startsWith('pub_test_');
}

function obtenerBaseApiWompi(publicKey = obtenerLlavePublica()) {
  return esSandbox(publicKey)
    ? 'https://sandbox.wompi.co/v1'
    : 'https://production.wompi.co/v1';
}

function obtenerCheckoutUrl(publicKey = obtenerLlavePublica()) {
  return 'https://checkout.wompi.co/p/';
}

function resolverEstadoOperativo(status, estadoActual = 'nuevo') {
  const estado = String(estadoActual || 'nuevo').trim();
  const estadoEsPagoLegacy = estado === 'pendiente_pago' || estado === 'pago_aprobado';

  if (['DECLINED', 'ERROR', 'VOIDED'].includes(status)) return 'cancelado';
  if (estadoEsPagoLegacy) return 'nuevo';
  return estado || 'nuevo';
}

function normalizarUrlBase(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

function resolverMetodoPago(transaccion = {}, metodoActual = 'Wompi') {
  const tipo = String(transaccion.payment_method_type || '').trim();
  return tipo ? `Wompi - ${tipo}` : metodoActual;
}

function leerPropiedadRuta(objeto, ruta = '') {
  return ruta.split('.').reduce((acc, key) => acc?.[key], objeto);
}

function checksumSeguro(esperado, recibido) {
  const a = Buffer.from(String(esperado || '').toLowerCase());
  const b = Buffer.from(String(recibido || '').toLowerCase());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function construirChecksumEvento(payload, eventsSecret) {
  const propiedades = Array.isArray(payload?.signature?.properties)
    ? payload.signature.properties
    : [];
  const valores = propiedades.map((ruta) => {
    const valor = leerPropiedadRuta(payload?.data || {}, ruta);
    return valor ?? '';
  }).join('');

  return crypto
    .createHash('sha256')
    .update(`${valores}${payload?.timestamp ?? ''}${eventsSecret}`)
    .digest('hex');
}

function obtenerExpirationTime() {
  const minutos = Math.max(5, Number(process.env.WOMPI_EXPIRATION_MINUTES || 30));
  return new Date(Date.now() + minutos * 60 * 1000).toISOString();
}

function obtenerRedirectUrl(pedidoId) {
  const frontendUrl = normalizarUrlBase(process.env.PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173');
  return `${frontendUrl}/pago-resultado?pedidoId=${pedidoId}`;
}

async function consultarTransaccionWompi(transactionId, publicKey = obtenerLlavePublica()) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const respuesta = await fetch(`${obtenerBaseApiWompi(publicKey)}/transactions/${transactionId}`, {
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${publicKey}`,
      'Content-Type': 'application/json',
    },
  }).finally(() => clearTimeout(timeout));

  const payload = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || !payload?.data) {
    const detalle = payload?.error?.reason || payload?.error?.message || 'Respuesta invalida de Wompi';
    throw new Error(detalle);
  }

  return payload.data;
}

function formatearCop(valor) {
  return `$${Number(valor || 0).toLocaleString('es-CO')}`;
}

function construirHtmlFactura({ pedido, usuario, transaccion }) {
  const items = Array.isArray(pedido.items) ? pedido.items : [];
  const subtotal = items.reduce((sum, item) => sum + Number(item.precio || 0) * Number(item.cantidad || 0), 0);
  const cliente = [usuario?.nombres, usuario?.apellidos].filter(Boolean).join(' ').trim() || usuario?.email || 'cliente';

  return `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
      <img src="cid:${logoCid}" alt="SEVE" style="height:48px;margin-bottom:20px" />
      <h2 style="color:#c0392b;margin:0 0 8px">Factura de venta SEVE Aluminios</h2>
      <p style="color:#666;margin:0 0 20px">Pedido #${pedido._id.toString().slice(-6).toUpperCase()}</p>
      <p style="color:#444;line-height:1.6">
        Hola, <strong>${cliente}</strong>. Tu pago fue aprobado y tu pedido ya entro al flujo de preparacion.
      </p>
      <div style="margin:20px 0;padding:14px 16px;background:#f8f8f8;border-radius:10px;color:#333;line-height:1.7">
        <strong>Estado del pago:</strong> ${transaccion?.status || pedido.wompiEstado || 'APPROVED'}<br />
        <strong>Referencia Wompi:</strong> ${transaccion?.id || pedido.wompiRef || 'No disponible'}<br />
        <strong>Metodo:</strong> ${pedido.metodoPago || 'Wompi'}
      </div>
      <table style="width:100%;border-collapse:collapse;margin-top:18px;font-size:13px">
        <thead>
          <tr>
            <th style="text-align:left;padding:10px;border-bottom:1px solid #ddd">Producto</th>
            <th style="text-align:right;padding:10px;border-bottom:1px solid #ddd">Cant.</th>
            <th style="text-align:right;padding:10px;border-bottom:1px solid #ddd">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item) => `
            <tr>
              <td style="padding:10px;border-bottom:1px solid #f0f0f0">${item.nombre || 'Producto'}</td>
              <td style="padding:10px;border-bottom:1px solid #f0f0f0;text-align:right">${item.cantidad || 0}</td>
              <td style="padding:10px;border-bottom:1px solid #f0f0f0;text-align:right">${formatearCop(Number(item.precio || 0) * Number(item.cantidad || 0))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="margin-top:18px;text-align:right;color:#333;line-height:1.7">
        <div>Subtotal: <strong>${formatearCop(subtotal)}</strong></div>
        <div style="font-size:18px;color:#111">Total: <strong>${formatearCop(pedido.total)}</strong></div>
      </div>
      <p style="margin-top:26px;color:#777;font-size:12px;line-height:1.6">
        Este comprobante se envia automaticamente al aprobarse el pago. Si necesitas factura electronica DIAN, responde este correo con tus datos de facturacion.
      </p>
      <p style="color:#999;font-size:12px">Revisa tambien tu carpeta de spam o correo no deseado si esperabas este mensaje.</p>
    </div>
  `;
}

async function enviarFacturaPagoAprobado(pedido, transaccion) {
  if (pedido.facturaEnviadaAt || transaccion?.status !== 'APPROVED') return;
  const usuario = await Usuario.findById(pedido.usuario).select('nombres apellidos email').lean();
  if (!usuario?.email) return;
  await createMailer().sendMail({
    from: getEmailFrom(),
    to: usuario.email,
    subject: `Factura de tu pedido #${pedido._id.toString().slice(-6).toUpperCase()} - SEVE Aluminios`,
    attachments: [{ filename: 'Logo.png', path: logoPath, cid: logoCid }],
    html: construirHtmlFactura({ pedido, usuario, transaccion }),
  });

  pedido.facturaEnviadaAt = new Date();
  await pedido.save();
}

function validarTransaccionContraPedido(pedido, transaccion) {
  if (!pedido) throw new Error('Pedido no encontrado');
  if (!transaccion) throw new Error('Transaccion no encontrada');

  if (String(transaccion.reference) !== String(pedido._id)) {
    throw new Error('La referencia de Wompi no coincide con el pedido');
  }

  if (Number(transaccion.amount_in_cents) !== Math.round(Number(pedido.total) * 100)) {
    throw new Error('El monto de la transaccion no coincide con el pedido');
  }

  if (String(transaccion.currency) !== WOMPI_CURRENCY) {
    throw new Error('La moneda de la transaccion no coincide con la configurada');
  }
}

async function sincronizarPedidoConTransaccion(pedido, transaccion) {
  validarTransaccionContraPedido(pedido, transaccion);

  pedido.estado = resolverEstadoOperativo(transaccion.status, pedido.estado);
  pedido.wompiEstado = String(transaccion.status || pedido.wompiEstado || '').trim();
  pedido.wompiRef = String(transaccion.id || pedido.wompiRef || '').trim();
  pedido.metodoPago = resolverMetodoPago(transaccion, pedido.metodoPago || 'Wompi');
  if (transaccion.status === 'APPROVED' && !pedido.pagoAprobadoAt) {
    pedido.pagoAprobadoAt = new Date();
  }
  await pedido.save();
  await enviarFacturaPagoAprobado(pedido, transaccion).catch((err) => {
    console.error('Error enviando factura de pago aprobado:', err.message || err);
  });
  return pedido;
}

router.post('/firma', authMidd, async (req, res) => {
  try {
    const { pedidoId, total } = req.body;

    if (!pedidoId) {
      return res.status(400).json({ error: 'Falta el pedido para generar la firma' });
    }

    const publicKey = obtenerLlavePublica();

    const integritySecret = String(
      process.env.WOMPI_INTEGRITY_SECRET || ''
    ).trim();

    if (!integritySecret) {
      throw new Error('Falta WOMPI_INTEGRITY_SECRET');
    }

    const pedido = await Pedido.findById(pedidoId);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (String(pedido.usuario) !== String(req.usuario.id)) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const totalEsperado = Math.round(Number(pedido.total) * 100);
    const totalRecibido = Math.round(Number(total || pedido.total) * 100);

    if (totalEsperado !== totalRecibido) {
      return res.status(400).json({
        error: 'El total del pedido no coincide con el total a pagar'
      });
    }

    const expirationTime = obtenerExpirationTime();

    const firma = crypto
      .createHash('sha256')
      .update(
        `${pedido._id}${totalEsperado}${WOMPI_CURRENCY}${expirationTime}${integritySecret}`
      )
      .digest('hex');

    res.json({
      firma,
      referencia: String(pedido._id),
      amountInCents: totalEsperado,
      currency: WOMPI_CURRENCY,
      publicKey,
      checkoutUrl: obtenerCheckoutUrl(publicKey),
      redirectUrl: obtenerRedirectUrl(pedido._id),
      expirationTime,
    });

  } catch (err) {
    console.error('Error generando firma Wompi:', err);

    res.status(500).json({
      error: err.message || 'Error al generar la firma'
    });
  }
});

router.post('/retorno', authMidd, async (req, res) => {
  try {
    const { pedidoId, transactionId } = req.body;
    if (!pedidoId || !transactionId) {
      return res.status(400).json({ error: 'Faltan datos para verificar el pago con Wompi' });
    }

    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (String(pedido.usuario) !== String(req.usuario.id)) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const transaccion = await consultarTransaccionWompi(transactionId);
    const actualizado = await sincronizarPedidoConTransaccion(pedido, transaccion);

    res.json({
      pedido: actualizado,
      estadoPago: actualizado.wompiEstado,
      transactionId: transaccion.id,
    });
  } catch (err) {
    console.error('Error verificando retorno Wompi:', err);
    res.status(500).json({ error: err.message || 'No se pudo verificar el pago con Wompi' });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const { event, data, environment, signature } = req.body;
    const eventsSecret = String(process.env.WOMPI_EVENTS_SECRET || '').trim();

    if (eventsSecret && signature?.checksum) {
      const checksumCalculado = construirChecksumEvento(req.body, eventsSecret);
      if (!checksumSeguro(checksumCalculado, signature.checksum)) {
        console.error('Firma de webhook invalida');
        return res.status(401).json({ error: 'Firma invalida' });
      }
    }

    if (event !== 'transaction.updated') {
      return res.status(200).json({ recibido: true });
    }

    const transaccionEvento = data?.transaction;
    if (!transaccionEvento?.id || !transaccionEvento?.reference) {
      return res.status(200).json({ recibido: true });
    }

    const publicKey = obtenerLlavePublica();
    const ambienteEsperado = esSandbox(publicKey) ? 'test' : 'prod';
    if (environment && environment !== ambienteEsperado) {
      console.error('Webhook de ambiente inesperado:', environment);
      return res.status(200).json({ recibido: true });
    }

    const pedido = await Pedido.findById(transaccionEvento.reference);
    if (!pedido) {
      return res.status(200).json({ recibido: true });
    }

    const transaccion = await consultarTransaccionWompi(transaccionEvento.id, publicKey);
    await sincronizarPedidoConTransaccion(pedido, transaccion);

    res.status(200).json({ recibido: true });
  } catch (err) {
    console.error('Error en webhook Wompi:', err);
    res.status(200).json({ recibido: true });
  }
});

module.exports = router;
