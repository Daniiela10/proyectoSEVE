const mongoose = require('mongoose');

const colorProductoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('ColorProducto', colorProductoSchema);
