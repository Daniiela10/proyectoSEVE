const router   = require('express').Router();
const Producto = require('../models/Producto');
const Usuario  = require('../models/Usuario');
const CategoriaProducto = require('../models/CategoriaProducto');
const ColorProducto = require('../models/ColorProducto');
const authMidd = require('../middleware/auth');

async function usuarioEsStaff(userId) {
  const usuario = await Usuario.findById(userId).select('rol esAdmin');
  if (!usuario) return false;
  return usuario.esAdmin || usuario.rol === 'admin' || usuario.rol === 'empleado';
}

function normalizarPayloadProducto(body = {}) {
  const precioNormalizado = Number(body.precio || 0);
  const precioOfertaNormalizado =
    body.precioOferta === null || body.precioOferta === undefined || body.precioOferta === ''
      ? null : Number(body.precioOferta);
  const enOferta = Boolean(body.enOferta) && Boolean(precioOfertaNormalizado);

  const precioMayorista =
    body.precioMayorista === null || body.precioMayorista === undefined || body.precioMayorista === ''
      ? null : Number(body.precioMayorista);

  const minimoMayorista =
    body.minimoMayorista === null || body.minimoMayorista === undefined || body.minimoMayorista === ''
      ? 48 : Number(body.minimoMayorista);

  // imagenes: array de URLs. Si viene vacío usa imagen principal como fallback
  const imagenes = Array.isArray(body.imagenes)
    ? body.imagenes.filter(Boolean)
    : [];

  // imagen principal = primera del array, o la que venía antes
  const imagen = imagenes[0] || String(body.imagen || '').trim();

  return {
    nombre: String(body.nombre || '').trim(),
    precio: precioNormalizado,
    precioOferta: enOferta ? precioOfertaNormalizado : null,
    precioMayorista,
    minimoMayorista,
    categoria: String(body.categoria || '').trim(),
    imagen,
    imagenes,
    descripcion: Array.isArray(body.descripcion)
      ? body.descripcion.map((item) => String(item || '').trim()).filter(Boolean)
      : String(body.descripcion || '').split('\n').map((item) => item.trim()).filter(Boolean),
    colores: Array.isArray(body.colores)
      ? body.colores.map((color) => String(color || '').trim()).filter(Boolean)
      : [],
    enOferta,
    activo: body.activo === undefined ? true : Boolean(body.activo),
  };
}

// GET todos (público)
router.get('/', async (req, res) => {
  try {
    const productos = await Producto.find({ activo: true }).sort({ createdAt: 1 });
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET admin/todos (staff)
router.get('/admin/todos', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id)))
      return res.status(403).json({ error: 'Sin permisos' });
    const productos = await Producto.find({}).sort({ activo: -1, createdAt: -1 });
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// POST crear (staff)
router.post('/', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id)))
      return res.status(403).json({ error: 'Sin permisos' });

    const payload = normalizarPayloadProducto(req.body);
    if (!payload.nombre || !payload.categoria || !payload.precio || !payload.imagen)
      return res.status(400).json({ error: 'Completa nombre, precio, categoria e imagen del producto' });

    const categoriaValida = await CategoriaProducto.findOne({ nombre: payload.categoria });
    if (!categoriaValida)
      return res.status(400).json({ error: 'La categoria seleccionada no existe' });

    if (payload.colores.length > 0) {
      const coloresValidos = await ColorProducto.find({ nombre: { $in: payload.colores } }).distinct('nombre');
      if (coloresValidos.length !== payload.colores.length)
        return res.status(400).json({ error: 'Uno o mas colores seleccionados no existen' });
    }

    const producto = new Producto(payload);
    await producto.save();
    res.json(producto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar producto' });
  }
});

// PUT editar (staff)
router.put('/:id', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id)))
      return res.status(403).json({ error: 'Sin permisos' });

    const payload = normalizarPayloadProducto(req.body);
    if (!payload.nombre || !payload.categoria || !payload.precio || !payload.imagen)
      return res.status(400).json({ error: 'Completa nombre, precio, categoria e imagen del producto' });

    const categoriaValida = await CategoriaProducto.findOne({ nombre: payload.categoria });
    if (!categoriaValida)
      return res.status(400).json({ error: 'La categoria seleccionada no existe' });

    if (payload.colores.length > 0) {
      const coloresValidos = await ColorProducto.find({ nombre: { $in: payload.colores } }).distinct('nombre');
      if (coloresValidos.length !== payload.colores.length)
        return res.status(400).json({ error: 'Uno o mas colores seleccionados no existen' });
    }

    const producto = await Producto.findByIdAndUpdate(
      req.params.id, payload, { returnDocument: 'after', runValidators: true }
    );
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// PATCH activo
router.patch('/:id/activo', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id)))
      return res.status(403).json({ error: 'Sin permisos' });
    const producto = await Producto.findByIdAndUpdate(
      req.params.id, { activo: Boolean(req.body.activo) }, { returnDocument: 'after' }
    );
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar el estado del producto' });
  }
});

// DELETE eliminar
router.delete('/:id', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id)))
      return res.status(403).json({ error: 'Sin permisos' });
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});

module.exports = router;
