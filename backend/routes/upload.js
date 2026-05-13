const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post('/', auth, async (req, res) => {
  try {
    const { imagen, carpeta = 'seve-aluminios' } = req.body;
    if (!imagen) return res.status(400).json({ error: 'No se recibió imagen' });

    const result = await cloudinary.uploader.upload(imagen, {
      folder: carpeta,
      transformation: [{ quality: 'auto', fetch_format: 'auto', width: 1200, crop: 'limit' }],
    });

    res.json({ url: result.secure_url });
  } catch (err) {
    console.error('Error al subir imagen a Cloudinary:', err);
    res.status(500).json({ error: 'No se pudo subir la imagen' });
  }
});

module.exports = router;
