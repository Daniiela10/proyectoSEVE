import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";
import { useEffect, useState } from "react";
import Checkout from "@/components/Checkout";
import TrashImusaIcon from "@/components/TrashBasuraIcon";

export default function Carrito() {
  const { items, eliminarDelCarrito, cambiarCantidad, totalCarrito, usuario, setVista, checkoutPasoInicial, resetCheckout } = useApp();
  const [checkout, setCheckout] = useState(false);

  useEffect(() => {
    if (checkoutPasoInicial > 1) setCheckout(true);
  }, [checkoutPasoInicial]);

  if (checkout) return (
    <Checkout
      initialPaso={checkoutPasoInicial}
      onVolver={() => {
        setCheckout(false);
        resetCheckout();
      }}
    />
  );

  return (
    <div>
      <h1 className="titulo-vista">Carrito</h1>
      <div className="carrito-contenido">
        <div className="carrito-lista">
          {items.length === 0
            ? <p className="carrito-vacio">Tu carrito está vacío. <a href="#" onClick={(e) => { e.preventDefault(); setVista("productos"); }}>Ver productos</a></p>
            : items.map(({ producto, cantidad }) => (
              <div key={producto.id} className="carrito-item">
                <img src={producto.imagen} alt={producto.nombre}
                  onError={e => e.target.src="https://placehold.co/80/f8f6f3/e0ddd8?text=SEVE"} />
                <div className="carrito-item-info">
                  <h4>{producto.nombre}</h4>
                  <p className="precio">{formatearPrecio(producto.precio)} × {cantidad} = {formatearPrecio(producto.precio * cantidad)}</p>
                  <div className="carrito-item-cantidad">
                    <button className="carrito-qty-menos" onClick={() => cambiarCantidad(producto.id, -1)}>−</button>
                    <span className="carrito-qty-num">{cantidad}</span>
                    <button className="carrito-qty-mas" onClick={() => cambiarCantidad(producto.id, 1)}>+</button>
                  </div>
                </div>
                <button className="carrito-item-eliminar" onClick={() => eliminarDelCarrito(producto.id)} aria-label="Eliminar">
                  <TrashImusaIcon size={18} />
                </button>
              </div>
            ))
          }
        </div>
        {items.length > 0 && (
          <div className="carrito-resumen">
            <p className="carrito-total">Total: <strong>{formatearPrecio(totalCarrito())}</strong></p>
            <button className="btn btn-primary" onClick={() => {
              if (!usuario) { setVista("login"); return; }
              setCheckout(true);
            }}>Finalizar compra</button>
          </div>
        )}
      </div>
    </div>
  );
}