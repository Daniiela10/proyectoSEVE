const router = require('express').Router();
const Departamento = require('../models/Departamento');
const BancoPSE = require('../models/BancoPSE');
const CategoriaProducto = require('../models/CategoriaProducto');
const ColorProducto = require('../models/ColorProducto');
const Transportadora = require('../models/Transportadora');
const Usuario = require('../models/Usuario');
const auth = require('../middleware/auth');
const { tienePermiso } = require('../utils/permisos');

async function soloAdmin(req, res, next) {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('rol esAdmin permisos');
    if (!tienePermiso(usuario, 'gestion-categorias') && !tienePermiso(usuario, 'gestion-carrusel')) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
}

router.get('/departamentos', async (req, res) => {
  try {
    const departamentos = await Departamento.find({}, { nombre: 1, ciudades: 1, _id: 0 }).sort({ nombre: 1 });
    res.json(departamentos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener departamentos' });
  }
});

router.get('/bancos-pse', async (req, res) => {
  try {
    const bancos = await BancoPSE.find({}, { nombre: 1, _id: 0 }).sort({ nombre: 1 });
    res.json(bancos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener bancos PSE' });
  }
});

router.get('/categorias-producto', async (req, res) => {
  try {
    const categorias = await CategoriaProducto.find({}, { nombre: 1, imagen: 1, _id: 1 }).sort({ nombre: 1 });
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener categorias de producto' });
  }
});

router.get('/categorias-producto/admin', auth, soloAdmin, async (req, res) => {
  try {
    const categorias = await CategoriaProducto.find({}, { nombre: 1, imagen: 1 }).sort({ nombre: 1 });
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener categorias de producto' });
  }
});

router.post('/categorias-producto', auth, soloAdmin, async (req, res) => {
  try {
    const { nombre, imagen } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido' });
    const categoria = await CategoriaProducto.create({ nombre: nombre.trim(), imagen: imagen || '' });
    res.status(201).json(categoria);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

router.patch('/categorias-producto/:id', auth, soloAdmin, async (req, res) => {
  try {
    const categoria = await CategoriaProducto.findByIdAndUpdate(
      req.params.id,
      { imagen: req.body.imagen || '' },
      { new: true, runValidators: true }
    );
    if (!categoria) return res.status(404).json({ error: 'Categoria no encontrada' });
    res.json(categoria);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar categoria' });
  }
});

router.put('/categorias-producto/:id', auth, soloAdmin, async (req, res) => {
  try {
    const { nombre, imagen } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido' });
    const categoria = await CategoriaProducto.findByIdAndUpdate(
      req.params.id,
      { nombre: nombre.trim(), imagen: imagen ?? '' },
      { new: true, runValidators: true }
    );
    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(categoria);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
});

router.delete('/categorias-producto/:id', auth, soloAdmin, async (req, res) => {
  try {
    const categoria = await CategoriaProducto.findByIdAndDelete(req.params.id);
    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

router.get('/colores-producto', async (req, res) => {
  try {
    const colores = await ColorProducto.find({}, { nombre: 1, _id: 0 }).sort({ nombre: 1 });
    res.json(colores);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener colores de producto' });
  }
});

router.get('/transportadoras', async (req, res) => {
  try {
    const transportadoras = await Transportadora.find({}, { nombre: 1, trackingUrl: 1, _id: 0 }).sort({ nombre: 1 });
    res.json(transportadoras);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener transportadoras' });
  }
});

module.exports = router;
