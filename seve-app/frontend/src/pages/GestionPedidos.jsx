import { useApp } from "@/context/AppContext";
import { useEffect, useState } from "react";
import { formatearPrecio } from "@/data";
import { API_BASE } from "@/config";
import axios from "axios";

export default function GestionPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => { cargarPedidos(); }, []);

  async function cargarPedidos() {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.get(`${API_BASE}/pedidos/todos`, { headers: { Authorization: `Bearer ${token}` } });
    setPedidos(data);
  }

  async function cambiarEstado(id, estado) {
    const token = localStorage.getItem("seve_token");
    await axios.patch(`${API_BASE}/pedidos/${id}/estado`, { estado }, { headers: { Authorization: `Bearer ${token}` } });
    cargarPedidos();
  }

  const filtrados = filtro === "todos" ? pedidos : pedidos.filter(p => p.estado === filtro);

  return (
    <div>
      <h1 className="titulo-vista">Gestión de pedidos</h1>
      <div className="gestion-filtros">
        {["todos","nuevo","espera","despachado"].map(f => (
          <button key={f} className={`btn-filtro-pedido ${filtro===f?"active":""}`} onClick={() => setFiltro(f)}>
            {f === "todos" ? "Todos" : f === "nuevo" ? "Nuevos" : f === "espera" ? "En espera" : "Despachados"}
          </button>
        ))}
      </div>
      <div className="gestion-pedidos-lista">
        {filtrados.map(ord => (
          <div key={ord._id} className={`pedido-cuadro pedido-cuadro-${ord.estado}`}>
            <span className="pedido-cuadro-id">#{ord._id?.slice(-4)}</span>
            <span className="pedido-cuadro-usuario">{ord.usuario?.nombre || ord.usuario?.email}</span>
            <span className="pedido-cuadro-total">{formatearPrecio(ord.total)}</span>
            <span className="pedido-cuadro-estado">{ord.estado}</span>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              {ord.estado !== "espera" && <button className="btn btn-espera" onClick={() => cambiarEstado(ord._id, "espera")}>En espera</button>}
              {ord.estado !== "despachado" && <button className="btn btn-despachar" onClick={() => cambiarEstado(ord._id, "despachado")}>Despachar</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}