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
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setEditando(null);
    setForm(COMBO_VACIO);
    setPreview("");
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
        setMensaje({ texto: "Combo actualizado correctamente", tipo: "ok" });
      } else {
        await crearCombo(datos);
        setMensaje({ texto: "Combo creado correctamente", tipo: "ok" });
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
      setMensaje({ texto: "Combo eliminado", tipo: "ok" });
    } catch {
      setMensaje({ texto: "Error al eliminar", tipo: "error" });
    } finally {
      setEliminandoId("");
    }
  }

  const filtrados = (combosAdmin || []).filter((c) =>
    !busqueda || c.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="ep-wrap">
      <div className="ep-header">
        <div>
          <h2 className="ep-titulo">Gestión de Combos</h2>
          <p className="ep-subtitulo">Crea y administra los combos de la tienda.</p>
        </div>
        <button className="ep-btn ep-btn--primario" onClick={abrirNuevo}>+ Nuevo combo</button>
      </div>

      {mensaje.texto && (
        <p className={`ep-mensaje ep-mensaje--${mensaje.tipo}`} style={{ marginBottom: 12 }}>
          {mensaje.texto}
        </p>
      )}

      <div className="ep-filtros">
        <input
          className="ep-busqueda"
          type="text"
          placeholder="Buscar combo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {cargando ? (
        <p className="ep-cargando">Cargando combos...</p>
      ) : filtrados.length === 0 ? (
        <p className="ep-vacio">No hay combos. Crea el primero.</p>
      ) : (
        <div className="ep-tabla-wrap">
          <table className="ep-tabla">
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
                <tr key={combo._id || combo.id} style={{ opacity: combo.activo ? 1 : 0.5 }}>
                  <td>
                    {combo.imagen ? (
                      <img src={combo.imagen} alt={combo.nombre} style={{ width: 56, height: 44, objectFit: "cover", borderRadius: 6 }} />
                    ) : (
                      <div style={{ width: 56, height: 44, background: "#eee", borderRadius: 6 }} />
                    )}
                  </td>
                  <td><strong>{combo.nombre}</strong></td>
                  <td style={{ fontSize: 13, color: "#666", maxWidth: 200 }}>{combo.descripcion || "—"}</td>
                  <td>{formatearPrecio(combo.precio)}</td>
                  <td>
                    <span className={`ep-badge ${combo.activo ? "ep-badge--activo" : "ep-badge--inactivo"}`}>
                      {combo.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="ep-btn ep-btn--secundario ep-btn--sm" onClick={() => abrirEditar(combo)}>Editar</button>
                      <button
                        className="ep-btn ep-btn--secundario ep-btn--sm"
                        onClick={() => handleToggleActivo(combo)}
                      >
                        {combo.activo ? "Desactivar" : "Activar"}
                      </button>
                      {esAdmin && (
                        confirmar === (combo._id || combo.id) ? (
                          <>
                            <button
                              className="ep-btn ep-btn--peligro ep-btn--sm"
                              disabled={eliminandoId === (combo._id || combo.id)}
                              onClick={() => handleEliminar(combo._id || combo.id)}
                            >
                              {eliminandoId === (combo._id || combo.id) ? "..." : "Confirmar"}
                            </button>
                            <button className="ep-btn ep-btn--secundario ep-btn--sm" onClick={() => setConfirmar(null)}>Cancelar</button>
                          </>
                        ) : (
                          <button className="ep-btn ep-btn--peligro ep-btn--sm" onClick={() => setConfirmar(combo._id || combo.id)}>Eliminar</button>
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
        <div className="ep-modal-overlay" onClick={cerrarModal}>
          <div className="ep-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="ep-modal-titulo">{editando ? "Editar combo" : "Nuevo combo"}</h3>
            <form onSubmit={handleSubmit} className="ep-form">

              <label className="ep-label">
                Nombre *
                <input className="ep-input" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: Combo ollas + sartén" required />
              </label>

              <label className="ep-label">
                Descripción
                <textarea className="ep-input" name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Descripción del combo..." rows={3} style={{ resize: "vertical" }} />
              </label>

              <label className="ep-label">
                Precio *
                <input className="ep-input" name="precio" type="number" min="0" value={form.precio} onChange={handleChange} placeholder="Ej: 150000" required />
              </label>

              <label className="ep-label">
                Imagen
                <input type="file" accept="image/*" onChange={manejarArchivo} style={{ marginTop: 6 }} />
              </label>
              {preview && (
                <div style={{ marginTop: 8 }}>
                  <img src={preview} alt="preview" style={{ width: 120, height: 96, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }} />
                  <button type="button" className="ep-btn ep-btn--secundario ep-btn--sm" style={{ marginLeft: 10 }} onClick={() => { setPreview(""); setForm((p) => ({ ...p, imagen: "" })); }}>Quitar</button>
                </div>
              )}

              <label className="ep-label ep-label--check">
                <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
                Combo activo (visible en la tienda)
              </label>

              {mensaje.texto && <p className={`ep-mensaje ep-mensaje--${mensaje.tipo}`}>{mensaje.texto}</p>}

              <div className="ep-modal-acciones">
                <button type="button" className="ep-btn ep-btn--secundario" onClick={cerrarModal}>Cancelar</button>
                <button type="submit" className="ep-btn ep-btn--primario" disabled={guardando}>
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
