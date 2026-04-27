import { useApp } from "@/context/AppContext";
import ProductoCard from "@/components/ProductoCard";

export default function VentaMayor() {
  const { productos } = useApp();
  const productosMayor = productos.filter(
    (p) => p.precioMayorista && p.precioMayorista > 0
  );

  return (
    <div>
      <h1 className="titulo-vista titulo-mayor">Venta por Mayor</h1>
      <p className="subtitulo-mayor">
        Compra desde 4 docenas y obtén precios especiales de mayorista
      </p>
      {productosMayor.length === 0 ? (
        <p style={{ color: "#aaa", textAlign: "center", padding: "48px 0" }}>
          No hay productos con precio mayorista disponibles por el momento.
        </p>
      ) : (
        <div className="productos productos-mayor">
          {productosMayor.map((p) => (
            <ProductoCard key={p.id} producto={p} />
          ))}
        </div>
      )}
    </div>
  );
}
