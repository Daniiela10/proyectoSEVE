import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE } from "@/config";
import "./categorias.css";

const Categorias = ({ onSeleccionar, deshabilitado = false }) => {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [puedeIzq, setPuedeIzq] = useState(false);
  const [puedeDer, setPuedeDer] = useState(false);
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
      .catch(() => setCategorias([]))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    actualizarFlechas();
    window.addEventListener("resize", actualizarFlechas);
    return () => window.removeEventListener("resize", actualizarFlechas);
  }, [categorias]);

  function actualizarFlechas() {
    const track = trackRef.current;
    if (!track) return;
    setPuedeIzq(track.scrollLeft > 4);
    setPuedeDer(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }

  function desplazar(direccion) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector(".categoria-card");
    const distancia = card ? card.offsetWidth + 16 : 220; // ancho tarjeta + gap
    track.scrollBy({ left: direccion * distancia * 2, behavior: "smooth" });
  }

  return (
    <section className="categorias-section">
      <p className="categorias-title">Explora por</p>
      <h2 className="categorias-subtitle">Categorías</h2>

      {!cargando && categorias.length === 0 ? (
        <p className="categorias-vacio">Aún no hay categorías configuradas.</p>
      ) : (
        <div className="categorias-carousel">
          <button
            type="button"
            className={`categorias-flecha categorias-flecha--izq${!puedeIzq ? " oculta" : ""}`}
            onClick={() => desplazar(-1)}
            aria-label="Ver categorías anteriores"
          >
            <span className="categorias-flecha-icono">‹</span>
          </button>

          <div
            className="categorias-track"
            ref={trackRef}
            onScroll={actualizarFlechas}
          >
            {categorias.map((cat, index) => (
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
            ))}
          </div>

          <button
            type="button"
            className={`categorias-flecha categorias-flecha--der${!puedeDer ? " oculta" : ""}`}
            onClick={() => desplazar(1)}
            aria-label="Ver más categorías"
          >
            <span className="categorias-flecha-icono">›</span>
          </button>
        </div>
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