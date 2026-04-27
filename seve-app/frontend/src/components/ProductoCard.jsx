import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";

export default function ProductoCard({ producto }) {
  const { agregarAlCarrito, setSelectedProduct } = useApp();
  const [qty, setQty] = useState(1);
  const [agregado, setAgregado] = useState(false);

  const tieneMayorista = producto.precioMayorista && producto.precioMayorista > 0;
  const minimoMayorista = producto.minimoMayorista || 48;

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
      {!producto.enOferta && producto.nuevo && (
        <span className="producto-ribbon producto-ribbon-nuevo">NUEVO</span>
      )}

      <div className="producto-img-wrap" onClick={handleImageClick}>
        <img
          src={producto.imagen}
          alt={producto.nombre}
          onError={(e) => {
            e.target.src = "https://placehold.co/220x180/f8f6f3/e0ddd8?text=SEVE";
          }}
        />
      </div>

      {producto.categoria && (
        <span className="producto-categoria-badge">{producto.categoria}</span>
      )}

      <h4>{producto.nombre}</h4>

      {producto.enOferta && producto.precioOferta ? (
        <p className="producto-precio-oferta-wrap">
          <span className="producto-precio-normal">{formatearPrecio(producto.precioNormal)}</span>
          <span className="producto-precio-oferta">{formatearPrecio(producto.precioOferta)}</span>
        </p>
      ) : (
        <p className="producto-precio-unico">{formatearPrecio(producto.precio)}</p>
      )}

      {/* Badge precio mayorista */}
      {tieneMayorista && (
        <div className="producto-mayorista-badge" onClick={handleImageClick} title="Ver precio mayorista">
          Mayor desde {minimoMayorista / 12} doc: {formatearPrecio(producto.precioMayorista)} c/u
        </div>
      )}

      <div className="producto-cantidad">
        <button
          type="button"
          className="qty-btn qty-menos"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
        >
          -
        </button>
        <input
        type="number"
        className="qty-input"
        value={qty === 0 ? "" : qty}
        min="1"
        max="999"
        onChange={(e) => {
          const val = e.target.value;
          if (val === "" || val === "0") { setQty(0); return; }
          const num = parseInt(val, 10);
          if (!isNaN(num)) setQty(Math.min(999, Math.max(1, num)));
        }}
        onBlur={() => { if (!qty || qty < 1) setQty(1); }}
        />
        <button
          type="button"
          className="qty-btn qty-mas"
          onClick={() => setQty((q) => Math.min(999, q + 1))}
        >
          +
        </button>
      </div>

      <button
        type="button"
        className={`btn-agregar-carrito${agregado ? " is-added" : ""}`}
        onClick={handleAgregar}
      >
        {agregado ? "✓ Agregado" : "Agregar al carrito"}
      </button>
    </article>
  );
}
