import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { listaProductos } from "@/data";
import ProductoCard from "@/components/ProductoCard";

const categorias = ["todos", "ollas", "olletas", "juego-de-ollas", "fiambreras"];

export default function Productos() {
  const { busqueda } = useApp();
  const [categoria, setCategoria] = useState("todos");
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const productosFiltrados = listaProductos.filter(p => {
    const coincideCategoria = categoria === "todos" || p.categoria === categoria;
    const coincideBusqueda = !busqueda || 
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.categoria.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  return (
    <div>
      <h1 className="titulo-vista">Productos</h1>

      {/* Filtros de categoría - Desktop (botones) */}
      <div className="filtros-desktop" style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {categorias.map(cat => (
          <button key={cat} onClick={() => setCategoria(cat)} style={{
            padding: "8px 18px", borderRadius: 20, border: "2px solid",
            borderColor: categoria === cat ? "#c0392b" : "#e0e0e0",
            background: categoria === cat ? "#c0392b" : "#fff",
            color: categoria === cat ? "#fff" : "#555",
            fontWeight: 600, fontSize: 13, cursor: "pointer",
            textTransform: "capitalize", transition: "all 0.2s",
          }}>
            {cat === "todos" ? "Todos" : cat.replace(/-/g, " ")}
          </button>
        ))}
      </div>

      {/* Filtros de categoría - Mobile (dropdown) */}
      <div className="filtros-mobile" style={{ marginBottom: 24 }}>
        <button 
          onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 8,
            border: "2px solid #e0e0e0",
            background: "#fff",
            color: "#333",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Filtrar: {categoria === "todos" ? "Todos" : categoria.replace(/-/g, " ")}</span>
          <span style={{ transform: filtrosAbiertos ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
        </button>
        
        {filtrosAbiertos && (
          <div style={{
            position: "absolute",
            left: 16,
            right: 16,
            background: "#fff",
            border: "2px solid #e0e0e0",
            borderRadius: 8,
            marginTop: 4,
            zIndex: 100,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}>
            {categorias.map(cat => (
              <button key={cat} onClick={() => { setCategoria(cat); setFiltrosAbiertos(false); }} style={{
                width: "100%",
                padding: "12px 16px",
                border: "none",
                borderBottom: cat !== categorias[categorias.length - 1] ? "1px solid #eee" : "none",
                background: categoria === cat ? "#c0392b" : "#fff",
                color: categoria === cat ? "#fff" : "#333",
                fontWeight: 500,
                fontSize: 14,
                cursor: "pointer",
                textTransform: "capitalize",
                textAlign: "left",
              }}>
                {cat === "todos" ? "Todos" : cat.replace(/-/g, " ")}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Resultado de búsqueda */}
      {busqueda && (
        <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>
          {productosFiltrados.length} resultado(s) para "<strong style={{ color: "#c0392b" }}>{busqueda}</strong>"
        </p>
      )}

      {productosFiltrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>Buscar Producto</div>
          <p style={{ fontSize: 16 }}>No se encontraron productos{busqueda ? ` para "${busqueda}"` : ""}.</p>
        </div>
      ) : (
        <div className="productos" id="grid-productos">
          {productosFiltrados.map(p => <ProductoCard key={p.id} producto={p} />)}
        </div>
      )}
    </div>
  );
}
