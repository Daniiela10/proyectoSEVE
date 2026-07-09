import { useApp } from "@/context/AppContext";
import ProductoCard from "@/components/ProductoCard";
import ComboCard from "@/components/ComboCard";

export default function Ofertas() {
  const { productos, combos } = useApp();

  const productosOferta = productos.filter((p) => p.enOferta);
  const combosOferta = combos.filter((c) => c.enOferta && c.precioOferta);

  const hayOfertas = productosOferta.length > 0 || combosOferta.length > 0;

  return (
    <div>
      <h1 className="titulo-vista titulo-ofertas">Ofertas</h1>
      <p className="subtitulo-ofertas">
        Aprovecha precios especiales en productos seleccionados
      </p>

      {!hayOfertas ? (
        <p className="emp-vacio">No hay ofertas disponibles por el momento.</p>
      ) : (
        <div className="productos productos-oferta">
          {combosOferta.map((c) => (
            <ComboCard key={`combo-${c.id}`} combo={c} />
          ))}
          {productosOferta.map((p) => (
            <ProductoCard key={p.id} producto={p} />
          ))}
        </div>
      )}
    </div>
  );
}
