import { useApp } from "@/context/AppContext";
import ProductoCard from "@/components/ProductoCard";
import Categorias from "@/components/Categorias";

export default function Inicio() {
  const { setVista, productos } = useApp();

  return (
    <div>
      <div className="banner banner-inicio">
        <h1>Bienvenido a SEVE Aluminios</h1>
        <p>Calidad y durabilidad en ollas, olletas y mas para tu cocina</p>
        <a href="#" className="btn btn-primary" onClick={(e) => { e.preventDefault(); setVista("productos"); }}>Ver productos</a>
      </div>
      <div className="inicio-destacados">
        <Categorias />
        <h2>Lo mas vendido</h2>
        <div className="productos grid-inicio">
          {productos.slice(0, 6).map((p) => <ProductoCard key={p.id} producto={p} />)}
        </div>
      </div>
    </div>
  );
}
