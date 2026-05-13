import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import axios from "axios";
import { API_BASE } from "@/config";
import { subirImagen, comprimirImagen } from "@/utils/subirImagen";
import "./empleado.css";

const PRODUCTO_VACIO = {
  nombre: "",
  precio: "",
  precioOferta: "",
  enOferta: false,
  categoria: "",
  descripcion: "",
  colores: [],
  imagen: "",
  imagenes: [],
  imagenesColor: {},
  precioMayorista: "",
  minimoMayorista: "4",
  activo: true,
};

export default function EditarProductos() {
  const {
    usuario,
    productosAdmin,
    cargarProductosAdmin,
    crearProducto,
    editarProducto,
    actualizarEstadoProducto,
    eliminarProducto,
  } = useApp();

  const esAdmin = Boolean(usuario?.esAdmin || usuario?.rol === "admin");

  const [cargando, setCargando]               = useState(true);
  const [busqueda, setBusqueda]               = useState("");
  const [modalAbierto, setModalAbierto]       = useState(false);
  const [editando, setEditando]               = useState(null);
  const [form, setForm]                       = useState(PRODUCTO_VACIO);
  const [preview, setPreview]                 = useState("");
  const [guardando, setGuardando]             = useState(false);
  const [eliminandoId, setEliminandoId]       = useState("");
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [mensaje, setMensaje]                 = useState({ texto: "", tipo: "" });
  const [categoriasDisponibles, setCategorias] = useState([]);
  const [coloresDisponibles, setColores]      = useState([]);

  useEffect(() => {
    cargar();
    axios.get(`${API_BASE}/ubicaciones/categorias-producto`)
      .then(({ data }) => setCategorias(data.map((i) => i.nombre)))
      .catch(() => {});
    axios.get(`${API_BASE}/ubicaciones/colores-producto`)
      .then(({ data }) => setColores(data.map((i) => i.nombre)))
      .catch(() => {});
  }, []);

  async function cargar() {
    try {
      setCargando(true);
      await cargarProductosAdmin();
    } finally {
      setCargando(false);
    }
  }

  function abrirNuevo() {
    setEditando(null);
    setForm(PRODUCTO_VACIO);
    setPreview("");
    setModalAbierto(true);
  }

  function abrirEditar(producto) {
    setEditando(producto);
    setForm({
      nombre:       producto.nombre || "",
      precio:       producto.precioNormal ?? producto.precio ?? "",
      precioOferta: producto.precioOferta ?? "",
      enOferta:     producto.enOferta || false,
      categoria:    producto.categoria || "",
      descripcion:  Array.isArray(producto.descripcion)
        ? producto.descripcion.join("\n")
        : producto.descripcion || "",
      colores:      Array.isArray(producto.colores) ? producto.colores : [],
      imagen:       producto.imagen || "",
      imagenes:        Array.isArray(producto.imagenes) ? producto.imagenes : [],
      imagenesColor:   (producto.imagenesColor && typeof producto.imagenesColor === "object") ? producto.imagenesColor : {},
      precioMayorista: producto.precioMayorista ?? "",
      minimoMayorista: producto.minimoMayorista ?? "4",
      activo:          producto.activo !== false,
    });
    setPreview(producto.imagen || "");
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setEditando(null);
    setForm(PRODUCTO_VACIO);
    setPreview("");
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  function toggleColor(color) {
    setForm((prev) => ({
      ...prev,
      colores: prev.colores.includes(color)
        ? prev.colores.filter((c) => c !== color)
        : [...prev.colores, color],
    }));
  }

  async function manejarArchivo(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const base64 = await comprimirImagen(archivo, 900, 0.82);
    setPreview(base64);
    setForm((prev) => ({ ...prev, imagen: base64 }));
    try {
      const url = await subirImagen(base64, "seve-productos");
      setForm((prev) => ({ ...prev, imagen: url }));
      setPreview(url);
    } catch { /* queda el base64 comprimido como fallback */ }
  }

  function quitarImagen() {
    setPreview("");
    setForm((prev) => ({ ...prev, imagen: "" }));
  }

  async function agregarImagenAdicional(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const base64 = await comprimirImagen(archivo, 900, 0.82);
    setForm((prev) => ({ ...prev, imagenes: [...prev.imagenes, base64] }));
    e.target.value = "";
    try {
      const url = await subirImagen(base64, "seve-productos");
      setForm((prev) => ({
        ...prev,
        imagenes: prev.imagenes.map((img) => (img === base64 ? url : img)),
      }));
    } catch { /* queda base64 */ }
  }

  function quitarImagenAdicional(idx) {
    setForm((prev) => ({ ...prev, imagenes: prev.imagenes.filter((_, i) => i !== idx) }));
  }

  async function agregarImagenColor(color, e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const base64 = await comprimirImagen(archivo, 900, 0.82);
    setForm((prev) => {
      const actuales = [].concat(prev.imagenesColor?.[color] || []);
      if (actuales.length >= 4) return prev;
      return { ...prev, imagenesColor: { ...prev.imagenesColor, [color]: [...actuales, base64] } };
    });
    e.target.value = "";
    try {
      const url = await subirImagen(base64, "seve-productos");
      setForm((prev) => {
        const actuales = [].concat(prev.imagenesColor?.[color] || []);
        return {
          ...prev,
          imagenesColor: {
            ...prev.imagenesColor,
            [color]: actuales.map((img) => (img === base64 ? url : img)),
          },
        };
      });
    } catch { /* queda base64 */ }
  }

  function quitarImagenColor(color, idx) {
    setForm((prev) => {
      const actuales = [].concat(prev.imagenesColor?.[color] || []);
      const nuevas = actuales.filter((_, i) => i !== idx);
      const copia = { ...prev.imagenesColor };
      if (nuevas.length === 0) delete copia[color];
      else copia[color] = nuevas;
      return { ...prev, imagenesColor: copia };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setGuardando(true);
      const payload = {
        nombre:       form.nombre,
        precio:       Number(form.precio),
        precioOferta: form.precioOferta !== "" ? Number(form.precioOferta) : null,
        enOferta:     form.enOferta,
        categoria:    form.categoria,
        descripcion:  form.descripcion.split("\n").map((l) => l.trim()).filter(Boolean),
        colores:      form.colores,
        imagen:       form.imagen,
        imagenes:        form.imagenes,
        imagenesColor:   form.imagenesColor,
        precioMayorista: form.precioMayorista !== "" ? Number(form.precioMayorista) : null,
        minimoMayorista: form.minimoMayorista !== "" ? Number(form.minimoMayorista) : 4,
        activo:          form.activo,
      };

      if (editando) {
        await editarProducto(editando.id, { ...payload, activo: editando.activo });
        mostrarMensaje("Producto actualizado correctamente", "ok");
      } else {
        await crearProducto(payload);
        mostrarMensaje("Producto creado correctamente", "ok");
      }
      cerrarModal();
    } catch (err) {
      mostrarMensaje(err?.response?.data?.error || "Error al guardar el producto", "error");
    } finally {
      setGuardando(false);
    }
  }

  async function toggleActivo(producto) {
    if (!esAdmin) return;
    try {
      await actualizarEstadoProducto(producto.id, !producto.activo);
      mostrarMensaje(!producto.activo ? "Producto activado" : "Producto desactivado", "ok");
    } catch {
      mostrarMensaje("No se pudo cambiar el estado", "error");
    }
  }

  async function confirmarYEliminar() {
    if (!confirmarEliminar) return;
    try {
      setEliminandoId(confirmarEliminar.id);
      await eliminarProducto(confirmarEliminar.id);
      mostrarMensaje("Producto eliminado correctamente", "ok");
      setConfirmarEliminar(null);
    } catch (err) {
      mostrarMensaje(err?.response?.data?.error || "No se pudo eliminar el producto", "error");
    } finally {
      setEliminandoId("");
    }
  }

  function mostrarMensaje(texto, tipo) {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3500);
  }

  const productosFiltrados = productosAdmin.filter((p) =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="emp-seccion">
      <div className="emp-seccion-header">
        <div>
          <h1 className="emp-titulo">Productos</h1>
          <p className="emp-desc">Crea, edita, activa/desactiva y elimina productos del catálogo.</p>
        </div>
        <button className="emp-btn emp-btn--primario" onClick={abrirNuevo}>
          + Nuevo producto
        </button>
      </div>

      {mensaje.texto && (
        <div className={`emp-mensaje emp-mensaje--${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      <input
        className="emp-busqueda"
        type="text"
        placeholder="Buscar producto..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      {cargando ? (
        <p className="emp-vacio">Cargando productos...</p>
      ) : productosFiltrados.length === 0 ? (
        <p className="emp-vacio">No se encontraron productos.</p>
      ) : (
        <div className="emp-tabla-wrap">
          <table className="emp-tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((p) => (
                <tr key={p.id} className={!p.activo ? "emp-tabla-fila--inactiva" : ""}>
                  <td>
                    <div className="emp-tabla-producto">
                      {(p.imagenVista || p.imagen) && <img src={p.imagenVista || p.imagen} alt={p.nombre} className="emp-tabla-img" />}
                      <span>{p.nombre}</span>
                    </div>
                  </td>
                  <td>${Number(p.precioNormal ?? p.precio).toLocaleString("es-CO")}</td>
                  <td>{p.categoria || "—"}</td>
                  <td>
                    <span className={`emp-badge ${p.activo ? "emp-badge--activo" : "emp-badge--inactivo"}`}>
                      {p.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="emp-tabla-acciones">
                      <button className="emp-btn emp-btn--sm emp-btn--secundario" onClick={() => abrirEditar(p)}>
                        Editar
                      </button>
                      {esAdmin && (
                        <button
                          className={`emp-btn emp-btn--sm ${p.activo ? "emp-btn--peligro" : "emp-btn--ok"}`}
                          onClick={() => toggleActivo(p)}
                        >
                          {p.activo ? "Desactivar" : "Activar"}
                        </button>
                      )}
                      <button
                        className="emp-btn emp-btn--sm emp-btn--eliminar"
                        onClick={() => setConfirmarEliminar(p)}
                        disabled={eliminandoId === p.id}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmarEliminar && (
        <div className="emp-modal-backdrop" onClick={() => setConfirmarEliminar(null)}>
          <div className="emp-modal emp-modal--confirmar" onClick={(e) => e.stopPropagation()}>
            <div className="emp-confirmar-icono">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </div>
            <h3 className="emp-confirmar-titulo">¿Eliminar producto?</h3>
            <p className="emp-confirmar-desc">
              Vas a eliminar <strong>{confirmarEliminar.nombre}</strong> de forma permanente. Esta acción no se puede deshacer.
            </p>
            <div className="emp-confirmar-acciones">
              <button className="emp-btn emp-btn--ghost" onClick={() => setConfirmarEliminar(null)}
                disabled={eliminandoId === confirmarEliminar.id}>
                Cancelar
              </button>
              <button className="emp-btn emp-btn--eliminar-confirm" onClick={confirmarYEliminar}
                disabled={eliminandoId === confirmarEliminar.id}>
                {eliminandoId === confirmarEliminar.id ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal formulario */}
      {modalAbierto && (
        <div className="emp-modal-backdrop" onClick={cerrarModal}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-header">
              <h2>{editando ? "Editar producto" : "Nuevo producto"}</h2>
              <button className="emp-modal-cerrar" onClick={cerrarModal}>&times;</button>
            </div>

            <form className="emp-form" onSubmit={handleSubmit}>
              <label className="emp-label">
                Nombre
                <input className="emp-input" name="nombre" value={form.nombre} onChange={handleChange} required />
              </label>

              <div className="emp-form-row">
                <label className="emp-label">
                  Precio normal
                  <input className="emp-input" name="precio" type="number" min="0" value={form.precio} onChange={handleChange} required />
                </label>
                <label className="emp-label">
                  Precio oferta
                  <input className="emp-input" name="precioOferta" type="number" min="0" value={form.precioOferta} onChange={handleChange} />
                </label>
              </div>

              <label className="emp-label emp-label--check">
                <input type="checkbox" name="enOferta" checked={form.enOferta} onChange={handleChange} />
                En oferta
              </label>

              <div className="emp-form-row" style={{ alignItems: "flex-end", gap: 12, background: "#f9f4ff", borderRadius: 10, padding: "12px 14px", border: "1px solid #e5d8ff" }}>
                <label className="emp-label" style={{ flex: 1 }}>
                  Precio mayorista
                  <span className="emp-label-hint" style={{ display: "block", marginBottom: 4 }}>Dejar vacío si no se vende al por mayor</span>
                  <input
                    className="emp-input"
                    name="precioMayorista"
                    type="number"
                    min="0"
                    value={form.precioMayorista}
                    onChange={handleChange}
                    placeholder="Ej: 150000"
                  />
                </label>
                <label className="emp-label" style={{ flex: 1 }}>
                  Mínimo de docenas
                  <span className="emp-label-hint" style={{ display: "block", marginBottom: 4 }}>Para aplicar precio mayorista</span>
                  <input
                    className="emp-input"
                    name="minimoMayorista"
                    type="number"
                    min="1"
                    value={form.minimoMayorista}
                    onChange={handleChange}
                    placeholder="4"
                  />
                </label>
              </div>

              <label className="emp-label">
                Categoría
                <select className="emp-input" name="categoria" value={form.categoria} onChange={handleChange} required>
                  <option value="">Selecciona una categoría</option>
                  {categoriasDisponibles.map((c) => (
                    <option key={c} value={c}>{c.replace(/-/g, " ")}</option>
                  ))}
                </select>
              </label>

              <div>
                <span className="emp-label" style={{ display: "block", marginBottom: 8 }}>Foto del producto</span>
                <label className="emp-file-label">
                  <input type="file" accept="image/*" onChange={manejarArchivo} className="emp-file-input" />
                  <span className="emp-file-btn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Elegir imagen
                  </span>
                  <span className="emp-file-nombre">
                    {preview ? "✓ Imagen cargada" : "Ningún archivo elegido"}
                  </span>
                </label>
                {preview && (
                  <div className="emp-preview-wrap">
                    <img src={preview} alt="Vista previa" className="emp-preview-img" />
                    <button type="button" className="emp-preview-quitar" onClick={quitarImagen}>
                      Quitar imagen
                    </button>
                  </div>
                )}
              </div>

              {/* Imágenes adicionales */}
              <div>
                <span className="emp-label" style={{ display: "block", marginBottom: 8 }}>
                  Fotos adicionales <span className="emp-label-hint">(hasta 3)</span>
                </span>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  {form.imagenes.map((img, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img src={img} alt={`Extra ${idx + 1}`}
                        style={{ width: 72, height: 72, objectFit: "contain", borderRadius: 8, border: "2px solid #e0e0e0", background: "#f8f8f8" }} />
                      <button type="button" onClick={() => quitarImagenAdicional(idx)}
                        style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#c0392b", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        ×
                      </button>
                    </div>
                  ))}
                  {form.imagenes.length < 3 && (
                    <label style={{ width: 72, height: 72, border: "2px dashed #ccc", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#aaa", fontSize: 28 }}>
                      <input type="file" accept="image/*" onChange={agregarImagenAdicional} style={{ display: "none" }} />
                      +
                    </label>
                  )}
                </div>
              </div>

              {/* Imagen por color */}
              {form.colores.length > 0 && (
                <div>
                  <span className="emp-label" style={{ display: "block", marginBottom: 8 }}>
                    Fotos por color <span className="emp-label-hint">(hasta 4 por color — cambia la imagen al seleccionar el color)</span>
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {form.colores.map((color) => {
                      const imgs = [].concat(form.imagenesColor?.[color] || []);
                      return (
                        <div key={color}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "capitalize", display: "block", marginBottom: 6 }}>{color}</span>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            {imgs.map((img, idx) => (
                              <div key={idx} style={{ position: "relative" }}>
                                <img src={img} alt={`${color} ${idx + 1}`}
                                  style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 8, border: "2px solid #c0392b", background: "#f8f8f8" }} />
                                <button type="button" onClick={() => quitarImagenColor(color, idx)}
                                  style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#c0392b", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  ×
                                </button>
                              </div>
                            ))}
                            {imgs.length < 4 && (
                              <label style={{ width: 64, height: 64, border: "2px dashed #ccc", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#aaa", fontSize: 24, flexShrink: 0 }}>
                                <input type="file" accept="image/*" onChange={(e) => agregarImagenColor(color, e)} style={{ display: "none" }} />
                                +
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <label className="emp-label">
                Descripción <span className="emp-label-hint">(una característica por línea)</span>
                <textarea className="emp-input emp-textarea" name="descripcion" value={form.descripcion}
                  onChange={handleChange} rows={4} placeholder="Escribe una característica por línea" />
              </label>

              {coloresDisponibles.length > 0 && (
                <div>
                  <span className="emp-label" style={{ display: "block", marginBottom: 8 }}>Colores disponibles</span>
                  <div className="emp-colores">
                    {coloresDisponibles.map((color) => (
                      <label key={color} className={`emp-color-chip ${form.colores.includes(color) ? "activo" : ""}`}>
                        <input type="checkbox" checked={form.colores.includes(color)} onChange={() => toggleColor(color)} />
                        <span>{color}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="emp-form-acciones">
                <button type="button" className="emp-btn emp-btn--ghost" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="emp-btn emp-btn--primario" disabled={guardando}>
                  {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
