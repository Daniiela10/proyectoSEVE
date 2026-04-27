const router = require('express').Router();
const cloudinary = require('cloudinary').v2;
const authMidd = require('../middleware/auth');
const Usuario = require('../models/Usuario');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function usuarioEsStaff(userId) {
  const usuario = await Usuario.findById(userId).select('rol esAdmin');
  if (!usuario) return false;
  return usuario.esAdmin || usuario.rol === 'admin' || usuario.rol === 'empleado';
}

// POST /api/upload
// Body: { imagen: "data:image/jpeg;base64,..." }
// Devuelve: { url: "https://res.cloudinary.com/..." }
router.post('/', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const { imagen } = req.body;
    if (!imagen) return res.status(400).json({ error: 'No se recibió ninguna imagen' });

    const resultado = await cloudinary.uploader.upload(imagen, {
      folder: 'seve-productos',
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
    });

    res.json({ url: resultado.secure_url });
  } catch (err) {
    console.error('Error subiendo a Cloudinary:', err);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
});

// DELETE /api/upload
// Body: { url: "https://res.cloudinary.com/..." }
router.delete('/', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'No se recibió URL' });

    // Extrae el public_id de la URL de Cloudinary
    const matches = url.match(/seve-productos\/([^.]+)/);
    if (matches) {
      await cloudinary.uploader.destroy(`seve-productos/${matches[1]}`);
    }

    res.json({ mensaje: 'Imagen eliminada' });
  } catch (err) {
    console.error('Error eliminando de Cloudinary:', err);
    res.status(500).json({ error: 'Error al eliminar la imagen' });
  }
});

module.exports = router;
