const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
    usuario:    { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    items: [{
    productoId: Number,
    nombre:     String,
    precio:     Number,
    cantidad:   Number
}],
total:      { type: Number, required: true },
metodoPago: { type: String, required: true },
direccion:  { type: String },
ciudad:     { type: String },
estado:     { type: String, default: 'nuevo', enum: ['nuevo','espera','despachado'] }
}, { timestamps: true });

module.exports = mongoose.model('Pedido', pedidoSchema);