const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  nombre:    { type: String, required: true },
  precio:    { type: Number, required: true },
  categoria: { type: String, required: true },
  imagen:    { type: String },
  enOferta:  { type: Boolean, default: false },
  activo:    { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Producto', productoSchema);