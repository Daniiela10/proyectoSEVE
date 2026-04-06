import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "@/config";
import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";

const initialForm = {
  precioNormal: "",
  precioOferta: "",
  colores: [],
  enOferta: false,
};

export default function ProductosOfertaAdmin() {
  const { usuario, productosAdmin, cargarProductosAdmin, editarProducto } = useApp();
  const [coloresDisponibles, setColoresDisponibles] = useState([]);
  const [productoEditando, setProductoEditando] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarProductosAdmin().catch(() => {
      setMensaje("No fue posible cargar los productos");
      setMensajeTipo("error");
    });

    axios.get(`${API_BASE}/ubicaciones/colores-producto`)
      .then(({ data }) => setColoresDisponibles(data.map((item) => item.nombre)))
      .catch(() => {
        setMensaje("No fue posible cargar los colores");
        setMensajeTipo("error");
      });
  }, []);

  function abrirModal(producto) {
    setProductoEditando(producto);
    setForm({
      precioNormal: producto.precioNormal || producto.precio || "",
      precioOferta: producto.precioOferta || "",
      colores: Array.isArray(producto.colores) ? producto.colores : [],
      enOferta: Boolean(producto.enOferta),
    });
    setMostrarModal(true);
  }

  function cerrarModal() {
    setMostrarModal(false);
    setProductoEditando(null);
    setForm(initialForm);
  }

  function toggleColor(color) {
    setForm((prev) => ({
      ...prev,
      colores: prev.colores.includes(color)
        ? prev.colores.filter((item) => item !== color)
        : [...prev.colores, color],
    }));
  }

  async function guardarCambios(e) {
    e.preventDefault();
    if (!productoEditando) return;

    try {
      setGuardando(true);
      setMensaje("");
      await editarProducto(productoEditando.id, {
        ...productoEditando,
        precio: Number(form.precioNormal),
        precioOferta: form.enOferta && form.precioOferta ? Number(form.precioOferta) : null,
        colores: form.colores,
        enOferta: form.enOferta,
        descripcion: productoEditando.descripcion || [],
        categoria: productoEditando.categoria,
        nombre: productoEditando.nombre,
        imagen: productoEditando.imagen,
        activo: productoEditando.activo,
      });
      setMensaje("Producto de oferta actualizado correctamente");
      setMensajeTipo("ok");
      cerrarModal();
    } catch (err) {
      setMensaje(err?.response?.data?.error || "No fue posible actualizar la oferta");
      setMensajeTipo("error");
    } finally {
      setGuardando(false);
    }
  }

  const activos = productosAdmin.filter((producto) => producto.activo);

  if (!(usuario?.esAdmin || usuario?.rol === "empleado")) {
    return (
      <div>
        <h1 className="titulo-vista">Productos en oferta</h1>
        <p className="historial-vacio">No tienes permisos para ver esta seccion.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="titulo-vista">Productos en oferta</h1>
      <p className="historial-desc">
        Aqui eliges que productos activos aparecen como oferta y puedes ajustar su precio o colores.
      </p>

      {mensaje && (
        <div className={`roles-mensaje ${mensajeTipo === "error" ? "error" : "ok"}`}>
          {mensaje}
        </div>
      )}

      <div className="admin-productos-grid">
        {activos.map((producto) => (
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
              <span>
                {producto.enOferta && producto.precioOferta ? (
                  <>
                    <span style={{ textDecoration: "line-through", color: "#888", marginRight: 8 }}>
                      {formatearPrecio(producto.precioNormal)}
                    </span>
                    <span style={{ color: "#c0392b", fontWeight: 800 }}>
                      {formatearPrecio(producto.precioOferta)}
                    </span>
                  </>
                ) : (
                  formatearPrecio(producto.precioNormal || producto.precio)
                )}
              </span>
              <span style={{ color: producto.enOferta ? "#c0392b" : "#666", fontWeight: 700 }}>
                {producto.enOferta ? "En oferta" : "Sin oferta"}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: "100%" }}
              onClick={() => abrirModal(producto)}
            >
              Gestionar oferta
            </button>
          </div>
        ))}
      </div>

      {mostrarModal && productoEditando && (
        <div className="modal">
          <div className="modal-backdrop" onClick={cerrarModal} />
          <div className="modal-box admin-producto-modal">
            <button className="modal-cerrar" onClick={cerrarModal}>&times;</button>

            <form className="admin-producto-form admin-producto-form-modal" onSubmit={guardarCambios}>
              <div className="admin-producto-form-header">
                <h2>Gestionar oferta</h2>
              </div>

              <div className="admin-producto-offer-head">
                <img
                  src={productoEditando.imagen}
                  alt={productoEditando.nombre}
                  className="admin-preview-img"
                />
                <div className="admin-producto-info">
                  <strong>{productoEditando.nombre}</strong>
                  <span>{productoEditando.categoria}</span>
                </div>
              </div>

              <label className="admin-switch-row" style={{ marginBottom: "1rem" }}>
                <span>Marcar como producto en oferta</span>
                <button
                  type="button"
                  className={`admin-switch ${form.enOferta ? "is-on" : ""}`}
                  onClick={() => setForm((prev) => ({ ...prev, enOferta: !prev.enOferta }))}
                >
                  <span className="admin-switch-thumb" />
                </button>
              </label>

              <div className="admin-producto-form-grid">
                <div>
                  <label className="roles-label">Precio normal</label>
                  <input
                    className="roles-select admin-input"
                    type="number"
                    min="0"
                    value={form.precioNormal}
                    onChange={(e) => setForm((prev) => ({ ...prev, precioNormal: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="roles-label">Precio oferta</label>
                  <input
                    className="roles-select admin-input"
                    type="number"
                    min="0"
                    value={form.precioOferta}
                    onChange={(e) => setForm((prev) => ({ ...prev, precioOferta: e.target.value }))}
                    disabled={!form.enOferta}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1rem" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setForm((prev) => ({ ...prev, enOferta: false, precioOferta: "" }))}
                >
                  Volver al precio normal
                </button>
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
                <button type="button" className="btn btn-ghost" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
