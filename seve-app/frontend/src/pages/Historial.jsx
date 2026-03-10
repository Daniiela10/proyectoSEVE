import { useApp } from "@/context/AppContext";
import { useEffect, useState } from "react";
import { formatearPrecio } from "@/data";

export default function Historial() {
  const { obtenerHistorial } = useApp();
  const [ordenes, setOrdenes] = useState([]);

  useEffect(() => {
    obtenerHistorial().then(setOrdenes).catch(() => setOrdenes([]));
  }, [obtenerHistorial]);

  return (
    <div>
      <h1 className="titulo-vista">Historial de compras</h1>
      {ordenes.length === 0
        ? <p className="historial-vacio">Aún no tienes compras.</p>
        : ordenes.map(ord => (
          <div key={ord._id} className="historial-card">
            <div className="historial-card-header">
              <span className="historial-fecha">{new Date(ord.createdAt).toLocaleDateString("es-CO")}</span>
              <span className="historial-total">{formatearPrecio(ord.total)}</span>
            </div>
            <p className="historial-metodo">Método: <strong>{ord.metodoPago}</strong></p>
            <ul className="historial-items">
              {ord.items.map((it, i) => <li key={i}>{it.nombre} × {it.cantidad} — {formatearPrecio(it.precio * it.cantidad)}</li>)}
            </ul>
          </div>
        ))
      }
    </div>
  );
}