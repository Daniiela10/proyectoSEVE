const mongoose = require('mongoose');

const categoriaProductoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true, trim: true },
  imagen: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('CategoriaProducto', categoriaProductoSchema);
