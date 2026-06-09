import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";

export default function ProductoCard({ producto, soloVisualizacion = false }) {
  const { agregarAlCarrito, setSelectedProduct } = useApp();
  const [agregado, setAgregado] = useState(false);

  function handleImageClick() {
    if (soloVisualizacion) return;
    setSelectedProduct(producto);
  }

  function handleAgregar() {
    if (soloVisualizacion) return;
    agregarAlCarrito(producto, 1);
    setAgregado(true);
    window.setTimeout(() => setAgregado(false), 1200);
  }

  const tieneOferta = producto.enOferta && producto.precioOferta;
  const descuentoPct = tieneOferta && producto.precioNormal
    ? Math.round((1 - producto.precioOferta / producto.precioNormal) * 100)
    : null;

  return (
    <article className="producto">
      {tieneOferta && (
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
      <h4 className="producto-nombre">{producto.nombre}</h4>
      <p className="producto-marca">SEVE Aluminios</p>
      <div className="producto-precio-wrap">
        {tieneOferta ? (
          <>
            <div className="producto-precio-fila">
              {descuentoPct && <span className="producto-dcto-badge">-{descuentoPct}%</span>}
              <span className="producto-precio-tachado">{formatearPrecio(producto.precioNormal)}</span>
            </div>
            <p className="producto-precio-final">{formatearPrecio(producto.precioOferta)}</p>
          </>
        ) : (
          <p className="producto-precio-final">{formatearPrecio(producto.precio)}</p>
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
