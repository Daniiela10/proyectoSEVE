const router   = require('express').Router();
const Producto = require('../models/Producto');
const authMidd = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const productos = await Producto.find({ activo: true });
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.post('/', authMidd, async (req, res) => {
  try {
    if (!req.usuario.esAdmin) return res.status(403).json({ error: 'Sin permisos' });
    const producto = new Producto(req.body);
    await producto.save();
    res.json(producto);
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar producto' });
  }
});

module.exports = router;