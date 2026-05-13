import { useApp } from "@/context/AppContext";
import ProductoCard from "@/components/ProductoCard";
import Categorias from "@/components/Categorias";

export default function Inicio() {
  const { setVista, productos, setCategoriaFiltro } = useApp();

  function handleCategoria(nombre) {
    setCategoriaFiltro(nombre || "todos");
    setVista("productos");
  }

  return (
    <div>
      <div className="inicio-destacados">
        <Categorias onSeleccionar={handleCategoria} />
        <h2>Lo mas vendido</h2>
        <div className="productos grid-inicio">
          {productos.slice(0, 6).map((p) => <ProductoCard key={p.id} producto={p} />)}
        </div>
      </div>
    </div>
  );
}
