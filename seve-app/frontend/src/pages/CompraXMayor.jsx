import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";
import "./compraXMayor.css";

const DOCENA = 12;

export default function CompraXMayor({ onAbrirCarrito }) {
  const { productos, usuario, setVista, agregarAlCarrito } = useApp();
  const [docenas, setDocenas] = useState({});
  const [error, setError] = useState("");

  const productosConMayor = useMemo(
    () => productos.filter((p) => p.precioMayorista && p.activo),
    [productos]
  );

  function setDocena(id, val) {
    const n = Math.max(0, parseInt(val) || 0);
    setDocenas((prev) => ({ ...prev, [id]: n }));
  }

  const resumen = useMemo(() => {
    let totalUnidades = 0;
    let totalPrecio = 0;
    const lineas = [];

    for (const p of productosConMayor) {
      const d = docenas[p.id] || 0;
      if (d === 0) continue;
      const unidades = d * DOCENA;
      const esMayor = d >= p.minimoMayorista;
      const precio = esMayor ? p.precioMayorista : p.precio;
      const subtotal = precio * unidades;
      totalUnidades += unidades;
      totalPrecio += subtotal;
      lineas.push({ ...p, docenas: d, unidades, esMayor, precio, subtotal });
    }

    return { lineas, totalUnidades, totalPrecio };
  }, [docenas, productosConMayor]);

  function handlePedir() {
    if (!usuario) { setVista("login"); return; }
    if (resumen.lineas.length === 0) { setError("Agrega al menos un producto."); return; }

    setError("");
    for (const l of resumen.lineas) {
      agregarAlCarrito({ ...l, precio: l.precio }, l.unidades);
    }
    setDocenas({});
    onAbrirCarrito?.();
  }

  return (
    <div className="mayor-wrap">
      {/* Encabezado */}
      <div className="mayor-header">
        <div>
          <h1 className="mayor-titulo">Compra por Mayor</h1>
          <p className="mayor-subtitulo">
            Precio especial a partir de <strong>1 docena (12 unidades)</strong> por producto.
            Ingresa la cantidad en docenas y el precio se aplica automáticamente.
          </p>
        </div>
        <div className="mayor-badge-info">
          <span></span> Mínimo 1 docena por producto
        </div>
      </div>

      {productosConMayor.length === 0 ? (
        <div className="mayor-vacio">
          <p>No hay productos con precio mayorista configurado aún.</p>
        </div>
      ) : (
        <div className="mayor-layout">
          {/* Tabla de productos */}
          <div className="mayor-tabla-wrap">
            <table className="mayor-tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio unitario</th>
                  <th>Precio mayorista</th>
                  <th>Docenas</th>
                  <th>Unidades</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {productosConMayor.map((p) => {
                  const d = docenas[p.id] || 0;
                  const unidades = d * DOCENA;
                  const esMayor = d >= p.minimoMayorista;
                  const precio = esMayor ? p.precioMayorista : p.precio;
                  const subtotal = precio * unidades;

                  return (
                    <tr key={p.id} className={d > 0 ? "mayor-fila-activa" : ""}>
                      <td className="mayor-td-producto">
                        <img
                          src={p.imagenVista || p.imagen}
                          alt={p.nombre}
                          className="mayor-img"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                        <div>
                          <p className="mayor-nombre">{p.nombre}</p>
                          <p className="mayor-categoria">{p.categoria}</p>
                        </div>
                      </td>
                      <td className="mayor-td-precio">{formatearPrecio(p.precio)}</td>
                      <td className="mayor-td-mayor">
                        <span className="mayor-precio-chip">{formatearPrecio(p.precioMayorista)}</span>
                        <span className="mayor-min-text">mín. {p.minimoMayorista} doc.</span>
                      </td>
                      <td className="mayor-td-docenas">
                        <div className="mayor-qty">
                          <button type="button" onClick={() => setDocena(p.id, d - 1)}>−</button>
                          <input
                            type="number"
                            min="0"
                            value={d || ""}
                            placeholder="0"
                            onChange={(e) => setDocena(p.id, e.target.value)}
                          />
                          <button type="button" onClick={() => setDocena(p.id, d + 1)}>+</button>
                        </div>
                        {d > 0 && d < p.minimoMayorista && (
                          <p className="mayor-aviso">
                            Faltan {p.minimoMayorista - d} doc. para precio mayorista
                          </p>
                        )}
                        {esMayor && d > 0 && (
                          <p className="mayor-aplicado">✓ Precio mayorista aplicado</p>
                        )}
                      </td>
                      <td className="mayor-td-uni">{unidades > 0 ? unidades : "—"}</td>
                      <td className="mayor-td-subtotal">
                        {subtotal > 0 ? (
                          <span className={esMayor ? "mayor-sub-mayor" : ""}>
                            {formatearPrecio(subtotal)}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Panel resumen */}
          <div className="mayor-resumen">
            <h3 className="mayor-resumen-titulo">Resumen del pedido</h3>

            {resumen.lineas.length === 0 ? (
              <p className="mayor-resumen-vacio">Selecciona productos para ver el resumen.</p>
            ) : (
              <>
                <ul className="mayor-resumen-lista">
                  {resumen.lineas.map((l) => (
                    <li key={l.id}>
                      <span className="mayor-resumen-nombre">{l.nombre}</span>
                      <span className="mayor-resumen-detalle">
                        {l.docenas} doc. × {formatearPrecio(l.precio)}
                        {l.esMayor && <span className="mayor-tag-mayor">mayorista</span>}
                      </span>
                      <span className="mayor-resumen-sub">{formatearPrecio(l.subtotal)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mayor-resumen-total-wrap">
                  <div className="mayor-resumen-row">
                    <span>Total unidades</span>
                    <strong>{resumen.totalUnidades}</strong>
                  </div>
                  <div className="mayor-resumen-row mayor-resumen-total">
                    <span>Total</span>
                    <strong>{formatearPrecio(resumen.totalPrecio)}</strong>
                  </div>
                </div>
              </>
            )}

            {error && <p className="mayor-error">{error}</p>}

            <button
              className="mayor-btn-pedir"
              onClick={handlePedir}
              disabled={resumen.lineas.length === 0}
            >
              Agregar al carrito
            </button>

            {!usuario && (
              <p className="mayor-login-aviso">
                Debes{" "}
                <button type="button" className="mayor-link" onClick={() => setVista("login")}>
                  iniciar sesión
                </button>{" "}
                para realizar el pedido.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
