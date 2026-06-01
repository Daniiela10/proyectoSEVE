import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { subirImagen, comprimirImagen } from "@/utils/subirImagen";
import { formatearPrecio } from "@/data";
import "./empleado.css";

const COMBO_VACIO = {
  nombre: "",
  descripcion: "",
  precio: "",
  imagen: "",
  activo: true,
};

export default function GestionCombos() {
  const {
    usuario,
    combosAdmin,
    cargarCombosAdmin,
    crearCombo,
    editarCombo,
    actualizarEstadoCombo,
    eliminarCombo,
  } = useApp();

  const esAdmin = Boolean(usuario?.esAdmin || usuario?.rol === "admin");

  const [cargando, setCargando]         = useState(true);
  const [busqueda, setBusqueda]         = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando]         = useState(null);
  const [form, setForm]                 = useState(COMBO_VACIO);
  const [preview, setPreview]           = useState("");
  const [guardando, setGuardando]       = useState(false);
  const [eliminandoId, setEliminandoId] = useState("");
  const [confirmar, setConfirmar]       = useState(null);
  const [mensaje, setMensaje]           = useState({ texto: "", tipo: "" });

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      setCargando(true);
      await cargarCombosAdmin();
    } finally {
      setCargando(false);
    }
  }

  function abrirNuevo() {
    setEditando(null);
    setForm(COMBO_VACIO);
    setPreview("");
    setMensaje({ texto: "", tipo: "" });
    setModalAbierto(true);
  }

  function abrirEditar(combo) {
    setEditando(combo);
    setForm({
      nombre:      combo.nombre || "",
      descripcion: combo.descripcion || "",
      precio:      combo.precio ?? "",
      imagen:      combo.imagen || "",
      activo:      combo.activo !== false,
    });
    setPreview(combo.imagen || "");
    setMensaje({ texto: "", tipo: "" });
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setEditando(null);
    setForm(COMBO_VACIO);
    setPreview("");
    setMensaje({ texto: "", tipo: "" });
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function manejarArchivo(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const base64 = await comprimirImagen(archivo, 900, 0.82);
    setPreview(base64);
    setForm((prev) => ({ ...prev, imagen: base64 }));
    try {
      const url = await subirImagen(base64, "seve-combos");
      setForm((prev) => ({ ...prev, imagen: url }));
      setPreview(url);
    } catch { /* queda el base64 */ }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim()) return setMensaje({ texto: "El nombre es requerido", tipo: "error" });
    if (!form.precio || isNaN(Number(form.precio))) return setMensaje({ texto: "El precio es requerido", tipo: "error" });

    try {
      setGuardando(true);
      const datos = { ...form, precio: Number(form.precio) };
      if (editando) {
        await editarCombo(editando._id || editando.id, datos);
      } else {
        await crearCombo(datos);
      }
      cerrarModal();
      await cargar();
    } catch (err) {
      setMensaje({ texto: err?.response?.data?.error || "Error al guardar", tipo: "error" });
    } finally {
      setGuardando(false);
    }
  }

  async function handleToggleActivo(combo) {
    try {
      await actualizarEstadoCombo(combo._id || combo.id, !combo.activo);
      await cargar();
    } catch {}
  }

  async function handleEliminar(id) {
    try {
      setEliminandoId(id);
      await eliminarCombo(id);
      setConfirmar(null);
      await cargar();
    } catch {
    } finally {
      setEliminandoId("");
    }
  }

  const filtrados = (combosAdmin || []).filter((c) =>
    !busqueda || c.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="emp-seccion">

      {/* Encabezado */}
      <div className="emp-seccion-header">
        <div>
          <h2 className="emp-titulo">Gestión de Combos</h2>
          <p className="emp-desc">Crea y administra los combos visibles en la tienda.</p>
        </div>
        <button className="emp-btn emp-btn--primario" onClick={abrirNuevo}>
          + Nuevo combo
        </button>
      </div>

      {/* Filtro */}
      <div className="emp-filtros">
        <input
          className="emp-busqueda"
          type="text"
          placeholder="Buscar combo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla */}
      {cargando ? (
        <p className="emp-vacio">Cargando combos...</p>
      ) : filtrados.length === 0 ? (
        <p className="emp-vacio">No hay combos todavía. Crea el primero.</p>
      ) : (
        <div className="emp-tabla-wrap">
          <table className="emp-tabla">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((combo) => (
                <tr key={combo._id || combo.id} className={combo.activo ? "" : "emp-tabla-fila--inactiva"}>
                  <td>
                    {combo.imagen
                      ? <img src={combo.imagen} alt={combo.nombre} className="emp-tabla-img" />
                      : <div className="emp-tabla-img" style={{ background: "#f0f0f0" }} />
                    }
                  </td>
                  <td><strong className="emp-tabla-nombre">{combo.nombre}</strong></td>
                  <td style={{ fontSize: 13, color: "#666", maxWidth: 200 }}>{combo.descripcion || "—"}</td>
                  <td>{formatearPrecio(combo.precio)}</td>
                  <td>
                    <span className={`emp-badge ${combo.activo ? "emp-badge--activo" : "emp-badge--inactivo"}`}>
                      {combo.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="emp-tabla-acciones">
                      <button className="emp-btn emp-btn--secundario emp-btn--sm" onClick={() => abrirEditar(combo)}>
                        Editar
                      </button>
                      <button className="emp-btn emp-btn--secundario emp-btn--sm" onClick={() => handleToggleActivo(combo)}>
                        {combo.activo ? "Desactivar" : "Activar"}
                      </button>
                      {esAdmin && (
                        confirmar === (combo._id || combo.id) ? (
                          <>
                            <button
                              className="emp-btn emp-btn--peligro emp-btn--sm"
                              disabled={eliminandoId === (combo._id || combo.id)}
                              onClick={() => handleEliminar(combo._id || combo.id)}
                            >
                              {eliminandoId === (combo._id || combo.id) ? "..." : "Confirmar"}
                            </button>
                            <button className="emp-btn emp-btn--secundario emp-btn--sm" onClick={() => setConfirmar(null)}>
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button className="emp-btn emp-btn--peligro emp-btn--sm" onClick={() => setConfirmar(combo._id || combo.id)}>
                            Eliminar
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {modalAbierto && (
        <div className="emp-modal-backdrop" onClick={cerrarModal}>
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>

            <div className="emp-modal-header">
              <h2>{editando ? "Editar combo" : "Nuevo combo"}</h2>
              <button className="emp-modal-cerrar" onClick={cerrarModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="emp-form">

              <label className="emp-label">
                Nombre *
                <input className="emp-input" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: Combo ollas + sartén" required />
              </label>

              <label className="emp-label">
                Descripción
                <textarea className="emp-input emp-textarea" name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Describe qué incluye el combo..." rows={3} />
              </label>

              <label className="emp-label">
                Precio *
                <input className="emp-input" name="precio" type="number" min="0" value={form.precio} onChange={handleChange} placeholder="Ej: 150000" required />
              </label>

              <label className="emp-label">
                Imagen
                <label className="emp-file-label" style={{ marginTop: 6 }}>
                  <span className="emp-file-btn">📁 Seleccionar imagen</span>
                  <input className="emp-file-input" type="file" accept="image/*" onChange={manejarArchivo} />
                </label>
              </label>

              {preview && (
                <div className="emp-preview-wrap">
                  <img src={preview} alt="preview" className="emp-preview-img" />
                  <button
                    type="button"
                    className="emp-preview-quitar"
                    onClick={() => { setPreview(""); setForm((p) => ({ ...p, imagen: "" })); }}
                  >
                    Quitar imagen
                  </button>
                </div>
              )}

              <label className="emp-label emp-label--check">
                <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
                Combo activo (visible en la tienda)
              </label>

              {mensaje.texto && (
                <p className={`emp-mensaje emp-mensaje--${mensaje.tipo}`}>{mensaje.texto}</p>
              )}

              <div className="emp-form-acciones">
                <button type="button" className="emp-btn emp-btn--secundario" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="emp-btn emp-btn--primario" disabled={guardando}>
                  {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear combo"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
