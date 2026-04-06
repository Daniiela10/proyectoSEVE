const mongoose = require('mongoose');

const transportadoraSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true, trim: true },
  trackingUrl: { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Transportadora', transportadoraSchema);
