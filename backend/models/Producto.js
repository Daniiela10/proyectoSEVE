const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  referencia: { type: String, trim: true, index: true },
  nombre:    { type: String, required: true },
  precio:    { type: Number, required: true },
  precioOferta: { type: Number, default: null },
  categoria: { type: String, required: true },
  imagen:    { type: String },
  imagenes:  [{ type: String }],
  imagenesColor: { type: Object, default: {} },
  descripcion: [{ type: String }],
  colores: [{ type: String }],
  precioMayorista: { type: Number, default: null },
  minimoMayorista: { type: Number, default: 4 },
  enOferta:  { type: Boolean, default: false },
  activo:    { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Producto', productoSchema);
