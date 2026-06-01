import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE } from "@/config";

const SLIDES_DEFAULT = [
  { imagen: "/img/calderos.png",      titulo: "Calderos de Alta Calidad",    subtitulo: "Resistentes y duraderos para tu cocina" },
  { imagen: "/img/juegodeOllas.png",  titulo: "Juego de Ollas Completo",     subtitulo: "Todo lo que necesitas en un solo set" },
  { imagen: "/img/olla.png",          titulo: "Ollas SEVE Aluminios",        subtitulo: "Calidad y durabilidad garantizada" },
];

export default function Carrusel({ onVerProductos }) {
  const [slides, setSlides] = useState(SLIDES_DEFAULT);
  const [actual, setActual] = useState(0);
  const [animando, setAnimando] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/carrusel`)
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) setSlides(data);
      })
      .catch(() => {});
  }, []);

  const ir = useCallback((indice) => {
    if (animando) return;
    setAnimando(true);
    setActual(indice);
    setTimeout(() => setAnimando(false), 500);
  }, [animando]);

  const anterior = () => {
    if (slides.length === 0) return;
    ir((actual - 1 + slides.length) % slides.length);
  };
  const siguiente = () => {
    if (slides.length === 0) return;
    ir((actual + 1) % slides.length);
  };

  useEffect(() => {
    if (slides.length === 0) return;
    const id = setInterval(() => {
      setActual((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <div className="carrusel">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`carrusel-slide${i === actual ? " activo" : ""}`}
          style={{ backgroundImage: `url(${slide.imagen})` }}
        >
          <div className="carrusel-overlay" />
          <div className="carrusel-contenido">
            <h1>{slide.titulo}</h1>
            <p>{slide.subtitulo}</p>
            <button className="btn btn-primary carrusel-btn" onClick={onVerProductos}>
              Ver productos
            </button>
          </div>
        </div>
      ))}

      <button className="carrusel-flecha carrusel-flecha-izq" onClick={anterior} aria-label="Anterior">
        &#8249;
      </button>
      <button className="carrusel-flecha carrusel-flecha-der" onClick={siguiente} aria-label="Siguiente">
        &#8250;
      </button>

      <div className="carrusel-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`carrusel-dot${i === actual ? " activo" : ""}`}
            onClick={() => ir(i)}
            aria-label={`Ir a slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
