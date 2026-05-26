import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useApp } from "@/context/AppContext";
import { API_BASE } from "@/config";
import ProductoCard from "@/components/ProductoCard";

export default function Productos() {
  const { busqueda, productos, categoriaFiltro, setCategoriaFiltro } = useApp();

  const [categoriaManual, setCategoriaManual] = useState(null);
  const [categoriasApi, setCategoriasApi] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE}/ubicaciones/categorias-producto`)
      .then(({ data }) => setCategoriasApi(data.map((c) => c.nombre)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (categoriaFiltro && categoriaFiltro !== "todos") {
      setCategoriaManual(null);
    }
  }, [categoriaFiltro]);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const categoria = categoriaManual ?? (categoriaFiltro || "todos");

  function handleSetCategoria(cat) {
    setCategoriaManual(cat);
    setCategoriaFiltro("todos");
  }

  const categorias = useMemo(() => {
    const deProductos = productos.map((p) => p.categoria).filter(Boolean);
    const todas = [...new Set([...categoriasApi, ...deProductos])];
    return ["todos", ...todas];
  }, [productos, categoriasApi]);

  const norm = (s) => (s || "").toLowerCase().replace(/-/g, " ").trim();

  const productosFiltrados = productos.filter((p) => {
    const coincideCategoria = categoria === "todos" || norm(p.categoria) === norm(categoria);
    const coincideBusqueda = !busqueda ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.categoria || "").toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  const esActivo = (cat) => norm(cat) === norm(categoria);

  return (
    <div>
      <h1 className="titulo-vista">Productos</h1>

      <div className="filtros-desktop" style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {categorias.map((cat) => (
          <button key={cat} onClick={() => handleSetCategoria(cat)} style={{
            padding: "8px 18px", borderRadius: 20, border: "2px solid",
            borderColor: esActivo(cat) ? "#c0392b" : "#e0e0e0",
            background: esActivo(cat) ? "#c0392b" : "#fff",
            color: esActivo(cat) ? "#fff" : "#555",
            fontWeight: 600, fontSize: 13, cursor: "pointer",
            textTransform: "capitalize", transition: "all 0.2s",
          }}>
            {cat === "todos" ? "Todos" : cat.replace(/-/g, " ")}
          </button>
        ))}
      </div>

      <div className="filtros-mobile" style={{ marginBottom: 24 }}>
        <button
          onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 8,
            border: "2px solid #e0e0e0", background: "#fff", color: "#333",
            fontWeight: 600, fontSize: 14, cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <span>Filtrar: {categoria === "todos" ? "Todos" : categoria.replace(/-/g, " ")}</span>
          <span style={{ transform: filtrosAbiertos ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>v</span>
        </button>

        {filtrosAbiertos && (
          <div style={{
            position: "absolute", left: 16, right: 16, background: "#fff",
            border: "2px solid #e0e0e0", borderRadius: 8, marginTop: 4,
            zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}>
            {categorias.map((cat) => (
              <button key={cat} onClick={() => { handleSetCategoria(cat); setFiltrosAbiertos(false); }} style={{
                width: "100%", padding: "12px 16px", border: "none",
                borderBottom: cat !== categorias[categorias.length - 1] ? "1px solid #eee" : "none",
                background: esActivo(cat) ? "#c0392b" : "#fff",
                color: esActivo(cat) ? "#fff" : "#333",
                fontWeight: 500, fontSize: 14, cursor: "pointer",
                textTransform: "capitalize", textAlign: "left",
              }}>
                {cat === "todos" ? "Todos" : cat.replace(/-/g, " ")}
              </button>
            ))}
          </div>
        )}
      </div>

      {busqueda && (
        <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>
          {productosFiltrados.length} resultado(s) para "<strong style={{ color: "#c0392b" }}>{busqueda}</strong>"
        </p>
      )}

      {productosFiltrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}></div>
          <p style={{ fontSize: 16 }}>
            {busqueda
              ? `No se encontraron productos para "${busqueda}".`
              : categoria !== "todos"
              ? `Aún no hay productos en la categoría "${categoria}".`
              : "No se encontraron productos."}
          </p>
        </div>
      ) : (
        <div className="productos" id="grid-productos">
          {productosFiltrados.map((p) => <ProductoCard key={p.id} producto={p} />)}
        </div>
      )}
    </div>
  );
}
