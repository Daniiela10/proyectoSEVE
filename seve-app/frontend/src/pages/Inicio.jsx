import { useApp } from "@/context/AppContext";
import ProductoCard from "@/components/ProductoCard";
import Categorias from "@/components/Categorias";

export default function Inicio({ soloVisualizacion = false }) {
  const { setVista, productos, setCategoriaFiltro } = useApp();

  function handleCategoria(nombre) {
    if (soloVisualizacion) return;
    setCategoriaFiltro(nombre || "todos");
    setVista("productos");
  }

  return (
    <div>
      <div className="inicio-destacados">
        <Categorias onSeleccionar={handleCategoria} deshabilitado={soloVisualizacion} />
        <h2>Lo mas vendido</h2>
        <div className="productos grid-inicio">
          {productos.slice(0, 6).map((p) => (
            <ProductoCard key={p.id} producto={p} soloVisualizacion={soloVisualizacion} />
          ))}
        </div>
      </div>
    </div>
  );
}
