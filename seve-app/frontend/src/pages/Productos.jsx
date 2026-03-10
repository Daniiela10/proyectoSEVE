import { useState } from "react";
import { useApp } from "../context/AppContext";
import { listaProductos } from "../data";
import ProductoCard from "../components/ProductoCard";

const categorias = ["todos", "ollas", "olletas", "juego-de-ollas", "fiambreras"];

export default function Productos() {
  const { busqueda } = useApp();
  const [categoria, setCategoria] = useState("todos");

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

      {/* Filtros de categoría */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
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
