const router   = require('express').Router();
const path     = require('path');
const multer   = require('multer');
const XLSX     = require('xlsx');
const JSZip    = require('jszip');
const cloudinary = require('cloudinary').v2;
const Producto = require('../models/Producto');
const Usuario  = require('../models/Usuario');
const CategoriaProducto = require('../models/CategoriaProducto');
const ColorProducto = require('../models/ColorProducto');
const authMidd = require('../middleware/auth');

const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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

function normalizarNombreColumna(valor = '') {
  return String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function leerCelda(row, nombre) {
  const buscado = normalizarNombreColumna(nombre);
  const key = Object.keys(row).find((col) => normalizarNombreColumna(col) === buscado);
  return key ? row[key] : '';
}

function obtenerExtensionImagen(ruta = '') {
  const ext = path.posix.extname(ruta).replace('.', '').toLowerCase();
  if (ext === 'jpg') return 'jpeg';
  return ext || 'png';
}

function resolverRutaExcel(base, target) {
  return path.posix.normalize(path.posix.join(path.posix.dirname(base), target)).replace(/^\/+/, '');
}

function obtenerRelaciones(xml = '') {
  const relaciones = new Map();
  const regex = /<Relationship\b([^>]*)\/>/g;
  let match;
  while ((match = regex.exec(xml))) {
    const attrs = match[1];
    const id = attrs.match(/\bId="([^"]+)"/)?.[1];
    const target = attrs.match(/\bTarget="([^"]+)"/)?.[1];
    if (id && target) relaciones.set(id, target);
  }
  return relaciones;
}

function obtenerPrimeraHoja(workbookXml = '', workbookRelsXml = '') {
  const sheetMatch = workbookXml.match(/<sheet\b[^>]*\br:id="([^"]+)"/);
  if (!sheetMatch) return 'xl/worksheets/sheet1.xml';
  const rels = obtenerRelaciones(workbookRelsXml);
  const target = rels.get(sheetMatch[1]);
  return target ? resolverRutaExcel('xl/workbook.xml', target) : 'xl/worksheets/sheet1.xml';
}

function obtenerIndiceColumnaFoto(hoja) {
  const filas = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: '', raw: false });
  const encabezados = filas[0] || [];
  const indice = encabezados.findIndex((col) => normalizarNombreColumna(col) === 'foto');
  return indice >= 0 ? indice : null;
}

function extraerAnclasImagenes(drawingXml = '') {
  const anclas = [];
  const anchorRegex = /<xdr:(?:twoCellAnchor|oneCellAnchor|absoluteAnchor)\b[\s\S]*?<\/xdr:(?:twoCellAnchor|oneCellAnchor|absoluteAnchor)>/g;
  let anchorMatch;
  while ((anchorMatch = anchorRegex.exec(drawingXml))) {
    const bloque = anchorMatch[0];
    const col = Number(bloque.match(/<xdr:col>(\d+)<\/xdr:col>/)?.[1]);
    const row = Number(bloque.match(/<xdr:row>(\d+)<\/xdr:row>/)?.[1]);
    const relId = bloque.match(/<a:blip\b[^>]*\br:embed="([^"]+)"/)?.[1];
    if (Number.isInteger(col) && Number.isInteger(row) && relId) {
      anclas.push({ col, row: row + 1, relId });
    }
  }
  return anclas;
}

async function guardarImagenExcel(dataUrl) {
  const configurado = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
  if (!configurado) return dataUrl;

  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: 'seve-productos',
    transformation: [{ quality: 'auto', fetch_format: 'auto', width: 1200, crop: 'limit' }],
  });
  return result.secure_url;
}

