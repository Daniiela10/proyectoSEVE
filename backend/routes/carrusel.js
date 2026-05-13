const router        = require('express').Router();
const SlideCarrusel = require('../models/SlideCarrusel');
const Usuario       = require('../models/Usuario');
const authMidd      = require('../middleware/auth');

async function soloAdmin(req, res, next) {
  const user = await Usuario.findById(req.usuario.id).select('rol esAdmin');
  if (!user || (!user.esAdmin && user.rol !== 'admin')) {
    return res.status(403).json({ error: 'Solo administradores' });
  }
  next();
}

// GET público — slides activos ordenados
router.get('/', async (req, res) => {
  try {
    const slides = await SlideCarrusel.find({ activo: true }).sort({ orden: 1, createdAt: 1 });
    res.json(slides);
  } catch {
    res.status(500).json({ error: 'Error al cargar slides' });
  }
});

// GET admin — todos los slides
router.get('/admin', authMidd, soloAdmin, async (req, res) => {
  try {
    const slides = await SlideCarrusel.find().sort({ orden: 1, createdAt: 1 });
    res.json(slides);
  } catch {
    res.status(500).json({ error: 'Error al cargar slides' });
  }
});

// POST — crear slide
router.post('/', authMidd, soloAdmin, async (req, res) => {
  try {
    const { imagen, titulo, subtitulo, orden, activo } = req.body;
    if (!imagen) return res.status(400).json({ error: 'La imagen es obligatoria' });
    const slide = new SlideCarrusel({
      imagen,
      titulo:    titulo    || '',
      subtitulo: subtitulo || '',
      orden:     Number(orden) || 0,
      activo:    activo !== false,
    });
    await slide.save();
    res.status(201).json(slide);
  } catch {
    res.status(500).json({ error: 'Error al crear slide' });
  }
});

// PUT — actualizar slide
router.put('/:id', authMidd, soloAdmin, async (req, res) => {
  try {
    const { imagen, titulo, subtitulo, orden, activo } = req.body;
    if (!imagen) return res.status(400).json({ error: 'La imagen es obligatoria' });
    const slide = await SlideCarrusel.findByIdAndUpdate(
      req.params.id,
      { imagen, titulo: titulo || '', subtitulo: subtitulo || '', orden: Number(orden) || 0, activo: Boolean(activo) },
      { new: true }
    );
    if (!slide) return res.status(404).json({ error: 'Slide no encontrado' });
    res.json(slide);
  } catch {
    res.status(500).json({ error: 'Error al actualizar slide' });
  }
});

// DELETE — eliminar slide
router.delete('/:id', authMidd, soloAdmin, async (req, res) => {
  try {
    await SlideCarrusel.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error al eliminar slide' });
  }
});

module.exports = router;
