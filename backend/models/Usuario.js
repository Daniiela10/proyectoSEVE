const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombres:      { type: String, required: true, default: '' },
    apellidos:    { type: String, required: true, default: '' },
    email:        { type: String, required: true, unique: true },
    password:     { type: String, required: true },
    telefono:     { type: String, default: '' },
    direccion:    { type: String, default: '' },
    barrio:       { type: String, default: '' },
    ciudad:       { type: String, default: '' },
    municipio:    { type: String, default: '' },
    esAdmin:      { type: Boolean, default: false },
    verificationToken: { type: String,  default: null  },
    isVerified:        { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);
