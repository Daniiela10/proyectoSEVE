import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";
import { useEffect, useState } from "react";
import Checkout from "@/components/Checkout";
import IconoBasura from "@/components/IconoBasura";

export default function Carrito() {
  const { items, eliminarDelCarrito, cambiarCantidad, totalCarrito, usuario, setVista, checkoutPasoInicial, resetCheckout } = useApp();
  const [checkout, setCheckout] = useState(false);
  const [eliminando, setEliminando] = useState(null);

  useEffect(() => {
    if (checkoutPasoInicial > 1) setCheckout(true);
  }, [checkoutPasoInicial]);

  if (checkout) return (
    <Checkout
      initialPaso={checkoutPasoInicial}
      onVolver={() => { setCheckout(false); resetCheckout(); }}
    />
  );

  const total = totalCarrito();
  const totalItems = items.reduce((acc, { cantidad }) => acc + cantidad, 0);

  function handleEliminar(id) {
    setEliminando(id);
    setTimeout(() => { eliminarDelCarrito(id); setEliminando(null); }, 280);
  }

  return (
    <div className="carrito-page">
      <div className="carrito-page-header">
        <h1 className="carrito-page-titulo">Mi Carrito</h1>
        {items.length > 0 && (
          <span className="carrito-page-badge">{totalItems} {totalItems === 1 ? "producto" : "productos"}</span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="carrito-vacio-wrap">
          <div className="carrito-vacio-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.874-7.148a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
          <h2>Tu carrito está vacío</h2>
          <p>Explora nuestros productos y encuentra lo que necesitas.</p>
          <button className="btn btn-primary" onClick={() => setVista("productos")}>
            Ver productos
          </button>
        </div>
      ) : (
        <div className="carrito-layout">

          {/* Lista de productos */}
          <div className="carrito-lista-nueva">
            {items.map(({ producto, cantidad }) => (
              <div
                key={producto.id}
                className={`carrito-card${eliminando === producto.id ? " carrito-card--saliendo" : ""}`}
              >
                <div className="carrito-card-img-wrap">
                  <img
                    src={producto.imagenVista || producto.imagen}
                    alt={producto.nombre}
                    onError={e => { e.target.src = "https://placehold.co/100/f8f6f3/e0ddd8?text=SEVE"; }}
                  />
                </div>
                <div className="carrito-card-body">
                  <div className="carrito-card-top">
                    <div className="carrito-card-info">
                      <p className="carrito-card-categoria">{producto.categoria}</p>
                      <h4 className="carrito-card-nombre">{producto.nombre}</h4>
                      <p className="carrito-card-unitario">{formatearPrecio(producto.precio)} por unidad</p>
                    </div>
                    <button
                      className="carrito-card-eliminar"
                      onClick={() => handleEliminar(producto.id)}
                      aria-label="Eliminar producto"
                    >
                      <IconoBasura size={16} />
                    </button>
                  </div>
                  <div className="carrito-card-bottom">
                    <div className="carrito-qty-pill">
                      <button onClick={() => cambiarCantidad(producto.id, -1)} aria-label="Disminuir">−</button>
                      <span>{cantidad}</span>
                      <button onClick={() => cambiarCantidad(producto.id, 1)} aria-label="Aumentar">+</button>
                    </div>
                    <p className="carrito-card-subtotal">{formatearPrecio(producto.precio * cantidad)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Panel resumen */}
          <div className="carrito-panel">
            <h3 className="carrito-panel-titulo">Resumen del pedido</h3>

            <ul className="carrito-panel-lista">
              {items.map(({ producto, cantidad }) => (
                <li key={producto.id}>
                  <span className="carrito-panel-item-nombre">
                    {producto.nombre} <em>×{cantidad}</em>
                  </span>
                  <span className="carrito-panel-item-precio">{formatearPrecio(producto.precio * cantidad)}</span>
                </li>
              ))}
            </ul>

            <div className="carrito-panel-divider" />

            <div className="carrito-panel-total">
              <span>Total</span>
              <strong>{formatearPrecio(total)}</strong>
            </div>

            <button
              className="btn btn-primary carrito-panel-btn"
              onClick={() => {
                if (!usuario) { setVista("login"); return; }
                setCheckout(true);
              }}
            >
              Finalizar compra
            </button>

            <button className="carrito-panel-seguir" onClick={() => setVista("productos")}>
              ← Seguir comprando
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
