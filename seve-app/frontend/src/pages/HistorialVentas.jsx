import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE } from "@/config";
import { formatearPrecio } from "@/data";
import { useApp } from "@/context/AppContext";

const MESES = [
  { value: "todos", label: "Todos los meses" },
  { value: "0", label: "Enero" },
  { value: "1", label: "Febrero" },
  { value: "2", label: "Marzo" },
  { value: "3", label: "Abril" },
  { value: "4", label: "Mayo" },
  { value: "5", label: "Junio" },
  { value: "6", label: "Julio" },
  { value: "7", label: "Agosto" },
  { value: "8", label: "Septiembre" },
  { value: "9", label: "Octubre" },
  { value: "10", label: "Noviembre" },
  { value: "11", label: "Diciembre" },
];

export default function HistorialVentas() {
  const { usuario } = useApp();
  const [ventas, setVentas] = useState([]);
  const [mes, setMes] = useState("todos");
  const [anio, setAnio] = useState("todos");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarVentas();
  }, []);

  async function cargarVentas() {
    try {
      setCargando(true);
      setError("");
      const token = localStorage.getItem("seve_token");
      const { data } = await axios.get(`${API_BASE}/pedidos/todos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVentas(data);
    } catch (err) {
      setError(err.response?.data?.error || "No fue posible cargar el historial de ventas");
    } finally {
      setCargando(false);
    }
  }

  const aniosDisponibles = useMemo(() => {
    const unicos = [...new Set(
      ventas.map((venta) => new Date(venta.createdAt).getFullYear()).filter(Boolean)
    )].sort((a, b) => b - a);

    return unicos;
  }, [ventas]);

  const ventasFiltradas = useMemo(() => {
    const termino = busquedaCliente.trim().toLowerCase();

    return ventas.filter((venta) => {
      const fecha = new Date(venta.createdAt);
      const nombreCliente = [venta.usuario?.nombres, venta.usuario?.apellidos]
        .filter(Boolean)
        .join(" ")
        .trim();
      const emailCliente = venta.usuario?.email || "";
      const coincideMes = mes === "todos" || fecha.getMonth() === Number(mes);
      const coincideAnio = anio === "todos" || fecha.getFullYear() === Number(anio);
      const coincideCliente = !termino ||
        nombreCliente.toLowerCase().includes(termino) ||
        emailCliente.toLowerCase().includes(termino);

      return coincideMes && coincideAnio && coincideCliente;
    });
  }, [ventas, mes, anio, busquedaCliente]);

  const totalFiltrado = useMemo(() => {
    return ventasFiltradas.reduce((sum, venta) => sum + (venta.total || 0), 0);
  }, [ventasFiltradas]);

  if (!usuario?.esAdmin) {
    return (
      <div>
        <h1 className="titulo-vista">Historial de ventas</h1>
        <p className="historial-vacio">No tienes permisos para ver esta seccion.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="titulo-vista">Historial de ventas</h1>
      <p className="historial-desc">
        Filtra las ventas por mes y año para revisar periodos especificos.
      </p>

      <div className="ventas-filtros">
        <input
          type="text"
          className="roles-busqueda ventas-busqueda"
          placeholder="Buscar por cliente o correo"
          value={busquedaCliente}
          onChange={(e) => setBusquedaCliente(e.target.value)}
        />

        <select className="ventas-select" value={mes} onChange={(e) => setMes(e.target.value)}>
          {MESES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select className="ventas-select" value={anio} onChange={(e) => setAnio(e.target.value)}>
          <option value="todos">Todos los años</option>
          {aniosDisponibles.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <div className="ventas-resumen">
          <span>{ventasFiltradas.length} ventas</span>
          <strong>{formatearPrecio(totalFiltrado)}</strong>
        </div>
      </div>

      {error && <p className="ventas-error">{error}</p>}
      {cargando && <p className="historial-vacio">Cargando ventas...</p>}
      {!cargando && !error && ventasFiltradas.length === 0 && (
        <p className="historial-vacio">No hay ventas para ese filtro.</p>
      )}

      {!cargando && !error && ventasFiltradas.length > 0 && (
        <div className="historial-lista">
          {ventasFiltradas.map((venta) => {
            const nombreCliente = [venta.usuario?.nombres, venta.usuario?.apellidos]
              .filter(Boolean)
              .join(" ")
              .trim() || venta.usuario?.email || "Cliente";

            return (
              <div key={venta._id} className="historial-card">
                <div className="historial-card-header">
                  <span className="historial-fecha">
                    {new Date(venta.createdAt).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="historial-total">{formatearPrecio(venta.total)}</span>
                </div>
                <p className="historial-metodo">
                  Cliente: <strong>{nombreCliente}</strong>
                </p>
                <p className="historial-metodo">
                  Metodo: <strong>{venta.metodoPago}</strong>
                </p>
                <p className="historial-metodo">
                  Estado: <strong>{venta.estado}</strong>
                </p>
                <ul className="historial-items">
                  {venta.items.map((item, index) => (
                    <li key={`${venta._id}-${index}`}>
                      {item.nombre} x {item.cantidad} - {formatearPrecio((item.precio || 0) * (item.cantidad || 0))}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
