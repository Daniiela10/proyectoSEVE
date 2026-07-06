import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";

const PLACEHOLDER_COMBO = "https://placehold.co/220x180/f8f6f3/e0ddd8?text=COMBO";

export default function ComboCard({ combo, soloVisualizacion = false }) {
  const { agregarAlCarrito, setSelectedProduct } = useApp();
  const [agregado, setAgregado] = useState(false);

  const tieneOferta = combo.enOferta && combo.precioOferta;
  const descuentoPct = tieneOferta && combo.precio
    ? Math.round((1 - combo.precioOferta / combo.precio) * 100)
    : null;

  function handleAbrirModal() {
    if (soloVisualizacion) return;
    const desc = Array.isArray(combo.descripcion)
      ? combo.descripcion
      : combo.descripcion ? combo.descripcion.split("\n").filter(Boolean) : [];

    setSelectedProduct({
      ...combo,
      id: combo._id || combo.id,
      descripcion: desc,
      categoria: "Combo",
      precioNormal: combo.precio,
    });
  }

  function handleAgregar() {
    if (soloVisualizacion) return;
    agregarAlCarrito({ ...combo, id: combo._id || combo.id }, 1);
    setAgregado(true);
    window.setTimeout(() => setAgregado(false), 1200);
  }

  return (
    <article className="producto">
      <span className="producto-badge producto-badge--combo">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        Combo
      </span>
      <img
        src={combo.imagen || PLACEHOLDER_COMBO}
        alt={combo.nombre}
        onClick={handleAbrirModal}
        style={{ cursor: soloVisualizacion ? "default" : "pointer" }}
        onError={(e) => { e.target.src = PLACEHOLDER_COMBO; }}
      />
      <h4 className="producto-nombre">{combo.nombre}</h4>
      <p className="producto-marca">SEVE Aluminios</p>
      <div className="producto-precio-wrap">
        {tieneOferta ? (
          <>
            <div className="producto-precio-fila">
              {descuentoPct && <span className="producto-dcto-badge">-{descuentoPct}%</span>}
              <span className="producto-precio-tachado">{formatearPrecio(combo.precio)}</span>
            </div>
            <p className="producto-precio-final">{formatearPrecio(combo.precioOferta)}</p>
          </>
        ) : (
          <p className="producto-precio-final">{formatearPrecio(combo.precio)}</p>
        )}
      </div>
      {!soloVisualizacion && (
        <button
          type="button"
          className={`btn-agregar-carrito${agregado ? " is-added" : ""}`}
          onClick={handleAgregar}
        >
          {agregado ? "Agregado" : "Agregar al carrito"}
        </button>
      )}
    </article>
  );
}