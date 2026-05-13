import React from "react";
import "./categorias.css";

const categorias = [
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

const Categorias = ({ onSeleccionar }) => {
  return (
    <section className="categorias-section">
      <p className="categorias-title">Explora por</p>
      <h2 className="categorias-subtitle">Categorías</h2>

      <div className="categorias-grid">
        {categorias.map((cat, index) => (
          <div
            key={index}
            className="categoria-card"
            onClick={() => onSeleccionar && onSeleccionar(cat.nombre)}
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
        <button className="btn-ver-todo" onClick={() => onSeleccionar && onSeleccionar("")}>
          Ver todo
        </button>
      </div>
    </section>
  );
};

export default Categorias;
