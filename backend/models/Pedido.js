const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
    usuario:    { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    items: [{
      productoId: String,
      nombre:     String,
      precio:     Number,
      cantidad:   Number,
      checklist:  { type: Boolean, default: false },
    }],
    total:      { type: Number, required: true },
    metodoPago: { type: String, required: true },
    direccion:  { type: String },
    ciudad:     { type: String },
    estado: {
      type: String,
      default: 'nuevo',
      enum: [
        'nuevo',        // recién creado (flujo admin)
        'espera',       // con checklist parcial (flujo admin)
        'despachado',   // despachado por admin
        'pendiente',    // asignado por empleado
        'procesando',   // en preparación por empleado
        'enviado',      // marcado como enviado por empleado
        'entregado',    // confirmado entregado
        'cancelado',    // cancelado
      ],
    },
    transportadoraNombre: { type: String, default: '' },
    transportadoraUrl:    { type: String, default: '' },
    numeroRastreo:        { type: String, default: '' },
    enviadoAt:            { type: Date,   default: null },
    wompiRef:             { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Pedido', pedidoSchema);