async function obtenerImagenesInsertadasExcel(buffer, hoja) {
  const columnaFoto = obtenerIndiceColumnaFoto(hoja);
  if (columnaFoto === null) return new Map();

  const zip = await JSZip.loadAsync(buffer);
  const workbookXml = await zip.file('xl/workbook.xml')?.async('string');
  const workbookRelsXml = await zip.file('xl/_rels/workbook.xml.rels')?.async('string');
  if (!workbookXml || !workbookRelsXml) return new Map();

  const sheetPath = obtenerPrimeraHoja(workbookXml, workbookRelsXml);
  const sheetRelsPath = path.posix.join(path.posix.dirname(sheetPath), '_rels', `${path.posix.basename(sheetPath)}.rels`);
  const sheetRelsXml = await zip.file(sheetRelsPath)?.async('string');
  if (!sheetRelsXml) return new Map();

  const drawingRel = [...obtenerRelaciones(sheetRelsXml).values()].find((target) => /drawings\/drawing\d+\.xml$/i.test(target));
  if (!drawingRel) return new Map();

  const drawingPath = resolverRutaExcel(sheetPath, drawingRel);
  const drawingXml = await zip.file(drawingPath)?.async('string');
  const drawingRelsPath = path.posix.join(path.posix.dirname(drawingPath), '_rels', `${path.posix.basename(drawingPath)}.rels`);
  const drawingRelsXml = await zip.file(drawingRelsPath)?.async('string');
  if (!drawingXml || !drawingRelsXml) return new Map();

  const relsImagenes = obtenerRelaciones(drawingRelsXml);
  const imagenesPorFila = new Map();
  for (const ancla of extraerAnclasImagenes(drawingXml)) {
    if (ancla.col !== columnaFoto || imagenesPorFila.has(ancla.row)) continue;
    const target = relsImagenes.get(ancla.relId);
    if (!target) continue;

    const mediaPath = resolverRutaExcel(drawingPath, target);
    const mediaFile = zip.file(mediaPath);
    if (!mediaFile) continue;

    const base64 = await mediaFile.async('base64');
    const extension = obtenerExtensionImagen(mediaPath);
    const dataUrl = `data:image/${extension};base64,${base64}`;
    imagenesPorFila.set(ancla.row, await guardarImagenExcel(dataUrl));
  }

  return imagenesPorFila;
}

function normalizarPrecioCOP(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor)) return null;
    if (Number.isInteger(valor)) return valor;
    return valor > 0 && Math.abs(valor) < 1000
      ? Math.round(valor * 1000)
      : Math.round(valor);
  }

  let texto = String(valor).trim();
  if (!texto) return null;
  texto = texto.replace(/\s/g, '').replace(/[^\d,.-]/g, '');
  if (!texto) return null;

  if (texto.includes(',') && texto.includes('.')) {
    const ultimoPunto = texto.lastIndexOf('.');
    const ultimaComa = texto.lastIndexOf(',');
    const separadorDecimal = ultimoPunto > ultimaComa ? '.' : ',';
    const separadorMiles = separadorDecimal === '.' ? ',' : '.';
    texto = texto.replace(new RegExp(`\\${separadorMiles}`, 'g'), '').replace(separadorDecimal, '.');
    const numero = Number(texto);
    return Number.isFinite(numero) ? Math.round(numero) : null;
  }

  const separadores = (texto.match(/[,.]/g) || []);
  if (separadores.length > 1) {
    const soloDigitos = texto.replace(/[,.]/g, '');
    const numero = Number(soloDigitos);
    return Number.isFinite(numero) ? numero : null;
  }

  if (separadores.length === 1) {
    const separador = separadores[0];
    const [enteros, decimales = ''] = texto.split(separador);
    if (/^\d{1,3}$/.test(enteros) && /^\d{1,3}$/.test(decimales)) {
      const pesos = `${enteros}${decimales.padEnd(3, '0')}`;
      const numero = Number(pesos);
      return Number.isFinite(numero) ? numero : null;
    }

    const numero = Number(texto.replace(',', '.'));
    return Number.isFinite(numero) ? Math.round(numero) : null;
  }

  const numero = Number(texto);
  return Number.isFinite(numero) ? Math.round(numero) : null;
}

function normalizarProductoExcel(row, indice, imagenesPorFila = new Map()) {
  const referencia = String(leerCelda(row, 'Referencia') || '').trim();
  const categoria = String(leerCelda(row, 'Categoría') || '').trim();
  const descripcion = String(leerCelda(row, 'Descripción') || '').trim();
  const capacidad = String(leerCelda(row, 'Capacidad') || '').trim();
  const filaExcel = indice + 2;
  const foto = String(leerCelda(row, 'Foto') || '').trim() || imagenesPorFila.get(filaExcel) || '';
  const precioDetal = normalizarPrecioCOP(leerCelda(row, 'Precio e-commerce detal'));
  const precioMayorista = normalizarPrecioCOP(leerCelda(row, 'Precio e-commerce x mayor'));

  const errores = [];
  if (!referencia) errores.push('Referencia vacia');
  if (!descripcion) errores.push('Descripcion vacia');
  if (!categoria) errores.push('Categoria vacia');

  const descripcionProducto = capacidad ? [capacidad] : [];

  return {
    fila: filaExcel,
    errores,
    producto: {
      referencia,
      nombre: descripcion,
      precio: precioDetal ?? 0,
      precioOferta: null,
      categoria,
      imagen: foto,
      imagenes: [],
      imagenesColor: {},
      descripcion: descripcionProducto,
      colores: [],
      precioMayorista: precioMayorista ?? 0,
      minimoMayorista: 4,
      enOferta: false,
      activo: true,
    },
  };
}

