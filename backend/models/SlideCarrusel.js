const mongoose = require('mongoose');

const slideCarruselSchema = new mongoose.Schema({
  imagen:    { type: String, required: true },
  titulo:    { type: String, default: '' },
  subtitulo: { type: String, default: '' },
  orden:     { type: Number, default: 0 },
  activo:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('SlideCarrusel', slideCarruselSchema);
