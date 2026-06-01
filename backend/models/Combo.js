const mongoose = require('mongoose');

const comboSchema = new mongoose.Schema({
  nombre:      { type: String, required: true },
  descripcion: { type: String, default: '' },
  precio:      { type: Number, required: true },
  imagen:      { type: String, default: '' },
  activo:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Combo', comboSchema);
