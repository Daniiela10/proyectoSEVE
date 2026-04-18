import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";

export default function ProductoCard({ producto }) {
  const { agregarAlCarrito, setSelectedProduct } = useApp();
  const [qty, setQty] = useState(1);
  const [agregado, setAgregado] = useState(false);

  function handleImageClick() {
    setSelectedProduct(producto);
  }

  function handleAgregar() {
    agregarAlCarrito(producto, qty);
    setAgregado(true);
    window.setTimeout(() => setAgregado(false), 1200);
  }

  return (
    <article className="producto">
      {producto.enOferta && <span className="producto-ribbon">OFERTA</span>}
      <img
        src={producto.imagen}
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
      <div className="producto-cantidad">
        <button type="button" className="qty-btn qty-menos" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
        <input
          type="number"
          className="qty-input"
          value={qty}
          min="1"
          max="99"
          onChange={(e) => setQty(Math.min(99, Math.max(1, parseInt(e.target.value, 10) || 1)))}
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
    </article>
  );
}
