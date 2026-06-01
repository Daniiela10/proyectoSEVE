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
    rol:          { type: String, enum: ['cliente', 'empleado', 'admin'], default: 'cliente' },
    esAdmin:      { type: Boolean, default: false },
    permisos:     { type: [String], default: [] },
    verificationToken: { type: String,  default: null  },
    verificationCode: { type: String, default: null },
    verificationCodeExpiresAt: { type: Date, default: null },
    pendingEmail: { type: String, default: null },
    pendingEmailVerificationCode: { type: String, default: null },
    pendingEmailVerificationExpiresAt: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpiresAt: { type: Date, default: null },
    isVerified:        { type: Boolean, default: false },
    fotoPerfil:        { type: String, default: null },
}, { timestamps: true });

usuarioSchema.pre('save', function() {
    this.esAdmin = this.rol === 'admin';
});

module.exports = mongoose.model('Usuario', usuarioSchema);
