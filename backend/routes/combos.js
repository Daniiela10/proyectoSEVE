const router  = require('express').Router();
const Combo   = require('../models/Combo');
const Usuario = require('../models/Usuario');
const authMidd = require('../middleware/auth');

async function usuarioEsStaff(userId) {
  const usuario = await Usuario.findById(userId).select('rol esAdmin');
  if (!usuario) return false;
  return usuario.esAdmin || usuario.rol === 'admin' || usuario.rol === 'empleado';
}

async function usuarioEsAdmin(userId) {
  const usuario = await Usuario.findById(userId).select('rol esAdmin');
  if (!usuario) return false;
  return usuario.esAdmin || usuario.rol === 'admin';
}

// GET público — combos activos
router.get('/', async (req, res) => {
  try {
    const combos = await Combo.find({ activo: true }).sort({ createdAt: -1 }).lean();
    res.json(combos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener combos' });
  }
});

// GET staff — todos los combos
router.get('/admin/todos', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    const combos = await Combo.find().sort({ activo: -1, createdAt: -1 }).lean();
    res.json(combos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener combos' });
  }
});

// POST — crear combo (staff)
router.post('/', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    const { nombre, descripcion, precio, imagen } = req.body;
    if (!String(nombre || '').trim()) return res.status(400).json({ error: 'El nombre es requerido' });
    if (!precio || isNaN(Number(precio))) return res.status(400).json({ error: 'El precio es requerido' });

    const precioOfertaNum = req.body.precioOferta !== undefined && req.body.precioOferta !== '' ? Number(req.body.precioOferta) : null;
    const enOferta = Boolean(req.body.enOferta) && precioOfertaNum !== null;
    const combo = await Combo.create({
      nombre: String(nombre).trim(),
      descripcion: String(descripcion || '').trim(),
      precio: Number(precio),
      precioOferta: enOferta ? precioOfertaNum : null,
      enOferta,
      imagen: String(req.body.imagen || '').trim(),
      imagenes: Array.isArray(req.body.imagenes) ? req.body.imagenes.filter(Boolean) : [],
      activo: true,
    });
    res.status(201).json(combo);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear combo' });
  }
});

// PUT — editar combo (staff)
router.put('/:id', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    const { nombre, descripcion, precio, activo } = req.body;
    if (!String(nombre || '').trim()) return res.status(400).json({ error: 'El nombre es requerido' });
    if (!precio || isNaN(Number(precio))) return res.status(400).json({ error: 'El precio es requerido' });

    const precioOfertaNum = req.body.precioOferta !== undefined && req.body.precioOferta !== '' ? Number(req.body.precioOferta) : null;
    const enOferta = Boolean(req.body.enOferta) && precioOfertaNum !== null;

    const combo = await Combo.findByIdAndUpdate(
      req.params.id,
      {
        nombre: String(nombre).trim(),
        descripcion: String(descripcion || '').trim(),
        precio: Number(precio),
        precioOferta: enOferta ? precioOfertaNum : null,
        enOferta,
        imagen: String(req.body.imagen || '').trim(),
        imagenes: Array.isArray(req.body.imagenes) ? req.body.imagenes.filter(Boolean) : [],
        activo: activo !== undefined ? Boolean(activo) : true,
      },
      { new: true }
    );
    if (!combo) return res.status(404).json({ error: 'Combo no encontrado' });
    res.json(combo);
  } catch (err) {
    res.status(500).json({ error: 'Error al editar combo' });
  }
});

// PATCH — activar/desactivar (staff)
router.patch('/:id/activo', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    const combo = await Combo.findByIdAndUpdate(
      req.params.id,
      { activo: Boolean(req.body.activo) },
      { new: true }
    );
    if (!combo) return res.status(404).json({ error: 'Combo no encontrado' });
    res.json(combo);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar combo' });
  }
});

// DELETE — eliminar (admin)
router.delete('/:id', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsAdmin(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    await Combo.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Combo eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar combo' });
  }
});

module.exports = router;
