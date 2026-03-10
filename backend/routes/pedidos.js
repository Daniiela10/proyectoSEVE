const router   = require('express').Router();
const Pedido   = require('../models/Pedido');
const authMidd = require('../middleware/auth');

router.post('/', authMidd, async (req, res) => {
  try {
    const pedido = new Pedido({
      usuario:    req.usuario.id,
      items:      req.body.items,
      total:      req.body.total,
      metodoPago: req.body.metodoPago,
      direccion:  req.body.direccion,
      ciudad:     req.body.ciudad
    });
    await pedido.save();
    res.json(pedido);
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar pedido' });
  }
});

router.get('/historial', authMidd, async (req, res) => {
  try {
    const pedidos = await Pedido.find({ usuario: req.usuario.id }).sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

router.get('/todos', authMidd, async (req, res) => {
  try {
    if (!req.usuario.esAdmin) return res.status(403).json({ error: 'Sin permisos' });
    const pedidos = await Pedido.find().populate('usuario', 'nombre email').sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

router.patch('/:id/estado', authMidd, async (req, res) => {
  try {
    if (!req.usuario.esAdmin) return res.status(403).json({ error: 'Sin permisos' });
    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id,
      { estado: req.body.estado },
      { new: true }
    );
    res.json(pedido);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

module.exports = router;