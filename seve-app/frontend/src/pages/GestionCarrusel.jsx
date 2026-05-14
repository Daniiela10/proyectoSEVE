import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE } from "@/config";
import { comprimirImagen, subirImagen } from "@/utils/subirImagen";
import "./gestionCarrusel.css";

const SLIDE_VACIO = { imagen: "", titulo: "", subtitulo: "", orden: 0, activo: true };

function token() { return localStorage.getItem("seve_token"); }
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function GestionCarrusel() {
  const [slides, setSlides] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(SLIDE_VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [subiendoImg, setSubiendoImg] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "ok" });
  const [categorias, setCategorias] = useState([]);
  const [subiendoCategoriaId, setSubiendoCategoriaId] = useState("");
  const inputImgRef = useRef(null);

  useEffect(() => {
    cargarSlides();
    cargarCategorias();
  }, []);

  async function cargarSlides() {
    setCargando(true);
    try {
      const { data } = await axios.get(`${API_BASE}/carrusel/admin`, { headers: headers() });
      setSlides(data);
    } catch {
      mostrarMensaje("No se pudieron cargar los slides", "error");
    }
    setCargando(false);
  }

  async function cargarCategorias() {
    try {
      const { data } = await axios.get(`${API_BASE}/ubicaciones/categorias-producto/admin`, { headers: headers() });
      setCategorias(data);
    } catch {
      mostrarMensaje("No se pudieron cargar las categorias", "error");
    }
  }

  function mostrarMensaje(texto, tipo = "ok") {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "ok" }), 4000);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleImagen(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    e.target.value = "";
    setSubiendoImg(true);
    try {
      // Comprimir a 1200px ancho máximo (ideal para carrusel)
      const base64 = await comprimirImagen(archivo, 1200, 0.88);
      setForm(prev => ({ ...prev, imagen: base64 }));
      const url = await subirImagen(base64, "seve-carrusel");
      setForm(prev => ({ ...prev, imagen: url }));
    } catch {
      mostrarMensaje("Error al subir la imagen", "error");
    }
    setSubiendoImg(false);
  }

  async function handleImagenCategoria(categoria, e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    e.target.value = "";
    setSubiendoCategoriaId(categoria._id);
    const base64 = await comprimirImagen(archivo, 900, 0.86);
    setCategorias((prev) => prev.map((cat) => cat._id === categoria._id ? { ...cat, imagen: base64 } : cat));
    try {
      let url = base64;
      try {
        url = await subirImagen(base64, "seve-categorias");
      } catch {
        url = base64;
      }
      const { data } = await axios.patch(
        `${API_BASE}/ubicaciones/categorias-producto/${categoria._id}`,
        { imagen: url },
        { headers: headers() }
      );
      setCategorias((prev) => prev.map((cat) => cat._id === categoria._id ? data : cat));
      mostrarMensaje(url === base64 ? "Imagen de categoria guardada localmente" : "Imagen de categoria actualizada");
    } catch {
      mostrarMensaje("Error al actualizar la imagen de categoria", "error");
    }
    setSubiendoCategoriaId("");
  }

  function seleccionarSlide(slide) {
    setEditandoId(slide._id);
    setForm({
      imagen:    slide.imagen,
      titulo:    slide.titulo,
      subtitulo: slide.subtitulo,
      orden:     slide.orden,
      activo:    slide.activo,
    });
  }

  function cancelar() {
    setEditandoId(null);
    setForm(SLIDE_VACIO);
  }

  async function handleGuardar(e) {
    e.preventDefault();
    if (!form.imagen) { mostrarMensaje("Sube una imagen primero", "error"); return; }
    setGuardando(true);
    try {
      if (editandoId) {
        const { data } = await axios.put(`${API_BASE}/carrusel/${editandoId}`, form, { headers: headers() });
        setSlides(prev => prev.map(s => s._id === editandoId ? data : s));
        mostrarMensaje("Slide actualizado");
      } else {
        const { data } = await axios.post(`${API_BASE}/carrusel`, form, { headers: headers() });
        setSlides(prev => [...prev, data]);
        mostrarMensaje("Slide creado");
      }
      cancelar();
    } catch (err) {
      mostrarMensaje(err.response?.data?.error || "Error al guardar", "error");
    }
    setGuardando(false);
  }

  async function handleEliminar(id) {
    if (!window.confirm("¿Eliminar este slide?")) return;
    setEliminandoId(id);
    try {
      await axios.delete(`${API_BASE}/carrusel/${id}`, { headers: headers() });
      setSlides(prev => prev.filter(s => s._id !== id));
      if (editandoId === id) cancelar();
      mostrarMensaje("Slide eliminado");
    } catch {
      mostrarMensaje("No se pudo eliminar", "error");
    }
    setEliminandoId(null);
  }

  return (
    <div className="gc-wrap">
      <div className="gc-header">
        <div>
          <h1 className="gc-titulo">Editar pagina principal</h1>
          <p className="gc-subtitulo">Gestiona las imágenes y textos que aparecen en la página principal.</p>
        </div>
      </div>

      {mensaje.texto && (
        <div className={`gc-mensaje gc-mensaje--${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      <div className="gc-categorias-wrap">
        <div className="gc-lista-header">
          <h2>Imagenes de categorias</h2>
          <span className="gc-badge">{categorias.length}</span>
        </div>
        <div className="gc-categorias-grid">
          {categorias.map((categoria) => (
            <label key={categoria._id} className="gc-categoria-card">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImagenCategoria(categoria, e)}
                disabled={subiendoCategoriaId === categoria._id}
              />
              <span className="gc-categoria-img">
                {categoria.imagen ? (
                  <img src={categoria.imagen} alt={categoria.nombre} />
                ) : (
                  <span>Sin imagen</span>
                )}
              </span>
              <strong>{categoria.nombre}</strong>
              <small>{subiendoCategoriaId === categoria._id ? "Subiendo..." : "Cambiar imagen"}</small>
            </label>
          ))}
        </div>
      </div>

      <div className="gc-layout">

        {/* ── Lista de slides ── */}
        <div className="gc-lista-wrap">
          <div className="gc-lista-header">
            <h2>Slides actuales</h2>
            <span className="gc-badge">{slides.length}</span>
          </div>

          {cargando ? (
            <p className="gc-cargando">Cargando slides...</p>
          ) : slides.length === 0 ? (
            <p className="gc-vacio">No hay slides. Agrega el primero.</p>
          ) : (
            <div className="gc-lista">
              {slides.map(slide => (
                <div
                  key={slide._id}
                  className={`gc-card${editandoId === slide._id ? " gc-card--activa" : ""}${!slide.activo ? " gc-card--inactiva" : ""}`}
                  onClick={() => seleccionarSlide(slide)}
                >
                  <div className="gc-card-img">
                    {slide.imagen
                      ? <img src={slide.imagen} alt={slide.titulo} />
                      : <span className="gc-card-img-vacio">Sin imagen</span>
                    }
                  </div>
                  <div className="gc-card-info">
                    <p className="gc-card-titulo">{slide.titulo || <em>Sin título</em>}</p>
                    <p className="gc-card-sub">{slide.subtitulo || <em>Sin subtítulo</em>}</p>
                    <div className="gc-card-meta">
                      <span className="gc-orden-chip">Orden: {slide.orden}</span>
                      <span className={`gc-estado-chip ${slide.activo ? "gc-estado-chip--activo" : "gc-estado-chip--inactivo"}`}>
                        {slide.activo ? "Visible" : "Oculto"}
                      </span>
                    </div>
                  </div>
                  <button
                    className="gc-card-del"
                    onClick={e => { e.stopPropagation(); handleEliminar(slide._id); }}
                    disabled={eliminandoId === slide._id}
                    aria-label="Eliminar slide"
                  >
                    {eliminandoId === slide._id ? "..." : "✕"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Formulario ── */}
        <div className="gc-form-wrap">
          <h2 className="gc-form-titulo">{editandoId ? "Editar slide" : "Nuevo slide"}</h2>

          <form onSubmit={handleGuardar} className="gc-form">

            {/* Imagen */}
            <div className="gc-field">
              <label className="gc-label">
                Imagen del slide
                <span className="gc-label-hint"> — tamaño recomendado: 1200 × 450 px (horizontal)</span>
              </label>

              <div
                className={`gc-img-drop${subiendoImg ? " gc-img-drop--cargando" : ""}`}
                onClick={() => !subiendoImg && inputImgRef.current?.click()}
                style={form.imagen ? { backgroundImage: `url(${form.imagen})` } : {}}
              >
                {subiendoImg ? (
                  <span className="gc-img-drop-label">Subiendo imagen...</span>
                ) : form.imagen ? (
                  <div className="gc-img-drop-overlay">
                    <span>Cambiar imagen</span>
                  </div>
                ) : (
                  <div className="gc-img-drop-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span>Haz clic para subir</span>
                    <span className="gc-img-drop-hint">1200 × 450 px · JPG o PNG</span>
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

            {/* Título */}
            <div className="gc-field">
              <label className="gc-label" htmlFor="gc-titulo">Título</label>
              <input
                id="gc-titulo"
                className="gc-input"
                type="text"
                name="titulo"
                value={form.titulo}
                onChange={handleChange}
                placeholder="Ej: Calderos de Alta Calidad"
                maxLength={80}
              />
            </div>

            {/* Subtítulo */}
            <div className="gc-field">
              <label className="gc-label" htmlFor="gc-subtitulo">Subtítulo</label>
              <input
                id="gc-subtitulo"
                className="gc-input"
                type="text"
                name="subtitulo"
                value={form.subtitulo}
                onChange={handleChange}
                placeholder="Ej: Resistentes y duraderos para tu cocina"
                maxLength={120}
              />
            </div>

            {/* Orden y activo */}
            <div className="gc-row">
              <div className="gc-field gc-field--half">
                <label className="gc-label" htmlFor="gc-orden">Orden de aparición</label>
                <input
                  id="gc-orden"
                  className="gc-input"
                  type="number"
                  name="orden"
                  value={form.orden}
                  onChange={handleChange}
                  min={0}
                  placeholder="0"
                />
              </div>
              <div className="gc-field gc-field--half gc-field--toggle">
                <label className="gc-label">Visibilidad</label>
                <label className="gc-toggle">
                  <input
                    type="checkbox"
                    name="activo"
                    checked={form.activo}
                    onChange={handleChange}
                  />
                  <span className="gc-toggle-track">
                    <span className="gc-toggle-thumb" />
                  </span>
                  <span className="gc-toggle-texto">{form.activo ? "Visible en el carrusel" : "Oculto"}</span>
                </label>
              </div>
            </div>

            {/* Acciones */}
            <div className="gc-actions">
              <button
                type="submit"
                className="btn btn-primary gc-btn-guardar"
                disabled={guardando || subiendoImg}
              >
                {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Agregar slide"}
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
