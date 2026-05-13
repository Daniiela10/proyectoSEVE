const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  tipo: { type: String, enum: ['normal', 'mayorista'], default: 'normal' },
  items: [{
    productoId: String,
    nombre: String,
    precio: Number,
    cantidad: Number,
    checklist: { type: Boolean, default: false },
  }],
  total: { type: Number, required: true },
  metodoPago: { type: String, required: true },
  direccion: { type: String },
  ciudad: { type: String },
  estado: {
    type: String,
    default: 'nuevo',
    enum: [
      'pendiente_pago',
      'nuevo',
      'espera',
      'despachado',
      'pendiente',
      'procesando',
      'enviado',
      'entregado',
      'cancelado',
    ],
  },
  transportadoraNombre: { type: String, default: '' },
  transportadoraUrl: { type: String, default: '' },
  numeroRastreo: { type: String, default: '' },
  enviadoAt: { type: Date, default: null },
  wompiRef: { type: String, default: '' },
  wompiEstado: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Pedido', pedidoSchema);
