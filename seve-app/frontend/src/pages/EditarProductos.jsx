import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";
import axios from "axios";
import { API_BASE } from "@/config";

const initialForm = {
  nombre: "",
  precio: "",
  categoria: "",
  imagen: "",
  descripcion: "",
  colores: [],
  enOferta: false,
};

export default function EditarProductos() {
  const {
    usuario,
    productosAdmin,
    cargarProductosAdmin,
    crearProducto,
    editarProducto,
    actualizarEstadoProducto,
  } = useApp();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [toggleId, setToggleId] = useState("");
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [coloresDisponibles, setColoresDisponibles] = useState([]);
  const [productoEditando, setProductoEditando] = useState(null);
  const esAdmin = Boolean(usuario?.esAdmin || usuario?.rol === "admin");

  useEffect(() => {
    cargarProductosAdmin().catch(() => {
      setMensaje("No fue posible cargar los productos");
      setMensajeTipo("error");
    });

    axios.get(`${API_BASE}/ubicaciones/categorias-producto`)
      .then(({ data }) => setCategoriasDisponibles(data.map((item) => item.nombre)))
      .catch(() => {
        setMensaje("No fue posible cargar las categorias");
        setMensajeTipo("error");
      });

    axios.get(`${API_BASE}/ubicaciones/colores-producto`)
      .then(({ data }) => setColoresDisponibles(data.map((item) => item.nombre)))
      .catch(() => {
        setMensaje("No fue posible cargar los colores");
        setMensajeTipo("error");
      });
  }, []);

  function actualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function abrirModalProducto() {
    setForm(initialForm);
    setPreview("");
    setProductoEditando(null);
    setMostrarFormulario(true);
  }

  function abrirModalEditarProducto(producto) {
    setProductoEditando(producto);
    setForm({
      nombre: producto.nombre || "",
      precio: producto.precio || "",
      categoria: producto.categoria || "",
      imagen: producto.imagen || "",
      descripcion: Array.isArray(producto.descripcion) ? producto.descripcion.join("\n") : "",
      colores: Array.isArray(producto.colores) ? producto.colores : [],
      enOferta: Boolean(producto.enOferta),
    });
    setPreview(producto.imagen || "");
    setMostrarFormulario(true);
  }

  function cerrarModalProducto() {
    setMostrarFormulario(false);
    setForm(initialForm);
    setPreview("");
    setProductoEditando(null);
  }

  function toggleColor(color) {
    setForm((prev) => ({
      ...prev,
      colores: prev.colores.includes(color)
        ? prev.colores.filter((item) => item !== color)
        : [...prev.colores, color],
    }));
  }

  function manejarArchivo(event) {
    const archivo = event.target.files?.[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = () => {
      const resultado = String(reader.result || "");
      actualizarCampo("imagen", resultado);
      setPreview(resultado);
    };
    reader.readAsDataURL(archivo);
  }

  async function submitCrearProducto(e) {
    e.preventDefault();

    try {
      setGuardando(true);
      setMensaje("");
      const payload = {
        ...form,
        precio: Number(form.precio),
        descripcion: form.descripcion.split("\n").map((item) => item.trim()).filter(Boolean),
        activo: true,
      };

      if (productoEditando) {
        await editarProducto(productoEditando.id, {
          ...payload,
          activo: productoEditando.activo,
        });
      } else {
        await crearProducto(payload);
      }

      setForm(initialForm);
      setPreview("");
      setMostrarFormulario(false);
      setProductoEditando(null);
      setMensaje(productoEditando ? "Producto actualizado correctamente" : "Producto creado correctamente");
      setMensajeTipo("ok");
    } catch (err) {
      setMensaje(err?.response?.data?.error || `No fue posible ${productoEditando ? "actualizar" : "crear"} el producto`);
      setMensajeTipo("error");
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(producto) {
    try {
      setToggleId(producto.id);
      setMensaje("");
      await actualizarEstadoProducto(producto.id, !producto.activo);
      setMensaje(`Producto ${!producto.activo ? "activado" : "desactivado"} correctamente`);
      setMensajeTipo("ok");
    } catch (err) {
      setMensaje(err?.response?.data?.error || "No fue posible actualizar el estado del producto");
      setMensajeTipo("error");
    } finally {
      setToggleId("");
    }
  }

  if (!(usuario?.esAdmin || usuario?.rol === "empleado")) {
    return (
      <div>
        <h1 className="titulo-vista">Editar productos</h1>
        <p className="historial-vacio">No tienes permisos para ver esta seccion.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="titulo-vista">Editar productos</h1>
      <p className="historial-desc">
        Agrega productos nuevos y decide con el switch si se muestran o no en la tienda del cliente.
      </p>
      {!esAdmin && (
        <p className="ventas-error" style={{ marginTop: "-0.5rem" }}>
          Solo un admin puede habilitar o deshabilitar productos.
        </p>
      )}

      {mensaje && (
        <div className={`roles-mensaje ${mensajeTipo === "error" ? "error" : "ok"}`}>
          {mensaje}
        </div>
      )}

      <div className="admin-productos-grid">
        <button
          type="button"
          className="admin-producto-add"
          onClick={abrirModalProducto}
        >
          <span className="admin-producto-add-plus">+</span>
          <span>Agregar producto nuevo</span>
        </button>

        {productosAdmin.map((producto) => (
          <div key={producto.id} className="admin-producto-card">
            <img
              src={producto.imagen}
              alt={producto.nombre}
              className="admin-producto-img"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="admin-producto-info">
              <strong>{producto.nombre}</strong>
              <span>{producto.categoria}</span>
              <span>{formatearPrecio(producto.precio)}</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => abrirModalEditarProducto(producto)}
              style={{ width: "100%" }}
            >
              Editar producto
            </button>
            <label className="admin-switch-row">
              <span>{producto.activo ? "Visible" : "Oculto"}</span>
              <button
                type="button"
                className={`admin-switch ${producto.activo ? "is-on" : ""}`}
                disabled={!esAdmin || toggleId === producto.id}
                onClick={() => cambiarEstado(producto)}
              >
                <span className="admin-switch-thumb" />
              </button>
            </label>
          </div>
        ))}
      </div>

      {mostrarFormulario && (
        <div className="modal">
          <div className="modal-backdrop" onClick={cerrarModalProducto} />
          <div className="modal-box admin-producto-modal">
            <button className="modal-cerrar" onClick={cerrarModalProducto}>&times;</button>

            <form className="admin-producto-form admin-producto-form-modal" onSubmit={submitCrearProducto}>
              <div className="admin-producto-form-header">
                <h2>{productoEditando ? "Editar producto" : "Agregar producto nuevo"}</h2>
              </div>

              <div className="admin-producto-form-grid">
                <div>
                  <label className="roles-label">Nombre</label>
                  <input className="roles-select admin-input" value={form.nombre} onChange={(e) => actualizarCampo("nombre", e.target.value)} />
                </div>

                <div>
                  <label className="roles-label">Precio</label>
                  <input className="roles-select admin-input" type="number" min="0" value={form.precio} onChange={(e) => actualizarCampo("precio", e.target.value)} />
                </div>

                <div>
                  <label className="roles-label">Categoria</label>
                  <select className="roles-select" value={form.categoria} onChange={(e) => actualizarCampo("categoria", e.target.value)}>
                    <option value="">Selecciona una categoria</option>
                    {categoriasDisponibles.map((categoria) => (
                      <option key={categoria} value={categoria}>{categoria.replace(/-/g, " ")}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="roles-label">Foto del producto</label>
                  <input className="roles-select admin-file" type="file" accept="image/*" onChange={manejarArchivo} />
                </div>
              </div>

              {preview && (
                <div className="admin-preview-wrap">
                  <img src={preview} alt="Vista previa" className="admin-preview-img" />
                </div>
              )}

              <div>
                <label className="roles-label">Descripcion</label>
                <textarea
                  className="admin-textarea"
                  rows="5"
                  placeholder="Escribe una caracteristica por linea"
                  value={form.descripcion}
                  onChange={(e) => actualizarCampo("descripcion", e.target.value)}
                />
              </div>

              <div>
                <label className="roles-label">Colores disponibles</label>
                <div className="admin-colores">
                  {coloresDisponibles.map((color) => (
                    <label key={color} className={`admin-color-chip ${form.colores.includes(color) ? "activo" : ""}`}>
                      <input
                        type="checkbox"
                        checked={form.colores.includes(color)}
                        onChange={() => toggleColor(color)}
                      />
                      <span>{color}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="admin-producto-form-actions">
                <button type="button" className="btn btn-ghost" onClick={cerrarModalProducto}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>
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
