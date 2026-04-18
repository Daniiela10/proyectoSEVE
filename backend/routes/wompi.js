const router = require('express').Router();
const crypto = require('crypto');
const Pedido = require('../models/Pedido');
const authMidd = require('../middleware/auth');

const WOMPI_PUBLIC_KEY_FALLBACK = 'pub_test_R3Jz03Tdwipd524EvC32vWNhdXgFJTyI';
const WOMPI_CURRENCY = 'COP';

function obtenerLlavePublica() {
  return String(process.env.WOMPI_PUBLIC_KEY || WOMPI_PUBLIC_KEY_FALLBACK).trim();
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

function resolverEstadoPedido(status) {
  if (status === 'APPROVED') return 'nuevo';
  if (status === 'PENDING') return 'pendiente_pago';
  if (['DECLINED', 'ERROR', 'VOIDED'].includes(status)) return 'cancelado';
  return null;
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
  const frontendUrl = String(process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/\/+$/, '');
  return `${frontendUrl}/pago-resultado?pedidoId=${pedidoId}`;
}

async function consultarTransaccionWompi(transactionId, publicKey = obtenerLlavePublica()) {
  const respuesta = await fetch(`${obtenerBaseApiWompi(publicKey)}/transactions/${transactionId}`, {
    headers: {
      Authorization: `Bearer ${publicKey}`,
      'Content-Type': 'application/json',
    },
  });

  const payload = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || !payload?.data) {
    const detalle = payload?.error?.reason || payload?.error?.message || 'Respuesta invalida de Wompi';
    throw new Error(detalle);
  }

  return payload.data;
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

  pedido.estado = resolverEstadoPedido(transaccion.status) || pedido.estado;
  pedido.wompiEstado = String(transaccion.status || pedido.wompiEstado || '').trim();
  pedido.wompiRef = String(transaccion.id || pedido.wompiRef || '').trim();
  pedido.metodoPago = resolverMetodoPago(transaccion, pedido.metodoPago || 'Wompi');
  await pedido.save();
  return pedido;
}

router.post('/firma', authMidd, async (req, res) => {
  try {
    const { pedidoId, total } = req.body;
    if (!pedidoId) {
      return res.status(400).json({ error: 'Falta el pedido para generar la firma' });
    }

    const integritySecret = String(process.env.WOMPI_INTEGRITY_SECRET || '').trim();
    const publicKey = obtenerLlavePublica();
    if (!integritySecret || !publicKey) {
      return res.status(500).json({ error: 'Wompi no configurado en el servidor' });
    }

    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (String(pedido.usuario) !== String(req.usuario.id)) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    if (pedido.estado !== 'pendiente_pago') {
      return res.status(400).json({ error: 'Este pedido ya no esta disponible para iniciar pago' });
    }

    const totalEsperado = Math.round(Number(pedido.total) * 100);
    const totalRecibido = Math.round(Number(total || pedido.total) * 100);
    if (totalEsperado !== totalRecibido) {
      return res.status(400).json({ error: 'El total del pedido no coincide con el total a pagar' });
    }

    const firma = crypto
      .createHash('sha256')
      .update(`${pedido._id}${totalEsperado}${WOMPI_CURRENCY}${integritySecret}`)
      .digest('hex');

    res.json({
      firma,
      referencia: String(pedido._id),
      amountInCents: totalEsperado,
      currency: WOMPI_CURRENCY,
      publicKey,
      checkoutUrl: obtenerCheckoutUrl(publicKey),
      redirectUrl: obtenerRedirectUrl(pedido._id),
      expirationTime: obtenerExpirationTime(),
    });
  } catch (err) {
    console.error('Error generando firma Wompi:', err);
    res.status(500).json({ error: 'Error al generar la firma de pago' });
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
