import { useApp } from "@/context/AppContext";
import { listaProductos } from "@/data";
import ProductoCard from "@/components/ProductoCard";

export default function Inicio() {
  const { setVista } = useApp();
  return (
    <div>
      <div className="banner banner-inicio">
        <h1>Bienvenido a SEVE Aluminios</h1>
        <p>Calidad y durabilidad en ollas, olletas y más para tu cocina</p>
        <a href="#" className="btn btn-primary" onClick={(e) => { e.preventDefault(); setVista("productos"); }}>Ver productos</a>
      </div>
      <div className="inicio-destacados">
        <h2>Lo más vendido</h2>
        <div className="productos grid-inicio">
          {listaProductos.slice(0, 6).map(p => <ProductoCard key={p.id} producto={p} />)}
        </div>
      </div>
    </div>
  );
}