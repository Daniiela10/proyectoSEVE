import { useApp } from "@/context/AppContext";
import ProductoCard from "@/components/ProductoCard";

export default function Ofertas() {
  const { productos } = useApp();
  const productosOferta = productos.filter((p) => p.enOferta);

  return (
    <div>
      <h1 className="titulo-vista titulo-ofertas">Ofertas</h1>
      <p className="subtitulo-ofertas">
        Aprovecha precios especiales en productos seleccionados
      </p>
      <div className="productos productos-oferta">
        {productosOferta.map((p) => (
          <ProductoCard key={p.id} producto={p} />
        ))}
      </div>
    </div>
  );
}
