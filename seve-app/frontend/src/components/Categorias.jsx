import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "@/config";
import "./categorias.css";

const CATEGORIAS_FALLBACK = [
  {
    nombre: "Juego De Ollas",
    img: "/img/Categorias/juegoOllas.png",
  },
  {
    nombre: "Olletas",
    img: "/img/juegodeOllas.png",
  },
  {
    nombre: "Fiambreras",
    img: "/img/calderos.png",
  },
  {
    nombre: "Ollas",
    img: "/img/olla.png",
  },
];

const Categorias = ({ onSeleccionar, deshabilitado = false }) => {
  const [categorias, setCategorias] = useState(CATEGORIAS_FALLBACK);

  useEffect(() => {
    axios.get(`${API_BASE}/ubicaciones/categorias-producto`)
      .then(({ data }) => {
        const remotas = data.map((cat) => ({
          nombre: cat.nombre,
          img: cat.imagen || CATEGORIAS_FALLBACK.find((item) => item.nombre === cat.nombre)?.img || "",
        }));
        if (remotas.length) setCategorias(remotas);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="categorias-section">
      <p className="categorias-title">Explora por</p>
      <h2 className="categorias-subtitle">Categorías</h2>

      <div className="categorias-grid">
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
