import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";
import axios from "axios";
import { API_BASE } from "@/config";
import { useImagenesUpload } from "@/hooks/useImagenesUpload";
import ImagenesUploader from "@/components/ImagenesUploader";
import "./empleado.css";

const initialForm = {
  nombre: "",
  precio: "",
  precioOferta: "",
  precioMayorista: "",
  minimoMayorista: 48,
  enOferta: false,
  categoria: "",
  descripcion: "",
  colores: [],
  activo: true,
};

export default function EditarProductos() {
  const {
    usuario, productosAdmin, cargarProductosAdmin,
    crearProducto, editarProducto, actualizarEstadoProducto,
  } = useApp();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [guardando, setGuardando] = useState(false);
  const [toggleId, setToggleId] = useState("");
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [coloresDisponibles, setColoresDisponibles] = useState([]);
  const [productoEditando, setProductoEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const esAdmin = Boolean(usuario?.esAdmin || usuario?.rol === "admin");

  const {
    imagenes, setImagenes, subiendo, error: errorImagenes,
    agregarImagenes, eliminarImagen, maxAlcanzado,
  } = useImagenesUpload([]);

  useEffect(() => {
    cargarProductosAdmin().catch(() => mostrarMensaje("No fue posible cargar los productos", "error"));
    axios.get(`${API_BASE}/ubicaciones/categorias-producto`)
      .then(({ data }) => setCategoriasDisponibles(data.map((i) => i.nombre))).catch(() => {});
    axios.get(`${API_BASE}/ubicaciones/colores-producto`)
      .then(({ data }) => setColoresDisponibles(data.map((i) => i.nombre))).catch(() => {});
  }, []);

  function mostrarMensaje(texto, tipo) {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3500);
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

  function abrirModalProducto() {
    setForm(initialForm);
    setImagenes([]);
    setProductoEditando(null);
    setMostrarFormulario(true);
  }

  function abrirModalEditarProducto(producto) {
    setProductoEditando(producto);
    setForm({
      nombre:          producto.nombre || "",
      precio:          producto.precioNormal ?? producto.precio ?? "",
      precioOferta:    producto.precioOferta ?? "",
      precioMayorista: producto.precioMayorista || "",
      minimoMayorista: producto.minimoMayorista || 48,
      enOferta:        Boolean(producto.enOferta),
      categoria:       producto.categoria || "",
      descripcion:     Array.isArray(producto.descripcion) ? producto.descripcion.join("\n") : "",
      colores:         Array.isArray(producto.colores) ? producto.colores : [],
      activo:          producto.activo !== false,
    });
    // Cargar imágenes existentes
    const imgs = producto.imagenes?.length
      ? producto.imagenes
      : producto.imagen ? [producto.imagen] : [];
    setImagenes(imgs);
    setMostrarFormulario(true);
  }

  function cerrarModal() {
    setMostrarFormulario(false);
    setForm(initialForm);
    setImagenes([]);
    setProductoEditando(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (imagenes.length === 0) {
      mostrarMensaje("Agrega al menos una imagen del producto", "error");
      return;
    }
    try {
      setGuardando(true);
      const payload = {
        nombre:          form.nombre,
        precio:          Number(form.precio),
        precioOferta:    form.precioOferta !== "" ? Number(form.precioOferta) : null,
        precioMayorista: form.precioMayorista !== "" ? Number(form.precioMayorista) : null,
        minimoMayorista: Number(form.minimoMayorista) || 48,
        enOferta:        form.enOferta,
        categoria:       form.categoria,
        descripcion:     form.descripcion.split("\n").map((l) => l.trim()).filter(Boolean),
        colores:         form.colores,
        imagen:          imagenes[0],   // principal
        imagenes,                       // todas
        activo:          form.activo,
      };

      if (productoEditando) {
        await editarProducto(productoEditando.id, { ...payload, activo: productoEditando.activo });
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

  async function cambiarEstado(producto) {
    try {
      setToggleId(producto.id);
      await actualizarEstadoProducto(producto.id, !producto.activo);
      mostrarMensaje(`Producto ${!producto.activo ? "activado" : "desactivado"} correctamente`, "ok");
    } catch (err) {
      mostrarMensaje(err?.response?.data?.error || "No fue posible actualizar el estado", "error");
    } finally {
      setToggleId("");
    }
  }

  if (!(usuario?.esAdmin || usuario?.rol === "empleado")) {
    return <div><h1 className="emp-titulo">Editar productos</h1><p className="emp-vacio">Sin permisos.</p></div>;
  }

  const productosFiltrados = productosAdmin.filter((p) =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="emp-seccion">
      <div className="emp-seccion-header">
        <div>
          <h1 className="emp-titulo">Productos</h1>
          <p className="emp-desc">Agrega, edita y activa/desactiva productos del catálogo.</p>
        </div>
        <button className="emp-btn emp-btn--primario" onClick={abrirModalProducto}>+ Nuevo producto</button>
      </div>

      {mensaje.texto && (
        <div className={`emp-mensaje emp-mensaje--${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      <input className="emp-busqueda" type="text" placeholder="Buscar producto..."
        value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ marginBottom: 20 }} />

      <div className="emp-tabla-wrap">
        <table className="emp-tabla">
          <thead>
            <tr><th>Producto</th><th>Precio</th><th>Categoría</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {productosFiltrados.map((p) => (
              <tr key={p.id} className={!p.activo ? "emp-tabla-fila--inactiva" : ""}>
                <td>
                  <div className="emp-tabla-producto">
                    {(p.imagenes?.[0] || p.imagen) && (
                      <img src={p.imagenes?.[0] || p.imagen} alt={p.nombre} className="emp-tabla-img" />
                    )}
                    <div>
                      <div className="emp-tabla-nombre">{p.nombre}</div>
                      {p.imagenes?.length > 1 && (
                        <div style={{ fontSize: 11, color: "#888" }}>📷 {p.imagenes.length} fotos</div>
                      )}
                      {p.precioMayorista && (
                        <div style={{ fontSize: 11, color: "#1565c0", fontWeight: 600 }}>
                          Precio X Mayor: {formatearPrecio(p.precioMayorista)}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td>{formatearPrecio(p.precioNormal ?? p.precio)}</td>
                <td>{p.categoria || "—"}</td>
                <td>
                  <span className={`emp-badge ${p.activo ? "emp-badge--activo" : "emp-badge--inactivo"}`}>
                    {p.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <div className="emp-tabla-acciones">
                    <button className="emp-btn emp-btn--sm emp-btn--secundario" onClick={() => abrirModalEditarProducto(p)}>
                      Editar
                    </button>
                    {esAdmin && (
                      <button
                        className={`emp-btn emp-btn--sm ${p.activo ? "emp-btn--peligro" : "emp-btn--ok"}`}
                        disabled={toggleId === p.id}
                        onClick={() => cambiarEstado(p)}
                      >
                        {p.activo ? "Desactivar" : "Activar"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarFormulario && (
        <div className="emp-modal-backdrop" onClick={cerrarModal}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-header">
              <h2>{productoEditando ? "Editar producto" : "Agregar producto nuevo"}</h2>
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

              {/* Múltiples imágenes */}
              <ImagenesUploader
                imagenes={imagenes}
                subiendo={subiendo}
                error={errorImagenes}
                maxAlcanzado={maxAlcanzado}
                onAgregar={agregarImagenes}
                onEliminar={eliminarImagen}
              />

              {/* Precio por mayor */}
              <div style={{ background: "#f0f7ff", border: "1px solid #90caf9", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 20 }}></span>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1565c0" }}>Precio por mayor</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#5c85c0" }}>Opcional — se aplica automáticamente al superar el mínimo</p>
                  </div>
                </div>
                <div className="emp-form-row">
                  <label className="emp-label">
                    Precio mayorista (c/u)
                    <input className="emp-input" name="precioMayorista" type="number" min="0"
                      placeholder="Ej: 75000" value={form.precioMayorista} onChange={handleChange} />
                  </label>
                  <label className="emp-label">
                    Mínimo de unidades
                    <input className="emp-input" name="minimoMayorista" type="number" min="1"
                      placeholder="48 (4 docenas)" value={form.minimoMayorista} onChange={handleChange} />
                    <span style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                      {form.minimoMayorista
                        ? `${form.minimoMayorista} u. = ${Math.floor(form.minimoMayorista / 12)} doc. + ${form.minimoMayorista % 12} u.`
                        : "Por defecto: 48 unidades"}
                    </span>
                  </label>
                </div>
              </div>

              <label className="emp-label">
                Descripción <span className="emp-label-hint">(una característica por línea)</span>
                <textarea className="emp-input emp-textarea" name="descripcion"
                  value={form.descripcion} onChange={handleChange} rows={4}
                  placeholder="Escribe una característica por línea" />
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

              <label className="emp-label emp-label--check">
                <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
                Producto activo (visible en tienda)
              </label>

              <div className="emp-form-acciones">
                <button type="button" className="emp-btn emp-btn--ghost" onClick={cerrarModal}>Cancelar</button>
                <button type="submit" className="emp-btn emp-btn--primario" disabled={guardando || subiendo}>
                  {guardando ? "Guardando..." : productoEditando ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
