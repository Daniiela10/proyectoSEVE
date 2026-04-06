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

async function usuarioEsAdmin(userId) {
  const usuario = await Usuario.findById(userId).select('rol esAdmin');
  if (!usuario) return false;
  return usuario.esAdmin || usuario.rol === 'admin';
}

function normalizarPayloadProducto(body = {}) {
  const precioNormalizado = Number(body.precio || 0);
  const precioOfertaNormalizado = body.precioOferta === null || body.precioOferta === undefined || body.precioOferta === ''
    ? null
    : Number(body.precioOferta);
  const enOferta = Boolean(body.enOferta) && Boolean(precioOfertaNormalizado);

  return {
    nombre: String(body.nombre || '').trim(),
    precio: precioNormalizado,
    precioOferta: enOferta ? precioOfertaNormalizado : null,
    categoria: String(body.categoria || '').trim(),
    imagen: String(body.imagen || '').trim(),
    descripcion: Array.isArray(body.descripcion)
      ? body.descripcion.map((item) => String(item || '').trim()).filter(Boolean)
      : String(body.descripcion || '')
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
    colores: Array.isArray(body.colores)
      ? body.colores.map((color) => String(color || '').trim()).filter(Boolean)
      : [],
    enOferta,
    activo: body.activo === undefined ? true : Boolean(body.activo),
  };
}

router.get('/', async (req, res) => {
  try {
    const productos = await Producto.find({ activo: true }).sort({ createdAt: 1 });
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.get('/admin/todos', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const productos = await Producto.find({}).sort({ activo: -1, createdAt: -1 });
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.post('/', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const payload = normalizarPayloadProducto(req.body);
    if (!payload.nombre || !payload.categoria || !payload.precio || !payload.imagen) {
      return res.status(400).json({ error: 'Completa nombre, precio, categoria e imagen del producto' });
    }

    const categoriaValida = await CategoriaProducto.findOne({ nombre: payload.categoria });
    if (!categoriaValida) {
      return res.status(400).json({ error: 'La categoria seleccionada no existe' });
    }

    if (payload.colores.length > 0) {
      const coloresValidos = await ColorProducto.find({ nombre: { $in: payload.colores } }).distinct('nombre');
      if (coloresValidos.length !== payload.colores.length) {
        return res.status(400).json({ error: 'Uno o mas colores seleccionados no existen' });
      }
    }

    const producto = new Producto(payload);
    await producto.save();
    res.json(producto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar producto' });
  }
});

router.put('/:id', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const payload = normalizarPayloadProducto(req.body);
    if (!payload.nombre || !payload.categoria || !payload.precio || !payload.imagen) {
      return res.status(400).json({ error: 'Completa nombre, precio, categoria e imagen del producto' });
    }

    const categoriaValida = await CategoriaProducto.findOne({ nombre: payload.categoria });
    if (!categoriaValida) {
      return res.status(400).json({ error: 'La categoria seleccionada no existe' });
    }

    if (payload.colores.length > 0) {
      const coloresValidos = await ColorProducto.find({ nombre: { $in: payload.colores } }).distinct('nombre');
      if (coloresValidos.length !== payload.colores.length) {
        return res.status(400).json({ error: 'Uno o mas colores seleccionados no existen' });
      }
    }

    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      payload,
      { returnDocument: 'after', runValidators: true }
    );

    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    res.json(producto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

router.patch('/:id/activo', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsAdmin(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      { activo: Boolean(req.body.activo) },
      { returnDocument: 'after' }
    );

    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    res.json(producto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el estado del producto' });
  }
});

module.exports = router;
