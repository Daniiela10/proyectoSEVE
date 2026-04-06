import { useEffect, useMemo, useState } from "react";
import { formatearPrecio } from "@/data";
import { API_BASE } from "@/config";
import axios from "axios";

function nombreCliente(pedido) {
  return [pedido.usuario?.nombres, pedido.usuario?.apellidos].filter(Boolean).join(" ").trim() || pedido.usuario?.email || "Cliente";
}

function envioRegistrado(pedido) {
  return Boolean(pedido?.numeroRastreo || pedido?.enviadoAt);
}

function formatearFechaPedido(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function GestionPedidos({ seccionInicial = "pedidos" }) {
  const [pedidos, setPedidos] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [filtroEnvio, setFiltroEnvio] = useState("todos");
  const [seccion, setSeccion] = useState(seccionInicial);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [modoModal, setModoModal] = useState("checklist");
  const [guardando, setGuardando] = useState(false);
  const [transportadoras, setTransportadoras] = useState([]);
  const [envioForm, setEnvioForm] = useState({ transportadoraNombre: "", numeroRastreo: "" });

  useEffect(() => {
    cargarPedidos();
    cargarTransportadoras();
  }, []);

  useEffect(() => {
    setSeccion(seccionInicial);
  }, [seccionInicial]);

  async function cargarPedidos() {
    try {
      setCargando(true);
      setError("");
      const token = localStorage.getItem("seve_token");
      const { data } = await axios.get(`${API_BASE}/pedidos/todos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPedidos(data);
    } catch (err) {
      setError(err.response?.data?.error || "No fue posible cargar los pedidos");
    } finally {
      setCargando(false);
    }
  }

  async function cargarTransportadoras() {
    try {
      const { data } = await axios.get(`${API_BASE}/ubicaciones/transportadoras`);
      setTransportadoras(data);
    } catch (err) {
      console.error(err);
    }
  }

  function abrirPedido(pedido, modo = "checklist") {
    setPedidoActivo(pedido);
    setModoModal(modo);
    setEnvioForm({
      transportadoraNombre: pedido.transportadoraNombre || "",
      numeroRastreo: pedido.numeroRastreo || "",
    });
  }

  function cerrarPedido() {
    setPedidoActivo(null);
    setModoModal("checklist");
    setEnvioForm({ transportadoraNombre: "", numeroRastreo: "" });
  }

  async function toggleChecklist(index) {
    if (!pedidoActivo || pedidoActivo.estado === "despachado") return;

    const itemsActualizados = pedidoActivo.items.map((item, idx) => ({
      checklist: idx === index ? !item.checklist : Boolean(item.checklist),
    }));

    try {
      setGuardando(true);
      const token = localStorage.getItem("seve_token");
      const { data } = await axios.patch(
        `${API_BASE}/pedidos/${pedidoActivo._id}/checklist`,
        { items: itemsActualizados },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPedidoActivo(data);
      setPedidos((prev) => prev.map((item) => item._id === data._id ? data : item));
    } catch (err) {
      setError(err.response?.data?.error || "No fue posible actualizar el checklist");
    } finally {
      setGuardando(false);
    }
  }

  async function despacharPedido() {
    if (!pedidoActivo) return;

    try {
      setGuardando(true);
      const token = localStorage.getItem("seve_token");
      const { data } = await axios.patch(
        `${API_BASE}/pedidos/${pedidoActivo._id}/despachar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPedidos((prev) => prev.map((item) => item._id === data._id ? data : item));
      cerrarPedido();
    } catch (err) {
      setError(err.response?.data?.error || "No fue posible despachar el pedido");
    } finally {
      setGuardando(false);
    }
  }

  async function guardarEnvio(e) {
    e.preventDefault();
    if (!pedidoActivo) return;

    try {
      setGuardando(true);
      const token = localStorage.getItem("seve_token");
      const { data } = await axios.patch(
        `${API_BASE}/pedidos/${pedidoActivo._id}/envio`,
        envioForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPedidoActivo(data);
      setPedidos((prev) => prev.map((item) => item._id === data._id ? data : item));
      cerrarPedido();
    } catch (err) {
      setError(err.response?.data?.error || "No fue posible registrar el envio");
    } finally {
      setGuardando(false);
    }
  }

  const pedidosSeccion = useMemo(() => pedidos.filter((pedido) => pedido.estado !== "despachado"), [pedidos]);
  const enviosSeccion = useMemo(
    () =>
      pedidos
        .filter((pedido) => pedido.estado === "despachado")
        .sort((a, b) => {
          const aPendiente = envioRegistrado(a) ? 0 : 1;
          const bPendiente = envioRegistrado(b) ? 0 : 1;
          if (aPendiente !== bPendiente) {
            return bPendiente - aPendiente;
          }
          const fechaA = new Date(a.enviadoAt || a.createdAt || 0);
          const fechaB = new Date(b.enviadoAt || b.createdAt || 0);
          return fechaB - fechaA;
        }),
    [pedidos]
  );
  const filtrados = filtro === "todos" ? pedidosSeccion : pedidosSeccion.filter((pedido) => pedido.estado === filtro);
  const enviosFiltrados = filtroEnvio === "todos"
    ? enviosSeccion
    : enviosSeccion.filter((pedido) => filtroEnvio === "enviado" ? envioRegistrado(pedido) : !envioRegistrado(pedido));
  const todosChecklist = Boolean(pedidoActivo?.items?.length) && pedidoActivo.items.every((item) => item.checklist);
  const pedidoActivoEnviado = envioRegistrado(pedidoActivo);

  return (
    <div>
      <h1 className="titulo-vista">Gestion de pedidos</h1>

      {seccion === "pedidos" && (
        <div className="gestion-filtros">
          {["todos", "nuevo", "espera"].map((f) => (
            <button key={f} className={`btn-filtro-pedido ${filtro === f ? "active" : ""}`} onClick={() => setFiltro(f)}>
              {f === "todos" ? "Todos" : f === "nuevo" ? "Nuevos" : "En espera"}
            </button>
          ))}
        </div>
      )}

      {seccion === "envios" && (
        <div className="gestion-filtros">
          {[
            { value: "todos", label: "Todos" },
            { value: "pendiente", label: "Pendiente envio" },
            { value: "enviado", label: "Enviado" },
          ].map(({ value, label }) => (
            <button key={value} className={`btn-filtro-pedido ${filtroEnvio === value ? "active" : ""}`} onClick={() => setFiltroEnvio(value)}>
              {label}
            </button>
          ))}
        </div>
      )}

      {error && <p style={{ color: "#c0392b", fontWeight: 600 }}>{error}</p>}
      {cargando && <p style={{ color: "#555" }}>Cargando pedidos...</p>}

      {!cargando && !error && seccion === "pedidos" && filtrados.length === 0 && (
        <p style={{ color: "#555" }}>No hay pedidos en esta seccion.</p>
      )}
      {!cargando && !error && seccion === "envios" && enviosFiltrados.length === 0 && (
        <p style={{ color: "#555" }}>No hay pedidos despachados para registrar envios.</p>
      )}

      {!cargando && !error && seccion === "pedidos" && (
        <div className="gestion-pedidos-lista">
          {filtrados.map((ord) => (
            <button key={ord._id} type="button" className={`pedido-cuadro pedido-cuadro-${ord.estado}`} onClick={() => abrirPedido(ord, "checklist")}>
              <span className="pedido-cuadro-id">#{ord._id?.slice(-4)}</span>
              <span className="pedido-cuadro-usuario">{nombreCliente(ord)}</span>
              <span className="pedido-cuadro-fecha">{formatearFechaPedido(ord.createdAt)}</span>
              <span className="pedido-cuadro-total">{formatearPrecio(ord.total)}</span>
              <span className="pedido-cuadro-estado">{ord.estado}</span>
            </button>
          ))}
        </div>
      )}

      {!cargando && !error && seccion === "envios" && (
        <div className="gestion-pedidos-lista">
          {enviosFiltrados.map((ord) => (
            <button
              key={ord._id}
              type="button"
              className={`pedido-cuadro ${envioRegistrado(ord) ? "pedido-cuadro-enviado" : "pedido-cuadro-pendiente-envio"}`}
              onClick={() => abrirPedido(ord, "envio")}
            >
              <span className="pedido-cuadro-id">#{ord._id?.slice(-4)}</span>
              <span className="pedido-cuadro-usuario">{nombreCliente(ord)}</span>
              <span className="pedido-cuadro-fecha">{formatearFechaPedido(ord.createdAt)}</span>
              <span className="pedido-cuadro-total">{formatearPrecio(ord.total)}</span>
              <span className={`pedido-cuadro-estado ${envioRegistrado(ord) ? "estado-enviado" : "estado-pendiente-envio"}`}>
                {envioRegistrado(ord) ? "Enviado" : "Pendiente envio"}
              </span>
            </button>
          ))}
        </div>
      )}

      {pedidoActivo && (
        <div className="modal">
          <div className="modal-backdrop" onClick={cerrarPedido} />
          <div className="modal-box admin-producto-modal">
            <button className="modal-cerrar" onClick={cerrarPedido}>&times;</button>

            {modoModal === "checklist" && (
              <div className="admin-producto-form admin-producto-form-modal">
                <div className="admin-producto-form-header">
                  <h2>Pedido #{pedidoActivo._id?.slice(-6)}</h2>
                </div>
                <p className="historial-desc">Cliente: {nombreCliente(pedidoActivo)}</p>
                <p className="historial-desc">Marca cada producto a medida que lo alistas. Si al menos uno esta marcado, el pedido pasa a espera.</p>

                <div className="pedido-checklist-lista">
                  {pedidoActivo.items.map((item, index) => (
                    <label key={`${pedidoActivo._id}-${index}`} className="pedido-check-item">
                      <input
                        type="checkbox"
                        checked={Boolean(item.checklist)}
                        disabled={guardando || pedidoActivo.estado === "despachado"}
                        onChange={() => toggleChecklist(index)}
                      />
                      <span>
                        {item.nombre} x {item.cantidad}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="admin-producto-form-actions">
                  <button type="button" className="btn btn-ghost" onClick={cerrarPedido}>Cerrar</button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!todosChecklist || guardando || pedidoActivo.estado === "despachado"}
                    onClick={() => setModoModal("confirmar-despacho")}
                  >
                    Despachar pedido
                  </button>
                </div>
              </div>
            )}

            {modoModal === "confirmar-despacho" && (
              <div className="admin-producto-form admin-producto-form-modal">
                <div className="admin-producto-form-header">
                  <h2>Verificacion antes de despachar</h2>
                </div>
                <p className="historial-desc">Confirma que estos son los productos del pedido antes de pasarlo a despachado.</p>
                <ul className="historial-items">
                  {pedidoActivo.items.map((item, index) => (
                    <li key={`${pedidoActivo._id}-confirm-${index}`}>
                      {item.nombre} x {item.cantidad}
                    </li>
                  ))}
                </ul>
                <div className="admin-producto-form-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setModoModal("checklist")}>Volver</button>
                  <button type="button" className="btn btn-primary" disabled={guardando} onClick={despacharPedido}>
                    {guardando ? "Despachando..." : "Despachar"}
                  </button>
                </div>
              </div>
            )}

            {modoModal === "envio" && (
              <form className="admin-producto-form admin-producto-form-modal" onSubmit={guardarEnvio}>
                <div className="admin-producto-form-header">
                  <h2>Envio y numero de rastreo</h2>
                </div>
                <p className="historial-desc">Pedido #{pedidoActivo._id?.slice(-6)} - {nombreCliente(pedidoActivo)}</p>
                {pedidoActivoEnviado && (
                  <p className="historial-desc" style={{ color: "#c0392b", fontWeight: 600 }}>
                    Este envio ya fue registrado y ya no se puede editar.
                  </p>
                )}
                <ul className="historial-items">
                  {pedidoActivo.items.map((item, index) => (
                    <li key={`${pedidoActivo._id}-envio-${index}`}>
                      {item.nombre} x {item.cantidad}
                    </li>
                  ))}
                </ul>

                <div className="admin-producto-form-grid">
                  <div>
                    <label className="roles-label">Transportadora</label>
                    <select
                      className="roles-select"
                      value={envioForm.transportadoraNombre}
                      disabled={pedidoActivoEnviado || guardando}
                      onChange={(e) => setEnvioForm((prev) => ({ ...prev, transportadoraNombre: e.target.value }))}
                    >
                      <option value="">Selecciona una transportadora</option>
                      {transportadoras.map((item) => (
                        <option key={item.nombre} value={item.nombre}>{item.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="roles-label">Numero de rastreo</label>
                    <input
                      className="roles-select admin-input"
                      value={envioForm.numeroRastreo}
                      disabled={pedidoActivoEnviado || guardando}
                      onChange={(e) => setEnvioForm((prev) => ({ ...prev, numeroRastreo: e.target.value }))}
                    />
                  </div>
                </div>

                {pedidoActivo.transportadoraUrl && (
                  <p className="historial-desc">Link de rastreo actual: {pedidoActivo.transportadoraUrl}</p>
                )}

                <div className="admin-producto-form-actions">
                  <button type="button" className="btn btn-ghost" onClick={cerrarPedido}>Cerrar</button>
                  {!pedidoActivoEnviado && (
                    <button type="submit" className="btn btn-primary" disabled={guardando}>
                      {guardando ? "Guardando..." : "Guardar envio"}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
