import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE } from "@/config";
import { comprimirImagen, subirImagen } from "@/utils/subirImagen";
import "./gestionCarrusel.css";

const CAT_VACIA = { nombre: "", imagen: "" };

function token() { return localStorage.getItem("seve_token"); }
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function GestionCategorias({ integrado = false }) {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(CAT_VACIA);
  const [editandoId, setEditandoId] = useState(null);
  const [subiendoImg, setSubiendoImg] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "ok" });
  const inputImgRef = useRef(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const { data } = await axios.get(`${API_BASE}/ubicaciones/categorias-producto/admin`, { headers: headers() });
      setCategorias(data);
    } catch {
      mostrarMensaje("No se pudieron cargar las categorías", "error");
    }
    setCargando(false);
  }

  function mostrarMensaje(texto, tipo = "ok") {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "ok" }), 4000);
  }

  async function handleImagen(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    e.target.value = "";
    setSubiendoImg(true);
    try {
      const base64 = await comprimirImagen(archivo, 900, 0.86);
      setForm(prev => ({ ...prev, imagen: base64 }));
      const url = await subirImagen(base64, "seve-categorias");
      setForm(prev => ({ ...prev, imagen: url }));
    } catch {
      mostrarMensaje("Error al subir la imagen", "error");
    }
    setSubiendoImg(false);
  }

  function seleccionar(cat) {
    setEditandoId(cat._id);
    setForm({ nombre: cat.nombre, imagen: cat.imagen || "" });
  }

  function cancelar() {
    setEditandoId(null);
    setForm(CAT_VACIA);
  }

  async function handleGuardar(e) {
    e.preventDefault();
    if (!form.nombre.trim()) { mostrarMensaje("Ingresa el nombre de la categoría", "error"); return; }
    setGuardando(true);
    try {
      if (editandoId) {
        const { data } = await axios.put(
          `${API_BASE}/ubicaciones/categorias-producto/${editandoId}`,
          { nombre: form.nombre.trim(), imagen: form.imagen },
          { headers: headers() }
        );
        setCategorias(prev => prev.map(c => c._id === editandoId ? data : c));
        mostrarMensaje("Categoría actualizada");
      } else {
        const { data } = await axios.post(
          `${API_BASE}/ubicaciones/categorias-producto`,
          { nombre: form.nombre.trim(), imagen: form.imagen },
          { headers: headers() }
        );
        setCategorias(prev => [...prev, data]);
        mostrarMensaje("Categoría creada");
      }
      cancelar();
    } catch (err) {
      mostrarMensaje(err.response?.data?.error || "Error al guardar", "error");
    }
    setGuardando(false);
  }

  async function handleEliminar(id) {
    if (!window.confirm("¿Eliminar esta categoría? Los productos con esta categoría quedarán sin categoría asignada.")) return;
    setEliminandoId(id);
    try {
      await axios.delete(`${API_BASE}/ubicaciones/categorias-producto/${id}`, { headers: headers() });
      setCategorias(prev => prev.filter(c => c._id !== id));
      if (editandoId === id) cancelar();
      mostrarMensaje("Categoría eliminada");
    } catch {
      mostrarMensaje("No se pudo eliminar", "error");
    }
    setEliminandoId(null);
  }

  return (
    <div className={integrado ? "gc-wrap gc-wrap--integrado" : "gc-wrap"}>
      <div className="gc-header">
        <div>
          <h1 className={integrado ? "gc-form-titulo" : "gc-titulo"}>Gestion de categorias</h1>
          <p className="gc-subtitulo">Agrega, edita o elimina las categorías de productos.</p>
        </div>
      </div>

      {mensaje.texto && (
        <div className={`gc-mensaje gc-mensaje--${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      <div className="gc-layout">

        {/* Lista */}
        <div className="gc-lista-wrap">
          <div className="gc-lista-header">
            <h2>Categorías</h2>
            <span className="gc-badge">{categorias.length}</span>
          </div>

          {cargando ? (
            <p className="gc-cargando">Cargando categorías...</p>
          ) : categorias.length === 0 ? (
            <p className="gc-vacio">No hay categorías. Agrega la primera.</p>
          ) : (
            <div className="gc-lista">
              {categorias.map(cat => (
                <div
                  key={cat._id}
                  className={`gc-card${editandoId === cat._id ? " gc-card--activa" : ""}`}
                  onClick={() => seleccionar(cat)}
                >
                  <div className="gc-card-img">
                    {cat.imagen
                      ? <img src={cat.imagen} alt={cat.nombre} />
                      : <span className="gc-card-img-vacio">Sin imagen</span>
                    }
                  </div>
                  <div className="gc-card-info">
                    <p className="gc-card-titulo">{cat.nombre}</p>
                    <p className="gc-card-sub">{cat.imagen ? "Con imagen" : "Sin imagen"}</p>
                  </div>
                  <button
                    className="gc-card-del"
                    onClick={e => { e.stopPropagation(); handleEliminar(cat._id); }}
                    disabled={eliminandoId === cat._id}
                    aria-label="Eliminar categoría"
                  >
                    {eliminandoId === cat._id ? "..." : "✕"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulario */}
        <div className="gc-form-wrap">
          <h2 className="gc-form-titulo">{editandoId ? "Editar categoría" : "Nueva categoría"}</h2>

          <form onSubmit={handleGuardar} className="gc-form">

            <div className="gc-field">
              <label className="gc-label" htmlFor="cat-nombre">Nombre</label>
              <input
                id="cat-nombre"
                className="gc-input"
                type="text"
                value={form.nombre}
                onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Ollas, Fiambreras, Calderos..."
                maxLength={60}
              />
            </div>

            <div className="gc-field">
              <label className="gc-label">
                Imagen
                <span className="gc-label-hint"> — recomendado 400 × 300 px</span>
              </label>
              <div
                className={`gc-img-drop${subiendoImg ? " gc-img-drop--cargando" : ""}`}
                onClick={() => !subiendoImg && inputImgRef.current?.click()}
                style={form.imagen ? { backgroundImage: `url(${form.imagen})` } : {}}
              >
                {subiendoImg ? (
                  <span className="gc-img-drop-label">Subiendo imagen...</span>
                ) : form.imagen ? (
                  <div className="gc-img-drop-overlay"><span>Cambiar imagen</span></div>
                ) : (
                  <div className="gc-img-drop-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span>Haz clic para subir</span>
                    <span className="gc-img-drop-hint">JPG o PNG</span>
                  </div>
                )}
              </div>
              <input
                ref={inputImgRef}
                type="file"
                accept="image/*"
                onChange={handleImagen}
                style={{ display: "none" }}
              />
            </div>

            <div className="gc-actions">
              <button
                type="submit"
                className="btn btn-primary gc-btn-guardar"
                disabled={guardando || subiendoImg}
              >
                {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Agregar categoría"}
              </button>
              {editandoId && (
                <button type="button" className="btn btn-ghost" onClick={cancelar}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
