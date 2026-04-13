const router  = require('express').Router();
const crypto  = require('crypto');
const Pedido  = require('../models/Pedido');
const authMidd = require('../middleware/auth');

// ── Variables de entorno necesarias en .env ───────────────────────
// WOMPI_INTEGRITY_SECRET=tu_integrity_secret_de_wompi
// WOMPI_EVENTS_SECRET=tu_events_secret_de_wompi

// ── Generar firma de integridad ───────────────────────────────────
// La firma se calcula así: SHA256( reference + amount_in_cents + currency + integrity_secret )
router.post('/firma', authMidd, async (req, res) => {
  try {
    const { pedidoId, total } = req.body;

    if (!pedidoId || !total) {
      return res.status(400).json({ error: 'Faltan datos para generar la firma' });
    }

    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
    if (!integritySecret) {
      return res.status(500).json({ error: 'Wompi no configurado en el servidor' });
    }

    // Wompi espera: referencia + monto_en_centavos + moneda + secret
    const cadena = `${pedidoId}${total * 100}COP${integritySecret}`;
    const firma = crypto.createHash('sha256').update(cadena).digest('hex');

    res.json({ firma, referencia: pedidoId });
  } catch (err) {
    console.error('Error generando firma Wompi:', err);
    res.status(500).json({ error: 'Error al generar la firma de pago' });
  }
});

// ── Webhook de Wompi ──────────────────────────────────────────────
// Wompi llama a este endpoint cuando un pago cambia de estado.
// Debes configurar esta URL en el panel de Wompi:
// https://tudominio.com/api/pedidos/wompi/webhook
router.post('/webhook', async (req, res) => {
  try {
    const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
    const { event, data, signature } = req.body;

    // Verificar firma del webhook si el secret está configurado
    if (eventsSecret && signature?.checksum) {
      const { properties, checksum } = signature;
      const cadena = properties.map(p => {
        const val = p.split('.').reduce((obj, key) => obj?.[key], req.body);
        return val ?? '';
      }).join('') + eventsSecret;

      const hashCalculado = crypto.createHash('sha256').update(cadena).digest('hex');
      if (hashCalculado !== checksum) {
        console.error('Firma de webhook inválida');
        return res.status(401).json({ error: 'Firma inválida' });
      }
    }

    // Solo procesar transacciones finalizadas
    if (event !== 'transaction.updated') {
      return res.json({ recibido: true });
    }

    const transaccion = data?.transaction;
    if (!transaccion) return res.json({ recibido: true });

    const { reference: pedidoId, status } = transaccion;

    // Actualizar estado del pedido según resultado de Wompi
    let nuevoEstado = null;
    if (status === 'APPROVED') {
      nuevoEstado = 'nuevo'; // pago aprobado → entra al flujo normal
    } else if (status === 'DECLINED' || status === 'ERROR' || status === 'VOIDED') {
      nuevoEstado = 'cancelado'; // pago rechazado → cancelar pedido
    }

    if (nuevoEstado && pedidoId) {
      await Pedido.findByIdAndUpdate(pedidoId, {
        estado:      nuevoEstado,
        metodoPago:  `Wompi - ${transaccion.payment_method_type || ''}`.trim(),
        wompiRef:    transaccion.id,
      });
    }

    res.json({ recibido: true });
  } catch (err) {
    console.error('Error en webhook Wompi:', err);
    // Siempre responder 200 a Wompi para que no reintente
    res.json({ recibido: true });
  }
});

module.exports = router;
