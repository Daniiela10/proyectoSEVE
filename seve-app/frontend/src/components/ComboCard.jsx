import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";

export default function ComboCard({ combo, soloVisualizacion = false }) {
  const { agregarAlCarrito, setSelectedProduct } = useApp();
  const [agregado, setAgregado] = useState(false);

  function handleAbrirModal() {
    if (soloVisualizacion) return;
    setSelectedProduct({
      ...combo,
      id: combo._id || combo.id,
      descripcion: combo.descripcion ? [combo.descripcion] : [],
      categoria: "Combo",
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
        src={combo.imagen || "https://placehold.co/220x180/f8f6f3/e0ddd8?text=COMBO"}
        alt={combo.nombre}
        onClick={handleAbrirModal}
        style={{ cursor: soloVisualizacion ? "default" : "pointer" }}
        onError={(e) => { e.target.src = "https://placehold.co/220x180/f8f6f3/e0ddd8?text=COMBO"; }}
      />
      <h4>{combo.nombre}</h4>
      {combo.descripcion && (
        <p style={{ fontSize: 12, color: "#888", margin: "4px 0 6px", lineHeight: 1.4 }}>
          {combo.descripcion}
        </p>
      )}
      <p>{formatearPrecio(combo.precio)}</p>
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
