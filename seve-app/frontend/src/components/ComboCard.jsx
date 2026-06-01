import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";

export default function ComboCard({ combo, soloVisualizacion = false }) {
  const { agregarAlCarrito } = useApp();
  const [agregado, setAgregado] = useState(false);

  function handleAgregar() {
    if (soloVisualizacion) return;
    agregarAlCarrito({ ...combo, id: combo._id || combo.id }, 1);
    setAgregado(true);
    window.setTimeout(() => setAgregado(false), 1200);
  }

  return (
    <article className="producto">
      <span className="producto-ribbon" style={{ background: "#c0392b" }}>COMBO</span>
      <img
        src={combo.imagen || "https://placehold.co/220x180/f8f6f3/e0ddd8?text=COMBO"}
        alt={combo.nombre}
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
