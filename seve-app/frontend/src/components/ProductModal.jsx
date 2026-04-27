import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";

const MINIMO_MAYORISTA_DEFAULT = 48;

export default function ProductModal() {
  const { selectedProduct, setSelectedProduct, agregarAlCarrito } = useApp();
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState("");
  const [agregado, setAgregado] = useState(false);
  const [imagenActiva, setImagenActiva] = useState(0);

  useEffect(() => {
    if (selectedProduct) {
      setSelectedColor(selectedProduct.colores?.[0] || "");
      setQty(1);
      setAgregado(false);
      setImagenActiva(0);
    }
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  const imagenes = selectedProduct.imagenes?.length
    ? selectedProduct.imagenes
    : selectedProduct.imagen ? [selectedProduct.imagen] : [];

  const minimoMayorista = selectedProduct.minimoMayorista || MINIMO_MAYORISTA_DEFAULT;
  const tieneMayorista = selectedProduct.precioMayorista && selectedProduct.precioMayorista > 0;
  const esMayorista = tieneMayorista && qty >= minimoMayorista;

  const precioBase = selectedProduct.enOferta && selectedProduct.precioOferta
    ? selectedProduct.precioOferta
    : selectedProduct.precio;

  const precioActivo = esMayorista ? selectedProduct.precioMayorista : precioBase;

  const anterior = () => setImagenActiva(i => (i - 1 + imagenes.length) % imagenes.length);
  const siguiente = () => setImagenActiva(i => (i + 1) % imagenes.length);

  const handleAddToCart = () => {
    agregarAlCarrito(
      { ...selectedProduct, color: selectedColor, precioAplicado: precioActivo, esMayorista },
      qty
    );
    setAgregado(true);
    setTimeout(() => {
      setSelectedProduct(null);
      setAgregado(false);
    }, 900);
  };

  const handleClose = () => setSelectedProduct(null);

  const colorMap = {
    rojo: "#e74c3c", azul: "#3498db", verde: "#27ae60",
    amarillo: "#f1c40f", negro: "#222", blanco: "#f5f5f5",
    naranja: "#e67e22", morado: "#8e44ad", rosado: "#e91e8c",
    gris: "#95a5a6",
  };

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={handleClose} />
      <div className="modal-box mpd-box">
        <button className="modal-cerrar" onClick={handleClose}>&times;</button>

        <div className="mpd-layout">

          {/* ── Columna imagen ── */}
          <div className="mpd-imagen-col">

            {/* Imagen principal con flechas */}
            <div className="mpd-galeria-principal">
              <img
                key={imagenActiva}
                src={imagenes[imagenActiva] || "https://placehold.co/480x480/f8f6f3/e0ddd8?text=SEVE"}
                alt={`${selectedProduct.nombre} ${imagenActiva + 1}`}
                className="mpd-galeria-img"
                onError={e => e.target.src = "https://placehold.co/480x480/f8f6f3/e0ddd8?text=SEVE"}
              />

              {/* Flechas — solo si hay más de 1 imagen */}
              {imagenes.length > 1 && (
                <>
                  <button className="mpd-flecha mpd-flecha-prev" onClick={anterior} type="button" aria-label="Anterior">
                    ‹
                  </button>
                  <button className="mpd-flecha mpd-flecha-next" onClick={siguiente} type="button" aria-label="Siguiente">
                    ›
                  </button>
                  {/* Contador */}
                  <div className="mpd-contador">
                    {imagenActiva + 1} / {imagenes.length}
                  </div>
                </>
              )}
            </div>

            {/* Miniaturas — scroll horizontal */}
            {imagenes.length > 1 && (
              <div className="mpd-miniaturas-wrap">
                {imagenes.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`mpd-miniatura${imagenActiva === i ? " mpd-miniatura-activa" : ""}`}
                    onClick={() => setImagenActiva(i)}
                    aria-label={`Ver foto ${i + 1}`}
                  >
                    <img
                      src={url}
                      alt={`Miniatura ${i + 1}`}
                      onError={e => e.target.src = "https://placehold.co/80x80/f8f6f3/e0ddd8?text=S"}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Columna info ── */}
          <div className="mpd-info-col">

            <div className="mpd-badges">
              {selectedProduct.enOferta && <span className="mpd-badge mpd-badge-oferta">Oferta</span>}
              {selectedProduct.nuevo && !selectedProduct.enOferta && <span className="mpd-badge mpd-badge-nuevo">Nuevo</span>}
              {selectedProduct.categoria && <span className="mpd-badge mpd-badge-cat">{selectedProduct.categoria}</span>}
              {tieneMayorista && <span className="mpd-badge mpd-badge-mayorista">Venta por mayor</span>}
            </div>

            <h2 className="mpd-titulo">{selectedProduct.nombre}</h2>

            <div className="mpd-precio-wrap">
              {esMayorista ? (
                <>
                  <span className="mpd-precio-tachado">{formatearPrecio(precioBase)}</span>
                  <span className="mpd-precio-mayorista">{formatearPrecio(selectedProduct.precioMayorista)}</span>
                  <span className="mpd-descuento-pill mpd-descuento-mayorista">
                    -{Math.round((1 - selectedProduct.precioMayorista / precioBase) * 100)}% Mayor
                  </span>
                </>
              ) : selectedProduct.enOferta && selectedProduct.precioOferta ? (
                <>
                  <span className="mpd-precio-tachado">{formatearPrecio(selectedProduct.precioNormal)}</span>
                  <span className="mpd-precio-oferta">{formatearPrecio(selectedProduct.precioOferta)}</span>
                  <span className="mpd-descuento-pill">
                    -{Math.round((1 - selectedProduct.precioOferta / selectedProduct.precioNormal) * 100)}%
                  </span>
                </>
              ) : (
                <span className="mpd-precio-normal">{formatearPrecio(selectedProduct.precio)}</span>
              )}
            </div>

            {esMayorista && (
              <div className="mpd-mayorista-banner">
                Precio mayorista aplicado — {qty} unidades ({Math.floor(qty / 12)} doc.{qty % 12 > 0 ? ` + ${qty % 12}` : ""})
              </div>
            )}

            {tieneMayorista && !esMayorista && (
              <div className="mpd-mayorista-progreso">
                <div className="mpd-mayorista-progreso-bar">
                  <div className="mpd-mayorista-progreso-fill"
                    style={{ width: `${Math.min((qty / minimoMayorista) * 100, 100)}%` }} />
                </div>
                <p className="mpd-mayorista-progreso-txt">
                  Faltan <strong>{minimoMayorista - qty}</strong> unidades para precio mayorista
                  ({formatearPrecio(selectedProduct.precioMayorista)} c/u)
                </p>
              </div>
            )}

            <div className="mpd-divider" />

            {selectedProduct.colores?.length > 0 && (
              <div className="mpd-seccion">
                <p className="mpd-label">
                  Color: <strong>{selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1)}</strong>
                </p>
                <div className="mpd-colores">
                  {selectedProduct.colores.map(color => (
                    <button key={color} type="button"
                      title={color.charAt(0).toUpperCase() + color.slice(1)}
                      className={`mpd-color-btn${selectedColor === color ? " mpd-color-activo" : ""}`}
                      style={{ "--c": colorMap[color.toLowerCase()] || "#888" }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>
            )}

            {selectedProduct.descripcion?.length > 0 && (
              <div className="mpd-seccion">
                <p className="mpd-label">Descripción</p>
                <ul className="mpd-desc-lista">
                  {selectedProduct.descripcion.map((d, i) => (
                    <li key={i}><span className="mpd-check">✓</span>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mpd-divider" />

            <div className="mpd-footer">
              <div className="mpd-cantidad">
                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <input
                  type="number" className="qty-input" value={qty === 0 ? "" : qty} min="1" max="999"
                  onChange={e => {
                    const val = e.target.value;
                    if (val === "" || val === "0") { setQty(0); return; }
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) setQty(Math.min(999, Math.max(1, num)));
                  }}
                  onBlur={() => { if (!qty || qty < 1) setQty(1); }}
                />
                <button className="qty-btn" onClick={() => setQty(q => Math.min(999, q + 1))}>+</button>
              </div>

              <button
                className={`mpd-btn-agregar${agregado ? " mpd-btn-ok" : ""}${esMayorista ? " mpd-btn-mayorista-activo" : ""}`}
                onClick={handleAddToCart}
              >
                {agregado ? "✓ Agregado al carrito" : `Agregar al carrito · ${formatearPrecio(precioActivo * qty)}`}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
