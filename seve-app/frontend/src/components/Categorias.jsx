import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE } from "@/config";
import "./categorias.css";

const ITEMS_POR_PAGINA_MOBILE = 6; // 2 columnas x 3 filas

const Categorias = ({ onSeleccionar, deshabilitado = false }) => {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [paginaActiva, setPaginaActiva] = useState(0);
  const trackRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_BASE}/ubicaciones/categorias-producto`)
      .then(({ data }) => {
        const remotas = data.map((cat) => ({
          nombre: cat.nombre,
          img: cat.imagen || "",
        }));
        setCategorias(remotas);
      })
      .catch(() => {
        setCategorias([]);
      })
      .finally(() => setCargando(false));
  }, []);

  // Agrupa las categorías en páginas para el carrusel mobile
  const paginas = [];
  for (let i = 0; i < categorias.length; i += ITEMS_POR_PAGINA_MOBILE) {
    paginas.push(categorias.slice(i, i + ITEMS_POR_PAGINA_MOBILE));
  }

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const pageWidth = track.clientWidth;
    const nuevaPagina = Math.round(track.scrollLeft / pageWidth);
    setPaginaActiva(nuevaPagina);
  };

  const irAPagina = (index) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  };

  const renderCard = (cat, index) => (
    <div
      key={index}
      className={`categoria-card${deshabilitado ? " categoria-card--disabled" : ""}`}
      onClick={() => !deshabilitado && onSeleccionar && onSeleccionar(cat.nombre)}
    >
      {cat.img ? (
        <img
          src={cat.img}
          alt={cat.nombre}
          className="categoria-card-img"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      ) : (
        <div className="categoria-card-placeholder" />
      )}

      <div className="categoria-card-label-bg">
        <p className="categoria-card-label">{cat.nombre}</p>
      </div>

      <div className="categoria-card-overlay">
        <div>
          <p className="categoria-card-overlay-label">{cat.nombre}</p>
          <span className="categoria-card-arrow">Ver productos →</span>
        </div>
      </div>
    </div>
  );

  return (
    <section className="categorias-section">
      <p className="categorias-title">Explora por</p>
      <h2 className="categorias-subtitle">Categorías</h2>

      {!cargando && categorias.length === 0 ? (
        <p className="categorias-vacio">Aún no hay categorías configuradas.</p>
      ) : (
        <>
          {/* Grid normal (desktop) */}
          <div className="categorias-grid">
            {categorias.map((cat, index) => renderCard(cat, index))}
          </div>

          {/* Carrusel con snap (mobile) */}
          <div className="categorias-carousel-wrapper">
            <div
              className="categorias-track"
              ref={trackRef}
              onScroll={handleScroll}
            >
              {paginas.map((pagina, pageIndex) => (
                <div className="categorias-pagina" key={pageIndex}>
                  {pagina.map((cat, i) => renderCard(cat, `${pageIndex}-${i}`))}
                </div>
              ))}
            </div>

            {paginas.length > 1 && (
              <div className="categorias-indicators">
                {paginas.map((_, index) => (
                  <button
                    key={index}
                    className={`indicator-dot${index === paginaActiva ? " indicator-dot--active" : ""}`}
                    onClick={() => irAPagina(index)}
                    aria-label={`Ir a página ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="categorias-footer">
        <button
          className="btn-ver-todo"
          onClick={() => !deshabilitado && onSeleccionar && onSeleccionar("")}
          disabled={deshabilitado}
        >
          Ver todo
        </button>
      </div>
    </section>
  );
};

export default Categorias;