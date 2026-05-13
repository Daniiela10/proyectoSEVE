import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";
import IconoBasura from "@/components/IconoBasura";

export default function CarritoDrawer({ abierto, onCerrar }) {
  const {
    items,
    usuario,
    setVista,
    eliminarDelCarrito,
    cambiarCantidad,
    totalCarrito,
    iniciarCheckout,
  } = useApp();

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onCerrar?.();
    }
    if (abierto) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abierto, onCerrar]);

  const total = totalCarrito();

  return (
    <>
      {abierto && (
        <div
          onClick={onCerrar}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 9998,
          }}
        />
      )}

      <aside
        aria-hidden={!abierto}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: 420,
          maxWidth: "92vw",
          background: "#fff",
          zIndex: 9999,
          boxShadow: "-12px 0 40px rgba(0,0,0,0.18)",
          transform: abierto ? "translateX(0)" : "translateX(105%)",
          transition: "transform 220ms ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid #eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <strong style={{ fontSize: 16 }}>Mi carrito de compras</strong>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid #eee",
              background: "#fff",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 14, overflow: "auto", flex: 1 }}>
          {items.length === 0 ? (
            <div style={{ padding: "26px 10px", color: "#777" }}>
              Tu carrito está vacío.
              {" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onCerrar?.();
                  setVista("productos");
                }}
              >
                Ver productos
              </a>
            </div>
          ) : (
            items.map(({ producto, cantidad }) => (
              <div
                key={producto.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "64px 1fr 32px",
                  gap: 12,
                  padding: "12px 10px",
                  border: "1px solid #f1f1f1",
                  borderRadius: 14,
                  marginBottom: 10,
                }}
              >
                <img
                  src={producto.imagen}
                  alt={producto.nombre}
                  style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 12, background: "#f7f7f7" }}
                  onError={(e) => {
                    e.target.src = "https://placehold.co/64/f8f6f3/e0ddd8?text=SEVE";
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {producto.nombre}
                  </div>
                  <div style={{ color: "#c0392b", fontWeight: 800, marginTop: 2 }}>
                    {formatearPrecio(producto.precio)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                    <button
                      onClick={() => cambiarCantidad(producto.id, -1)}
                      style={qtyBtnStyle}
                      aria-label="Disminuir"
                    >
                      −
                    </button>
                    <div style={{ minWidth: 22, textAlign: "center", fontWeight: 700 }}>{cantidad}</div>
                    <button
                      onClick={() => cambiarCantidad(producto.id, 1)}
                      style={qtyBtnStyle}
                      aria-label="Aumentar"
                    >
                      +
                    </button>
                    <div style={{ marginLeft: "auto", color: "#666", fontSize: 12, fontWeight: 600 }}>
                      {formatearPrecio(producto.precio * cantidad)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => eliminarDelCarrito(producto.id)}
                  aria-label="Eliminar"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    border: "1px solid #eee",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                  title="Eliminar"
                >
                  <IconoBasura />
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: 14, borderTop: "1px solid #eee" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, color: "#444" }}>
            <span style={{ fontWeight: 700 }}>Total</span>
            <span style={{ fontWeight: 900, color: "#111" }}>{formatearPrecio(total)}</span>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={items.length === 0}
            onClick={() => {
              if (!usuario) {
                onCerrar?.();
                setVista("login");
                return;
              }
              onCerrar?.();
              iniciarCheckout(2);
            }}
          >
            Finalizar compra
          </button>

          <button
            className="btn btn-ghost"
            style={{ width: "100%", marginTop: 10 }}
            onClick={() => {
              onCerrar?.();
              setVista("carrito");
            }}
          >
            Ver carrito completo
          </button>
        </div>
      </aside>
    </>
  );
}

const qtyBtnStyle = {
  width: 28,
  height: 28,
  borderRadius: 10,
  border: "1px solid #eee",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 900,
};

