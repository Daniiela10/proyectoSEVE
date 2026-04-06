const mongoose = require('mongoose');

const departamentoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true, trim: true },
  ciudades: [{ type: String, required: true, trim: true }],
}, { timestamps: true });

module.exports = mongoose.model('Departamento', departamentoSchema);