function precioValido(precio) {
  return Number.isFinite(precio) && precio >= 0;
}

function tieneImagenesProducto(payload) {
  const tieneImagenColor = payload.imagenesColor && typeof payload.imagenesColor === 'object'
    && Object.values(payload.imagenesColor).some((v) => [].concat(v || []).some(Boolean));
  return Boolean(payload.imagen) || tieneImagenColor;
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
    if (!payload.nombre || !payload.categoria || !precioValido(payload.precio) || !tieneImagenesProducto(payload)) {
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

router.post('/importar-excel', authMidd, uploadExcel.single('archivo'), async (req, res) => {
  try {
    if (!(await usuarioEsStaff(req.usuario.id))) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'Selecciona un archivo Excel' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const hoja = workbook.Sheets[workbook.SheetNames[0]];
    if (!hoja) {
      return res.status(400).json({ error: 'El archivo no tiene hojas para importar' });
    }

    const filas = XLSX.utils.sheet_to_json(hoja, { defval: '', raw: false });
    if (filas.length === 0) {
      return res.status(400).json({ error: 'El archivo no tiene productos para importar' });
    }

    const imagenesPorFila = await obtenerImagenesInsertadasExcel(req.file.buffer, hoja);
    const procesadas = filas.map((row, indice) => normalizarProductoExcel(row, indice, imagenesPorFila));
    const rechazadas = procesadas
      .filter((item) => item.errores.length > 0)
      .map((item) => ({ fila: item.fila, errores: item.errores }));
    const validas = procesadas.filter((item) => item.errores.length === 0).map((item) => item.producto);
    const validasPorReferencia = new Map(validas.map((producto) => [producto.referencia, producto]));
    const productosAImportar = [...validasPorReferencia.values()];

    if (productosAImportar.length === 0) {
      return res.status(400).json({
        error: 'No se encontro ningun producto valido en el Excel',
        rechazadas,
      });
    }

    const categoriasExcel = [...new Set(productosAImportar.map((p) => p.categoria))];
    const categoriasExistentes = await CategoriaProducto.find({ nombre: { $in: categoriasExcel } }).distinct('nombre');
    const faltantes = categoriasExcel.filter((nombre) => !categoriasExistentes.includes(nombre));
    if (faltantes.length > 0) {
      await CategoriaProducto.insertMany(
        faltantes.map((nombre) => ({ nombre, imagen: '' })),
        { ordered: false }
      ).catch((err) => {
        if (err?.code !== 11000 && err?.writeErrors?.some((e) => e.code !== 11000)) throw err;
      });
    }

    const referencias = productosAImportar.map((p) => p.referencia);
    const productosExistentes = await Producto.find({
      $or: [
        { referencia: { $in: referencias } },
        { referencia: { $in: [null, ''] }, nombre: { $in: referencias } },
        { referencia: { $exists: false }, nombre: { $in: referencias } },
      ],
    }).select('_id referencia nombre').lean();

    const existentesPorReferencia = new Map();
    productosExistentes.forEach((producto) => {
      if (producto.referencia) {
        existentesPorReferencia.set(producto.referencia, producto);
      } else if (referencias.includes(producto.nombre)) {
        existentesPorReferencia.set(producto.nombre, producto);
      }
    });

    const operaciones = productosAImportar.map((producto) => {
      const existente = existentesPorReferencia.get(producto.referencia);
      const camposActualizar = { ...producto };
      const setOnInsert = {};
      if (!camposActualizar.imagen) {
        delete camposActualizar.imagen;
        setOnInsert.imagen = '';
      }
      return {
        updateOne: {
          filter: existente ? { _id: existente._id } : { referencia: producto.referencia },
          update: {
            $set: camposActualizar,
            ...(Object.keys(setOnInsert).length ? { $setOnInsert: setOnInsert } : {}),
          },
          upsert: true,
        },
      };
    });

    const resultado = await Producto.bulkWrite(operaciones, { ordered: false });
    const creados = resultado.upsertedCount || 0;
    const actualizados = productosAImportar.length - creados;

    res.status(201).json({
      mensaje: 'Importacion completada',
      creados,
      actualizados,
      rechazados: rechazadas.length,
      categoriasCreadas: faltantes.length,
      imagenesImportadas: imagenesPorFila.size,
      rechazadas,
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
    if (!payload.nombre || !payload.categoria || !precioValido(payload.precio)) {
      return res.status(400).json({ error: 'Completa nombre, precio y categoria' });
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
