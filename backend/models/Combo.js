const mongoose = require('mongoose');

const comboSchema = new mongoose.Schema({
  nombre:       { type: String, required: true },
  descripcion:  { type: mongoose.Schema.Types.Mixed, default: [] },
  precio:       { type: Number, required: true },
  precioOferta: { type: Number, default: null },
  enOferta:     { type: Boolean, default: false },
  imagen:       { type: String, default: '' },
  imagenes:     [{ type: String }],
  activo:       { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Combo', comboSchema);
