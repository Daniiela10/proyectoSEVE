const router = require('express').Router();
const Departamento = require('../models/Departamento');
const BancoPSE = require('../models/BancoPSE');
const CategoriaProducto = require('../models/CategoriaProducto');
const ColorProducto = require('../models/ColorProducto');
const Transportadora = require('../models/Transportadora');

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
    const categorias = await CategoriaProducto.find({}, { nombre: 1, _id: 0 }).sort({ nombre: 1 });
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener categorias de producto' });
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
