const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  nombre:           { type: String, required: true },
  precio:           { type: Number, required: true },
  precioOferta:     { type: Number, default: null },
  precioMayorista:  { type: Number, default: null },  
  minimoMayorista:  { type: Number, default: 48 }, 
  categoria:        { type: String, required: true },
  imagen:           { type: String },        
  imagenes:         [{ type: String }], 
  descripcion:      [{ type: String }],
  colores:          [{ type: String }],
  enOferta:         { type: Boolean, default: false },
  activo:           { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Producto', productoSchema);
