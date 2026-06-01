import { useApp } from "@/context/AppContext";
import ProductoCard from "@/components/ProductoCard";
import ComboCard from "@/components/ComboCard";
import Categorias from "@/components/Categorias";

export default function Inicio({ soloVisualizacion = false }) {
  const { setVista, productos, combos, setCategoriaFiltro } = useApp();

  function handleCategoria(nombre) {
    if (soloVisualizacion) return;
    setCategoriaFiltro(nombre || "todos");
    setVista("productos");
  }

  return (
    <div>
      <div className="inicio-destacados">
        <Categorias onSeleccionar={handleCategoria} deshabilitado={soloVisualizacion} />
        <h2>Lo más vendido</h2>
        <div className="productos grid-inicio mas-vendido-slider">
          {productos.slice(0, 5).map((p) => (
            <ProductoCard key={p.id} producto={p} soloVisualizacion={soloVisualizacion} />
          ))}
        </div>
        {combos.length > 0 && (
          <>
            <h2 style={{ marginTop: "2rem" }}>Combos</h2>
            <div className="productos grid-inicio">
              {combos.map((c) => (
                <ComboCard key={c.id || c._id} combo={c} soloVisualizacion={soloVisualizacion} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
