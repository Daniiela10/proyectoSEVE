import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";

export default function ProductModal() {
  const { selectedProduct, setSelectedProduct, agregarAlCarrito } = useApp();
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState("");

  useEffect(() => {
    if (selectedProduct) {
      setSelectedColor(selectedProduct.colores[0] || "");
      setQty(1);
    }
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  const handleAddToCart = () => {
    agregarAlCarrito({ ...selectedProduct, color: selectedColor }, qty);
    setSelectedProduct(null);
  };

  const handleClose = () => {
    setSelectedProduct(null);
  };

  // Mapa colores a colores reales
  const getColorStyle = (color) => {
    const colors = {
      'rojo': '#e74c3c',
      'negro': '#2c3e50',
      'azul': '#3498db',
      'verde': '#27ae60'
    };
    return { backgroundColor: colors[color] || '#888' };
  };

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={handleClose} />
      <div className="modal-box modal-producto-detail">
        <button className="modal-cerrar" onClick={handleClose}>&times;</button>

        <div className="producto-detail-contenido">
          {/* Imagen */}
          <div className="producto-detail-imagen">
            <img 
              src={selectedProduct.imagen} 
              alt={selectedProduct.nombre}
              onError={e => e.target.src="https://placehold.co/400x400/f8f6f3/e0ddd8?text=SEVE"}
            />
          </div>

          {/* Info */}
          <div className="producto-detail-info">
            <h2 className="producto-detail-titulo">{selectedProduct.nombre}</h2>
            <p className="producto-detail-precio">{formatearPrecio(selectedProduct.precio)}</p>

            {/* Colores - Círculos pequeños + nombre debajo */}
            {selectedProduct.colores && selectedProduct.colores.length > 0 && (
              <div className="producto-detail-seccion">
                <label className="producto-detail-label">Color:</label>
                <div className="producto-detalle-colores">
                  {selectedProduct.colores.map(color => (
                    <label key={color} className="color-option">
                      <input 
                        type="radio" 
                        name="color" 
                        value={color}
                        checked={selectedColor === color}
                        onChange={() => setSelectedColor(color)}
                      />
                      <span className="color-swatch" style={getColorStyle(color)}></span>
                      <span className="color-name">{color.charAt(0).toUpperCase() + color.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Descripción */}
            {selectedProduct.descripcion && selectedProduct.descripcion.length > 0 && (
              <div className="producto-detail-seccion">
                <label className="producto-detail-label">Descripción:</label>
                <ul className="producto-detail-lista">
                  {selectedProduct.descripcion.map((desc, idx) => (
                    <li key={idx}>{desc}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cantidad */}
            <div className="producto-detail-seccion">
              <label className="producto-detail-label">Cantidad:</label>
              <div className="producto-cantidad">
                <button className="qty-btn qty-menos" onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
                <input 
                  type="number" 
                  className="qty-input" 
                  value={qty} 
                  min="1" 
                  max="99"
                  onChange={e => setQty(Math.min(99, Math.max(1, parseInt(e.target.value) || 1)))}
                />
                <button className="qty-btn qty-mas" onClick={() => setQty(Math.min(99, qty + 1))}>+</button>
              </div>
            </div>

            {/* Botón */}
            <button 
              className="btn-agregar-carrito btn-primary btn-block" 
              onClick={handleAddToCart}
            >
              Agregar al carrito ({formatearPrecio(selectedProduct.precio * qty)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

