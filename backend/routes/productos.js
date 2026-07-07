const router   = require('express').Router();
const multer   = require('multer');
const ExcelJS  = require('exceljs');
const cloudinary = require('cloudinary').v2;
const Producto = require('../models/Producto');
const Usuario  = require('../models/Usuario');
const CategoriaProducto = require('../models/CategoriaProducto');
const ColorProducto = require('../models/ColorProducto');
const authMidd = require('../middleware/auth');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

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
  const precioOfertaNormalizado =
    body.precioOferta === null || body.precioOferta === undefined || body.precioOferta === ''
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
    imagenes: Array.isArray(body.imagenes) ? body.imagenes.filter(Boolean) : [],
    imagenesColor: (body.imagenesColor && typeof body.imagenesColor === 'object' && !Array.isArray(body.imagenesColor))
      ? body.imagenesColor
      : {},
    precioMayorista: body.precioMayorista !== null && body.precioMayorista !== undefined && body.precioMayorista !== ''
      ? Number(body.precioMayorista)
      : null,
    minimoMayorista: body.minimoMayorista ? Number(body.minimoMayorista) : 4,
    enOferta,
    activo: body.activo === undefined ? true : Boolean(body.activo),
  };
}

// ── Helpers para importación desde Excel ──────────────────────────
function normalizarNombreColumna(valor = '') {
  return String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function valorCelda(valor) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'object') {
    if (Array.isArray(valor.richText)) return valor.richText.map((rt) => rt.text).join('');
    if (valor.result !== undefined) return valor.result;
    if (valor.text !== undefined) return valor.text;
    if (valor instanceof Date) return valor;
  }
  return valor;
}

function leerCelda(row, nombre) {
  const buscado = normalizarNombreColumna(nombre);
  const key = Object.keys(row).find((col) => normalizarNombreColumna(col) === buscado);
  return key ? row[key] : '';
}

function normalizarNumero(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;

  let texto = String(valor).trim();
  if (!texto) return null;
  texto = texto.replace(/[^\d,.\-]/g, '');

  if (texto.includes(',') && texto.includes('.')) {
    texto = texto.replace(/\./g, '').replace(',', '.');
  } else if (texto.includes(',')) {
    texto = texto.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(texto)) {
    texto = texto.replace(/\./g, '');
  }

  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : null;
}

function normalizarProductoExcel(row, indice) {
  const referencia = String(leerCelda(row, 'Referencia') || '').trim();
  const nombre = String(leerCelda(row, 'Nombre') || '').trim();
  const categoria = String(leerCelda(row, 'Categoría') || '').trim();
  const descripcion = String(leerCelda(row, 'Descripción') || '').trim();
  const capacidad = String(leerCelda(row, 'Capacidad') || '').trim();
  const unidadEmpaque = String(leerCelda(row, 'U/E') || '').trim();
  const precioDetal = normalizarNumero(leerCelda(row, 'Precio e-commerce detal'));
  const precioMayorista = normalizarNumero(leerCelda(row, 'Precio e-commerce x mayor'));

  const errores = [];
  if (!referencia) errores.push('Referencia vacía');
  if (!nombre) errores.push('Nombre vacío');
  if (!categoria) errores.push('Categoría vacía');
  if (!precioDetal || precioDetal <= 0) errores.push('Precio e-commerce detal inválido');

  const descripcionProducto = [
    descripcion,
    capacidad ? `Capacidad: ${capacidad}` : '',
    unidadEmpaque ? `U/E: ${unidadEmpaque}` : '',
  ].filter(Boolean);

  return {
    fila: indice + 2,
    errores,
    producto: {
      nombre: nombre || referencia,
      precio: precioDetal || 0,
      precioOferta: null,
      categoria,
      imagen: '',
      imagenes: [],
      imagenesColor: {},
      descripcion: descripcionProducto,
      colores: [],
      precioMayorista: precioMayorista && precioMayorista > 0 ? precioMayorista : null,
      minimoMayorista: 4,
      enOferta: false,
      activo: true,
    },
  };
}

function subirImagenBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'seve-productos-excel' },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// ── GET todos (público) ───────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const productos = await Producto.find({ activo: true }).sort({ createdAt: 1 }).lean();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// ── GET admin/todos (staff) ───────────────────────────────────────
router.get('/admin/todos', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    const productos = await Producto.find({}).sort({ activo: -1, createdAt: -1 }).lean();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// ── POST crear (staff) ────────────────────────────────────────────
router.post('/', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const payload = normalizarPayloadProducto(req.body);
    const tieneImagenColor = payload.imagenesColor && typeof payload.imagenesColor === 'object'
      && Object.values(payload.imagenesColor).some((v) => [].concat(v || []).some(Boolean));
    if (!payload.nombre || !payload.categoria || !payload.precio || (!payload.imagen && !tieneImagenColor)) {
      return res.status(400).json({ error: 'Completa nombre, precio, categoria e imagen (o sube al menos una foto por color)' });
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

// ── POST importar desde Excel (staff) ─────────────────────────────
router.post('/importar-excel', authMidd, uploadExcel.single('archivo'), async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'Selecciona un archivo Excel' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const hoja = workbook.worksheets[0];
    if (!hoja) {
      return res.status(400).json({ error: 'El archivo no tiene hojas para importar' });
    }

    // Mapa columna -> nombre de encabezado (fila 1)
    const headerRow = hoja.getRow(1);
    const encabezados = {};
    headerRow.eachCell((cell, colNumber) => {
      encabezados[colNumber] = valorCelda(cell.value);
    });

    // Filas de datos (desde la fila 2)
    const filas = [];
    for (let numeroFila = 2; numeroFila <= hoja.rowCount; numeroFila += 1) {
      const row = hoja.getRow(numeroFila);
      if (row.cellCount === 0) continue;

      const rowObj = {};
      let tieneDatos = false;
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const nombreColumna = encabezados[colNumber];
        if (!nombreColumna) return;
        const val = valorCelda(cell.value);
        if (val !== '' && val !== null && val !== undefined) tieneDatos = true;
        rowObj[nombreColumna] = val;
      });

      if (tieneDatos) {
        filas.push({ numeroFila, rowObj });
      }
    }

    if (filas.length === 0) {
      return res.status(400).json({ error: 'El archivo no tiene productos para importar' });
    }

    // Imágenes incrustadas: una por fila, mapeadas por número de fila de Excel
    const imagenesPorFila = {};
    const imagenesHoja = hoja.getImages ? hoja.getImages() : [];
    imagenesHoja.forEach((img) => {
      const filaExcel = Math.floor(img.range.tl.row) + 1;
      if (!imagenesPorFila[filaExcel]) {
        imagenesPorFila[filaExcel] = img.imageId;
      }
    });

    const procesadas = filas.map(({ numeroFila, rowObj }, indice) => {
      const resultado = normalizarProductoExcel(rowObj, indice);
      resultado.fila = numeroFila;
      resultado.imageId = imagenesPorFila[numeroFila] ?? null;
      return resultado;
    });

    const rechazados = procesadas
      .filter((item) => item.errores.length > 0)
      .map((item) => ({ fila: item.fila, errores: item.errores }));
    const validos = procesadas.filter((item) => item.errores.length === 0);

    if (validos.length === 0) {
      return res.status(400).json({
        error: 'No se encontró ningún producto válido en el Excel',
        rechazados,
      });
    }

    // Subir a Cloudinary las imágenes de los productos válidos que tengan foto
    for (const item of validos) {
      if (item.imageId === null) continue;
      try {
        const imagen = workbook.getImage(item.imageId);
        const url = await subirImagenBuffer(imagen.buffer);
        item.producto.imagen = url;
        item.producto.imagenes = [url];
      } catch (errImagen) {
        console.error(`Error subiendo imagen de la fila ${item.fila}:`, errImagen);
        // Si falla la subida de la imagen, el producto se crea igual sin foto
      }
    }

    const categoriasExcel = [...new Set(validos.map((item) => item.producto.categoria))];
    const categoriasExistentes = await CategoriaProducto.find({ nombre: { $in: categoriasExcel } }).distinct('nombre');
    const faltantes = categoriasExcel.filter((nombre) => !categoriasExistentes.includes(nombre));
    if (faltantes.length > 0) {
      await CategoriaProducto.insertMany(
        faltantes.map((nombre) => ({ nombre, imagen: '' })),
        { ordered: false }
      ).catch((err) => {
        if (err.code !== 11000 && err.writeErrors?.some((e) => e.code !== 11000)) throw err;
      });
    }

    const creados = await Producto.insertMany(validos.map((item) => item.producto), { ordered: false });

    res.status(201).json({
      mensaje: 'Importación completada',
      creados: creados.length,
      rechazados: rechazados.length,
      categoriasCreadas: faltantes.length,
      rechazados,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al importar productos desde Excel' });
  }
});

// ── PUT editar (staff) ────────────────────────────────────────────
router.put('/:id', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const payload = normalizarPayloadProducto(req.body);
    const tieneImagenColor = payload.imagenesColor && typeof payload.imagenesColor === 'object'
      && Object.values(payload.imagenesColor).some((v) => [].concat(v || []).some(Boolean));
    if (!payload.nombre || !payload.categoria || !payload.precio || (!payload.imagen && !tieneImagenColor)) {
      return res.status(400).json({ error: 'Completa nombre, precio, categoria e imagen (o sube al menos una foto por color)' });
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

// ── PATCH activo (staff — empleado Y admin) ───────────────────────
router.patch('/:id/activo', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
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

// ── DELETE eliminar (staff) ───────────────────────────────────────
router.delete('/:id', authMidd, async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});

module.exports = router;
