import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";


export default function ProductoCard({ producto }) {
  const { agregarAlCarrito } = useApp();
  const [qty, setQty] = useState(1);

  return (
    <article className="producto">
      <img src={producto.imagen} alt={producto.nombre}
        onError={e => e.target.src="https://placehold.co/220x180/f8f6f3/e0ddd8?text=SEVE"} />
      <h4>{producto.nombre}</h4>
      <p>{formatearPrecio(producto.precio)}</p>
      <div className="producto-cantidad">
        <button className="qty-btn qty-menos" onClick={() => setQty(q => Math.max(1, q-1))}>−</button>
        <input type="number" className="qty-input" value={qty} min="1" max="99"
          onChange={e => setQty(Math.min(99, Math.max(1, parseInt(e.target.value)||1)))} />
        <button className="qty-btn qty-mas" onClick={() => setQty(q => Math.min(99, q+1))}>+</button>
      </div>
      <button className="btn-agregar-carrito" onClick={() => agregarAlCarrito(producto, qty)}>
        Agregar al carrito
      </button>
    </article>
  );
}