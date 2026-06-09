import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";

export default function ProductoCard({ producto, soloVisualizacion = false }) {
  const { agregarAlCarrito, setSelectedProduct } = useApp();
  const [qty, setQty] = useState(1);
  const [agregado, setAgregado] = useState(false);

  function handleImageClick() {
    if (soloVisualizacion) return;
    setSelectedProduct(producto);
  }

  function handleAgregar() {
    if (soloVisualizacion) return;
    agregarAlCarrito(producto, qty);
    setAgregado(true);
    window.setTimeout(() => setAgregado(false), 1200);
  }

  return (
    <article className="producto">
      {producto.enOferta && (
        <span className="producto-badge producto-badge--oferta">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Oferta
        </span>
      )}
      <img
        src={producto.imagenVista || producto.imagen}
        alt={producto.nombre}
        onClick={handleImageClick}
        style={{ cursor: "pointer" }}
        onError={(e) => { e.target.src = "https://placehold.co/220x180/f8f6f3/e0ddd8?text=SEVE"; }}
      />
      <h4>{producto.nombre}</h4>
      {producto.enOferta && producto.precioOferta ? (
        <p className="producto-precio-oferta-wrap">
          <span className="producto-precio-normal">{formatearPrecio(producto.precioNormal)}</span>
          <span className="producto-precio-oferta">{formatearPrecio(producto.precioOferta)}</span>
        </p>
      ) : (
        <p>{formatearPrecio(producto.precio)}</p>
      )}
      {!soloVisualizacion && (
        <>
          <div className="producto-cantidad">
            <button type="button" className="qty-btn qty-menos" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
            <input
              type="number"
              className="qty-input"
              value={qty}
              min="1"
              max="99"
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || val === "0") { setQty(""); return; }
                const n = parseInt(val, 10);
                if (!isNaN(n)) setQty(Math.min(99, n));
              }}
              onBlur={() => { if (!qty || qty < 1) setQty(1); }}
            />
            <button type="button" className="qty-btn qty-mas" onClick={() => setQty((q) => Math.min(99, q + 1))}>+</button>
          </div>
          <button
            type="button"
            className={`btn-agregar-carrito${agregado ? " is-added" : ""}`}
            onClick={handleAgregar}
          >
            {agregado ? "Agregado" : "Agregar al carrito"}
          </button>
        </>
      )}
    </article>
  );
}
