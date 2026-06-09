import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";

const COLOR_MAP = {
  rojo: "#e74c3c",
  azul: "#3498db",
  verde: "#27ae60",
  amarillo: "#f1c40f",
  negro: "#222",
  blanco: "#f5f5f5",
  gris: "#9e9e9e",
  naranja: "#e67e22",
  rosado: "#e91e8c",
  morado: "#8e44ad",
};

export default function ProductModal() {
  const { selectedProduct, setSelectedProduct, agregarAlCarrito } = useApp();
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState("");
  const [imagenActual, setImagenActual] = useState("");

  useEffect(() => {
    if (selectedProduct) {
      const primerColor = selectedProduct.colores?.[0] || "";
      setSelectedColor(primerColor);
      setQty(1);
      const galeria = obtenerGaleria(selectedProduct, primerColor);
      setImagenActual(galeria[0] || "");
      document.body.style.overflow = "hidden";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  function obtenerGaleria(producto, color) {
    const colorImgs = color
      ? [].concat(producto.imagenesColor?.[color] || []).filter(Boolean)
      : [];
    if (colorImgs.length > 0) return colorImgs;
    return [producto.imagen, ...(producto.imagenes || [])].filter(Boolean);
  }

  const todasLasImagenes = obtenerGaleria(selectedProduct, selectedColor);

  function handleColorClick(color) {
    setSelectedColor(color);
    const galeria = obtenerGaleria(selectedProduct, color);
    setImagenActual(galeria[0] || selectedProduct.imagen || "");
  }

  const tieneOferta = selectedProduct.enOferta && selectedProduct.precioOferta;
  const precioMostrar = tieneOferta ? selectedProduct.precioOferta : selectedProduct.precio;
  const descuentoPct = tieneOferta && selectedProduct.precioNormal
    ? Math.round((1 - selectedProduct.precioOferta / selectedProduct.precioNormal) * 100)
    : null;

  const handleAddToCart = () => {
    agregarAlCarrito({ ...selectedProduct, color: selectedColor }, qty);
    setSelectedProduct(null);
  };

  return (
    <div className="pm-backdrop" onClick={() => setSelectedProduct(null)}>
      <div className="pm-box" onClick={(e) => e.stopPropagation()}>

        {/* Columna imagen */}
        <div className="pm-col-img">
          <img
            src={imagenActual || selectedProduct.imagen}
            alt={selectedProduct.nombre}
            className="pm-img"
            onError={(e) => { e.target.src = "https://placehold.co/500x500/f8f6f3/ccc?text=SEVE"; }}
          />

          {todasLasImagenes.length > 1 && (
            <div className="pm-thumbnails">
              {todasLasImagenes.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  className={`pm-thumb${imagenActual === img ? " activo" : ""}`}
                  onClick={() => setImagenActual(img)}
                >
                  <img src={img} alt={`Vista ${i + 1}`}
                    onError={(e) => { e.target.style.display = "none"; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Columna info */}
        <div className="pm-col-info">
          <button className="pm-cerrar" onClick={() => setSelectedProduct(null)} aria-label="Cerrar">✕</button>

          <h2 className="pm-titulo">{selectedProduct.nombre}</h2>
          <p className="pm-marca">SEVE Aluminios</p>

          <hr className="pm-divider" />

          {/* Precio */}
          <div className="pm-precio-wrap">
            {tieneOferta ? (
              <>
                <div className="pm-precio-fila-top">
                  {descuentoPct && (
                    <span className="pm-badge-oferta">-{descuentoPct}%</span>
                  )}
                  <span className="pm-precio-tachado">{formatearPrecio(selectedProduct.precioNormal)}</span>
                </div>
                <span className="pm-precio-principal">{formatearPrecio(selectedProduct.precioOferta)}</span>
              </>
            ) : (
              <span className="pm-precio-principal">{formatearPrecio(selectedProduct.precio)}</span>
            )}
          </div>

          {/* Colores */}
          {selectedProduct.colores?.length > 0 && (
            <div className="pm-seccion">
              <p className="pm-label">
                Color: <strong>{selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1)}</strong>
              </p>
              <div className="pm-colores">
                {selectedProduct.colores.map((color) => {
                  const tieneImgColor = Boolean(selectedProduct.imagenesColor?.[color]);
                  return (
                    <button
                      key={color}
                      type="button"
                      className={`pm-color-btn${selectedColor === color ? " activo" : ""}${tieneImgColor ? " tiene-img" : ""}`}
                      style={{ "--c": COLOR_MAP[color.toLowerCase()] || "#888" }}
                      onClick={() => handleColorClick(color)}
                      title={color.charAt(0).toUpperCase() + color.slice(1)}
                      aria-label={color}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Descripción */}
          {selectedProduct.descripcion?.length > 0 && (
            <div className="pm-seccion">
              <p className="pm-label">Descripción</p>
              <ul className="pm-desc-lista">
                {selectedProduct.descripcion.map((item, i) => (
                  <li key={i}>
                    <span className="pm-check">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <hr className="pm-divider" />

          {/* Cantidad */}
          <div className="pm-seccion pm-seccion-row">
            <p className="pm-label">Cantidad</p>
            <div className="pm-qty">
              <button type="button" className="pm-qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="pm-qty-num">{qty}</span>
              <button type="button" className="pm-qty-btn" onClick={() => setQty(Math.min(99, qty + 1))}>+</button>
            </div>
          </div>

          {/* Botón agregar */}
          <button className="pm-btn-agregar" onClick={handleAddToCart}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            Agregar al carrito &nbsp;·&nbsp; {formatearPrecio(precioMostrar * qty)}
          </button>

          {/* Servicios y garantías */}
          <div className="pm-servicios">
            <p className="pm-servicios-titulo">Servicios y garantías</p>
            <div className="pm-servicio-item">
              <div className="pm-servicio-icono pm-servicio-icono--green">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <div className="pm-servicio-texto">
                <strong>Envío gratis</strong>
                <span>En compras mayores a $200.000</span>
              </div>
            </div>
            <div className="pm-servicio-item">
              <div className="pm-servicio-icono">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div className="pm-servicio-texto">
                <strong>Garantía del fabricante</strong>
                <span>Productos originales SEVE Aluminios</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
