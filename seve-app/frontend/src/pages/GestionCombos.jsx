import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { subirImagen, comprimirImagen } from "@/utils/subirImagen";
import { formatearPrecio } from "@/data";
import "./empleado.css";

const COMBO_VACIO = {
  nombre: "",
  descripcion: "",
  precio: "",
  precioOferta: "",
  enOferta: false,
  imagen: "",
  imagenes: [],
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

  const [cargando, setCargando]               = useState(true);
  const [busqueda, setBusqueda]               = useState("");
  const [modalAbierto, setModalAbierto]       = useState(false);
  const [editando, setEditando]               = useState(null);
  const [form, setForm]                       = useState(COMBO_VACIO);
  const [preview, setPreview]                 = useState("");
  const [guardando, setGuardando]             = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [eliminandoId, setEliminandoId]       = useState("");
  const [mensaje, setMensaje]                 = useState({ texto: "", tipo: "" });

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      setCargando(true);
      await cargarCombosAdmin();
    } finally {
      setCargando(false);
    }
  }

  function mostrarMensaje(texto, tipo) {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3500);
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
      nombre:       combo.nombre || "",
      descripcion:  combo.descripcion || "",
      precio:       combo.precio ?? "",
      precioOferta: combo.precioOferta ?? "",
      enOferta:     combo.enOferta || false,
      imagen:       combo.imagen || "",
      imagenes:     Array.isArray(combo.imagenes) ? combo.imagenes : [],
      activo:       combo.activo !== false,
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
    } catch { /* queda base64 */ }
  }

  function quitarImagen() {
    setPreview("");
    setForm((prev) => ({ ...prev, imagen: "" }));
  }

  async function agregarImagenAdicional(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const base64 = await comprimirImagen(archivo, 900, 0.82);
    setForm((prev) => {
      if (prev.imagenes.length >= 3) return prev;
      return { ...prev, imagenes: [...prev.imagenes, base64] };
    });
    e.target.value = "";
    try {
      const url = await subirImagen(base64, "seve-combos");
      setForm((prev) => ({
        ...prev,
        imagenes: prev.imagenes.map((img) => (img === base64 ? url : img)),
      }));
    } catch { /* queda base64 */ }
  }

  function quitarImagenAdicional(idx) {
    setForm((prev) => ({ ...prev, imagenes: prev.imagenes.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setGuardando(true);
      const datos = {
        nombre:       form.nombre,
        descripcion:  form.descripcion,
        precio:       Number(form.precio),
        precioOferta: form.precioOferta !== "" ? Number(form.precioOferta) : null,
        enOferta:     form.enOferta,
        imagen:       form.imagen,
        imagenes:     form.imagenes,
        activo:       form.activo,
      };
      if (editando) {
        await editarCombo(editando._id || editando.id, datos);
        mostrarMensaje("Combo actualizado correctamente", "ok");
      } else {
        await crearCombo(datos);
        mostrarMensaje("Combo creado correctamente", "ok");
      }
      cerrarModal();
      await cargar();
    } catch (err) {
      mostrarMensaje(err?.response?.data?.error || "Error al guardar", "error");
    } finally {
      setGuardando(false);
    }
  }

  async function toggleActivo(combo) {
    try {
      await actualizarEstadoCombo(combo._id || combo.id, !combo.activo);
      mostrarMensaje(!combo.activo ? "Combo activado" : "Combo desactivado", "ok");
      await cargar();
    } catch {
      mostrarMensaje("No se pudo cambiar el estado", "error");
    }
  }

  async function confirmarYEliminar() {
    if (!confirmarEliminar) return;
    try {
      setEliminandoId(confirmarEliminar._id || confirmarEliminar.id);
      await eliminarCombo(confirmarEliminar._id || confirmarEliminar.id);
      mostrarMensaje("Combo eliminado", "ok");
      setConfirmarEliminar(null);
      await cargar();
    } catch {
      mostrarMensaje("No se pudo eliminar", "error");
    } finally {
      setEliminandoId("");
    }
  }

  const filtrados = (combosAdmin || []).filter((c) =>
    !busqueda || c.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="emp-seccion">

      <div className="emp-seccion-header">
        <div>
          <h1 className="emp-titulo">Combos</h1>
          <p className="emp-desc">Crea, edita y administra los combos de la tienda.</p>
        </div>
        <button className="emp-btn emp-btn--primario" onClick={abrirNuevo}>
          + Nuevo combo
        </button>
      </div>

      {mensaje.texto && (
        <div className={`emp-mensaje emp-mensaje--${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      <input
        className="emp-busqueda"
        type="text"
        placeholder="Buscar combo..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      {cargando ? (
        <p className="emp-vacio">Cargando combos...</p>
      ) : filtrados.length === 0 ? (
        <p className="emp-vacio">No hay combos todavía. Crea el primero.</p>
      ) : (
        <div className="emp-tabla-wrap">
          <table className="emp-tabla">
            <thead>
              <tr>
                <th>Combo</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((combo) => (
                <tr key={combo._id || combo.id} className={!combo.activo ? "emp-tabla-fila--inactiva" : ""}>
                  <td>
                    <div className="emp-tabla-producto">
                      {combo.imagen && <img src={combo.imagen} alt={combo.nombre} className="emp-tabla-img" />}
                      <span>{combo.nombre}</span>
                    </div>
                  </td>
                  <td>
                    {combo.enOferta && combo.precioOferta ? (
                      <span>
                        <span style={{ textDecoration: "line-through", color: "#aaa", fontSize: 12, marginRight: 6 }}>
                          {formatearPrecio(combo.precio)}
                        </span>
                        <strong style={{ color: "#c0392b" }}>{formatearPrecio(combo.precioOferta)}</strong>
                      </span>
                    ) : formatearPrecio(combo.precio)}
                  </td>
                  <td>
                    <span className={`emp-badge ${combo.activo ? "emp-badge--activo" : "emp-badge--inactivo"}`}>
                      {combo.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="emp-tabla-acciones">
                      <button className="emp-btn emp-btn--sm emp-btn--secundario" onClick={() => abrirEditar(combo)}>
                        Editar
                      </button>
                      {esAdmin && (
                        <button
                          className={`emp-btn emp-btn--sm ${combo.activo ? "emp-btn--peligro" : "emp-btn--ok"}`}
                          onClick={() => toggleActivo(combo)}
                        >
                          {combo.activo ? "Desactivar" : "Activar"}
                        </button>
                      )}
                      <button
                        className="emp-btn emp-btn--sm emp-btn--eliminar"
                        onClick={() => setConfirmarEliminar(combo)}
                        disabled={eliminandoId === (combo._id || combo.id)}
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
            <h3 className="emp-confirmar-titulo">¿Eliminar combo?</h3>
            <p className="emp-confirmar-desc">
              Vas a eliminar <strong>{confirmarEliminar.nombre}</strong> de forma permanente. Esta acción no se puede deshacer.
            </p>
            <div className="emp-confirmar-acciones">
              <button className="emp-btn emp-btn--ghost" onClick={() => setConfirmarEliminar(null)}
                disabled={!!eliminandoId}>Cancelar</button>
              <button className="emp-btn emp-btn--eliminar-confirm" onClick={confirmarYEliminar}
                disabled={!!eliminandoId}>
                {eliminandoId ? "Eliminando..." : "Sí, eliminar"}
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
              <h2>{editando ? "Editar combo" : "Nuevo combo"}</h2>
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

              {/* Foto principal */}
              <div>
                <span className="emp-label" style={{ display: "block", marginBottom: 8 }}>Foto del combo</span>
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

              {/* Fotos adicionales */}
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
                        style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#c0392b", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
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

              <label className="emp-label">
                Descripción
                <textarea className="emp-input emp-textarea" name="descripcion" value={form.descripcion}
                  onChange={handleChange} placeholder="Describe qué incluye el combo..." rows={3} />
              </label>

              <label className="emp-label emp-label--check">
                <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
                Combo activo (visible en la tienda)
              </label>

              <div className="emp-form-acciones">
                <button type="button" className="emp-btn emp-btn--ghost" onClick={cerrarModal}>Cancelar</button>
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
