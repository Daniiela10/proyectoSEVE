import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import axios from "axios";
import { API_BASE } from "@/config";
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
    activo: true,
};

export default function EmpleadoProductos() {
const {
    productosAdmin,
    cargarProductosAdmin,
    crearProducto,
    editarProducto,
    actualizarEstadoProducto,
    eliminarProducto,
} = useApp();

const [cargando, setCargando]                = useState(true);
const [busqueda, setBusqueda]                = useState("");
const [modalAbierto, setModalAbierto]        = useState(false);
const [editando, setEditando]                = useState(null);
const [form, setForm]                        = useState(PRODUCTO_VACIO);
const [preview, setPreview]                  = useState("");
const [guardando, setGuardando]              = useState(false);
const [eliminandoId, setEliminandoId]        = useState("");
const [confirmarEliminar, setConfirmarEliminar] = useState(null); // producto a eliminar
const [mensaje, setMensaje]                  = useState({ texto: "", tipo: "" });
const [categoriasDisponibles, setCategorias] = useState([]);
const [coloresDisponibles, setColores]       = useState([]);

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
      activo:       producto.activo !== false,
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
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function toggleColor(color) {
    setForm((prev) => ({
      ...prev,
      colores: prev.colores.includes(color)
        ? prev.colores.filter((c) => c !== color)
        : [...prev.colores, color],
    }));
  }

  function manejarArchivo(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onload = () => {
      const resultado = String(reader.result || "");
      setForm((prev) => ({ ...prev, imagen: resultado }));
      setPreview(resultado);
    };
    reader.readAsDataURL(archivo);
  }

  function quitarImagen() {
    setPreview("");
    setForm((prev) => ({ ...prev, imagen: "" }));
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
        activo:       form.activo,
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
    try {
      await actualizarEstadoProducto(producto.id, !producto.activo);
      mostrarMensaje(
        !producto.activo ? "Producto activado" : "Producto desactivado",
        "ok"
      );
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
                      {p.imagen && (
                        <img src={p.imagen} alt={p.nombre} className="emp-tabla-img" />
                      )}
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
                      {/* Editar */}
                      <button
                        className="emp-btn emp-btn--sm emp-btn--secundario"
                        onClick={() => abrirEditar(p)}
                      >
                        Editar
                      </button>

                      {/* Activar / Desactivar */}
                      <button
                        className={`emp-btn emp-btn--sm ${p.activo ? "emp-btn--peligro" : "emp-btn--ok"}`}
                        onClick={() => toggleActivo(p)}
                      >
                        {p.activo ? "Desactivar" : "Activar"}
                      </button>

                      {/* Eliminar */}
                      <button
                        className="emp-btn emp-btn--sm emp-btn--eliminar"
                        onClick={() => setConfirmarEliminar(p)}
                        disabled={eliminandoId === p.id}
                        title="Eliminar producto"
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

      {/* ── Modal confirmación eliminar ── */}
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
              Vas a eliminar <strong>{confirmarEliminar.nombre}</strong> de forma permanente.
              Esta acción no se puede deshacer.
            </p>
            <div className="emp-confirmar-acciones">
              <button
                className="emp-btn emp-btn--ghost"
                onClick={() => setConfirmarEliminar(null)}
                disabled={eliminandoId === confirmarEliminar.id}
              >
                Cancelar
              </button>
              <button
                className="emp-btn emp-btn--eliminar-confirm"
                onClick={confirmarYEliminar}
                disabled={eliminandoId === confirmarEliminar.id}
              >
                {eliminandoId === confirmarEliminar.id ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal formulario ── */}
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

              <label className="emp-label">
                Categoría
                <select className="emp-input" name="categoria" value={form.categoria} onChange={handleChange} required>
                  <option value="">Selecciona una categoría</option>
                  {categoriasDisponibles.map((c) => (
                    <option key={c} value={c}>{c.replace(/-/g, " ")}</option>
                  ))}
                </select>
              </label>

              {/* Foto */}
              <div>
                <span className="emp-label" style={{ display: "block", marginBottom: 8 }}>
                  Foto del producto
                </span>
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

              <label className="emp-label">
                Descripción <span className="emp-label-hint">(una característica por línea)</span>
                <textarea
                  className="emp-input emp-textarea"
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Escribe una característica por línea"
                />
              </label>

              {coloresDisponibles.length > 0 && (
                <div>
                  <span className="emp-label" style={{ display: "block", marginBottom: 8 }}>
                    Colores disponibles
                  </span>
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

              <label className="emp-label emp-label--check">
                <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
                Producto activo (visible en tienda)
              </label>

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
