import { useEffect, useMemo, useState } from "react";
import { formatearPrecio } from "@/data";
import { API_BASE } from "@/config";
import axios from "axios";
import "./GestionPedidos.css";
import "./empleado.css";

const AUTO_REFRESH_MS = 60 * 1000;

// ── Helpers ───────────────────────────────────────────────────────
function nombreCliente(pedido) {
  return [pedido.usuario?.nombres, pedido.usuario?.apellidos]
    .filter(Boolean).join(" ").trim() || pedido.usuario?.email || "Cliente";
}

function envioRegistrado(pedido) {
  return Boolean(pedido?.numeroRastreo || pedido?.enviadoAt);
}

function pagoPendiente(pedido) {
  return String(pedido?.wompiEstado || "").trim().toUpperCase() === "PENDING";
}

function formatearFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-CO", {
    year: "numeric", month: "short", day: "numeric",
  });
}

const ESTADOS_ENVIO = ["despachado", "enviado", "entregado"];

const ESTADO_BADGE = {
  nuevo:      { cls: "gp-badge gp-badge--nuevo",      label: "Nuevo" },
  espera:     { cls: "gp-badge gp-badge--espera",     label: "En espera" },
  despachado: { cls: "gp-badge gp-badge--despachado", label: "Despachado" },
  pendiente:  { cls: "gp-badge gp-badge--pendiente",  label: "Pendiente" },
  procesando: { cls: "gp-badge gp-badge--procesando", label: "Procesando" },
  enviado:    { cls: "gp-badge gp-badge--enviado",    label: "Enviado" },
  entregado:  { cls: "gp-badge gp-badge--entregado",  label: "Entregado" },
  cancelado:  { cls: "gp-badge gp-badge--cancelado",  label: "Cancelado" },
};

function Badge({ estado }) {
  const cfg = ESTADO_BADGE[estado] || { cls: "gp-badge", label: estado };
  return <span className={cfg.cls}>{cfg.label}</span>;
}

function estadoOperativoPedido(pedido) {
  if (pedido?.estado === "pendiente_pago" || pedido?.estado === "pago_aprobado") return "nuevo";
  return pedido?.estado;
}

function EstadoPedidoBadge({ pedido }) {
  const estado = estadoOperativoPedido(pedido);
  return <Badge estado={estado} />;
}

function EstadoPagoBadge({ pedido }) {
  const wompiEstado = String(pedido?.wompiEstado || "").trim().toUpperCase();
  const esWompi = pedido?.metodoPago?.toLowerCase().includes("wompi") || pedido?.wompiEstado;
  if (!esWompi) return <span className="gp-badge gp-badge--manual">Pago manual</span>;
  if (wompiEstado === "APPROVED") {
    return <span className="gp-badge gp-badge--pago-aprobado">Pago aprobado</span>;
  }
  if (wompiEstado === "PENDING") {
    return <span className="gp-badge gp-badge--pago-pendiente">Pago pendiente</span>;
  }
  if (["DECLINED", "ERROR", "VOIDED"].includes(wompiEstado)) {
    return <span className="gp-badge gp-badge--cancelado">Pago rechazado</span>;
  }
  return <span className="gp-badge gp-badge--pendiente">Pago por confirmar</span>;
}

// ── Fila de producto con foto (checklist / confirmar / envío) ──────
function ProductoFila({ item, checkable = false, checked, disabled, onToggle }) {
  const contenido = (
    <>
      {checkable && (
        <input
          type="checkbox"
          checked={Boolean(checked)}
          disabled={disabled}
          onChange={onToggle}
        />
      )}
      <div className="pedido-item-img">
        {item.imagen
          ? <img src={item.imagen} alt={item.nombre} loading="lazy" />
          : <span className="pedido-item-img-placeholder">🍳</span>}
      </div>
      <div className="pedido-item-info">
        <span className="pedido-item-nombre">{item.nombre}</span>
        <span className="pedido-item-meta">Cantidad: {item.cantidad}</span>
      </div>
      <span className="pedido-item-precio">
        {formatearPrecio((item.precio || 0) * (item.cantidad || 1))}
      </span>
    </>
  );

  if (checkable) {
    return <label className="pedido-item-fila pedido-item-fila--check">{contenido}</label>;
  }
  return <div className="pedido-item-fila">{contenido}</div>;
}

export default function GestionPedidos({ seccionInicial = "pedidos" }) {
  const [pedidos, setPedidos]         = useState([]);
  const [seccion, setSeccion]         = useState(seccionInicial);
  const [busqueda, setBusqueda]       = useState("");
  const [filtro, setFiltro]           = useState("todos");
  const [filtroEnvio, setFiltroEnvio] = useState("todos");
  const [error, setError]             = useState("");
  const [cargando, setCargando]       = useState(true);
  const [pedidoActivo, setPedidoActivo]   = useState(null);
  const [modoModal, setModoModal]         = useState("checklist");
  const [guardando, setGuardando]         = useState(false);
  const [transportadoras, setTransportadoras] = useState([]);
  const [envioForm, setEnvioForm]         = useState({ transportadoraNombre: "", numeroRastreo: "" });

  useEffect(() => { cargarPedidos(); cargarTransportadoras(); }, []);
  useEffect(() => { setSeccion(seccionInicial); }, [seccionInicial]);
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      cargarPedidos({ silent: true });
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  async function cargarPedidos({ silent = false } = {}) {
    try {
      if (!silent) setCargando(true);
      setError("");
      const token = localStorage.getItem("seve_token");
      const { data } = await axios.get(`${API_BASE}/pedidos/todos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPedidos(data);
      setPedidoActivo((prev) => (prev ? data.find((pedido) => pedido._id === prev._id) || prev : prev));
    } catch (err) {
      setError(err.response?.data?.error || "No fue posible cargar los pedidos");
    } finally {
      if (!silent) setCargando(false);
    }
  }

  async function cargarTransportadoras() {
    try {
      const { data } = await axios.get(`${API_BASE}/ubicaciones/transportadoras`);
      setTransportadoras(data);
    } catch {}
  }

  function abrirPedido(pedido, modo = "checklist") {
    if (modo === "envio" && pagoPendiente(pedido)) {
      setError("No puedes registrar envio porque el pago todavia esta pendiente.");
      return;
    }
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
      setPedidos((prev) => prev.map((p) => p._id === data._id ? data : p));
    } catch (err) {
      setError(err.response?.data?.error || "No fue posible actualizar el checklist");
    } finally {
      setGuardando(false);
    }
  }

  async function despacharPedido() {
    if (!pedidoActivo) return;
    if (pedidoActivo.wompiEstado === "PENDING") {
      setError("No puedes despachar este pedido porque el pago todavia esta pendiente.");
      setModoModal("checklist");
      return;
    }
    try {
      setGuardando(true);
      const token = localStorage.getItem("seve_token");
      const { data } = await axios.patch(
        `${API_BASE}/pedidos/${pedidoActivo._id}/despachar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPedidos((prev) => prev.map((p) => p._id === data._id ? data : p));
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
    if (pagoPendiente(pedidoActivo)) {
      setError("No puedes registrar envio porque el pago todavia esta pendiente.");
      return;
    }
    try {
      setGuardando(true);
      const token = localStorage.getItem("seve_token");
      const { data } = await axios.patch(
        `${API_BASE}/pedidos/${pedidoActivo._id}/envio`,
        envioForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPedidoActivo(data);
      setPedidos((prev) => prev.map((p) => p._id === data._id ? data : p));
      if (!data.correoRastreoEnviado) {
        setError(data.correoRastreoError || "Envio registrado. No se confirmo el envio del correo al cliente.");
      }
      cerrarPedido();
    } catch (err) {
      setError(err.response?.data?.error || "No fue posible registrar el envio");
    } finally {
      setGuardando(false);
    }
  }

  async function reenviarCorreoEnvio() {
    if (!pedidoActivo) return;
    try {
      setGuardando(true);
      const token = localStorage.getItem("seve_token");
      const { data } = await axios.post(
        `${API_BASE}/pedidos/${pedidoActivo._id}/envio/correo`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPedidoActivo(data);
      setPedidos((prev) => prev.map((p) => p._id === data._id ? data : p));
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo enviar el correo de rastreo");
    } finally {
      setGuardando(false);
    }
  }

  const pedidosSeccion = useMemo(
    () => pedidos.filter((p) => !ESTADOS_ENVIO.includes(p.estado)),
    [pedidos]
  );

  const enviosSeccion = useMemo(
    () => pedidos
      .filter((p) => ESTADOS_ENVIO.includes(p.estado))
      .sort((a, b) => {
        const ap = envioRegistrado(a) ? 0 : 1;
        const bp = envioRegistrado(b) ? 0 : 1;
        if (ap !== bp) return bp - ap;
        return new Date(b.enviadoAt || b.createdAt || 0) - new Date(a.enviadoAt || a.createdAt || 0);
      }),
    [pedidos]
  );

  const pedidosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return pedidosSeccion.filter((p) => {
      const nombre = nombreCliente(p).toLowerCase();
      const id = (p._id || "").toLowerCase();
      const ok = !q || nombre.includes(q) || id.includes(q) || (p.usuario?.email || "").toLowerCase().includes(q);
      const okEstado = filtro === "todos" || estadoOperativoPedido(p) === filtro;
      return ok && okEstado;
    });
  }, [pedidosSeccion, busqueda, filtro]);

  const enviosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return enviosSeccion.filter((p) => {
      const nombre = nombreCliente(p).toLowerCase();
      const id = (p._id || "").toLowerCase();
      const ok = !q || nombre.includes(q) || id.includes(q) || (p.usuario?.email || "").toLowerCase().includes(q);
      const okEnvio =
        filtroEnvio === "todos" ||
        (filtroEnvio === "enviado" && envioRegistrado(p)) ||
        (filtroEnvio === "pendiente" && !envioRegistrado(p));
      return ok && okEnvio;
    });
  }, [enviosSeccion, busqueda, filtroEnvio]);

  const todosChecklist = Boolean(pedidoActivo?.items?.length) && pedidoActivo.items.every((i) => i.checklist);
  const pedidoActivoEnviado = envioRegistrado(pedidoActivo);
  const pedidoActivoPagoPendiente = pagoPendiente(pedidoActivo);
  const pendientesEnvio = enviosSeccion.filter((p) => !envioRegistrado(p)).length;

  return (
    <div>
      <div className="gp-header">
        <div>
          <h1 className="titulo-vista" style={{ marginBottom: 4 }}>
            {seccion === "pedidos" ? "Gestión de pedidos" : "Envíos y rastreo"}
          </h1>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
            {seccion === "pedidos"
              ? "Revisa, prepara y despacha los pedidos."
              : "Registra transportadora y número de rastreo para pedidos despachados."}
          </p>
        </div>
        <div className="gp-tabs">
          <button
            className={`gp-tab ${seccion === "pedidos" ? "gp-tab--activo" : ""}`}
            onClick={() => { setSeccion("pedidos"); setBusqueda(""); setFiltro("todos"); }}
          >
            Pedidos
          </button>
          <button
            className={`gp-tab ${seccion === "envios" ? "gp-tab--activo" : ""}`}
            onClick={() => { setSeccion("envios"); setBusqueda(""); setFiltroEnvio("todos"); }}
          >
            Envíos y rastreo
            {pendientesEnvio > 0 && (
              <span className="gp-tab-badge">{pendientesEnvio}</span>
            )}
          </button>
          <button className="gp-tab" onClick={cargarPedidos}>Actualizar</button>
        </div>
      </div>

      {error && <p className="gp-error">{error}</p>}

      {/* ── Filtros ── */}
      <div className="gp-filtros">
        <input
          className="gp-busqueda"
          type="text"
          placeholder="Buscar por ID, nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {seccion === "pedidos" && (
          <select className="gp-select" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="todos">Todos los estados</option>
            <option value="nuevo">Nuevo</option>
            <option value="espera">En espera</option>
            <option value="pendiente">Pendiente</option>
            <option value="procesando">Procesando</option>
            <option value="cancelado">Cancelado</option>
          </select>
        )}
        {seccion === "envios" && (
          <select className="gp-select" value={filtroEnvio} onChange={(e) => setFiltroEnvio(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="pendiente">Sin rastreo</option>
            <option value="enviado">Con rastreo</option>
          </select>
        )}
      </div>

      {cargando && <p style={{ color: "#888", padding: "24px 0" }}>Cargando pedidos...</p>}

      {/* ══ TABLA PEDIDOS ══ */}
      {!cargando && seccion === "pedidos" && (
        pedidosFiltrados.length === 0
          ? <p className="gp-vacio">No hay pedidos en esta sección.</p>
          : (
            <div className="gp-tabla-wrap">
              <table className="gp-tabla">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Estado de pago</th>
                    <th>Estado del pedido</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosFiltrados.map((p) => (
                    <tr key={p._id}>
                      <td className="gp-tabla-id">
                        #{p._id?.slice(-6).toUpperCase()}
                        {p.tipo === "mayorista" && (
                          <span className="gp-badge-mayor">Mayor</span>
                        )}
                      </td>
                      <td>
                        <div className="gp-tabla-nombre">{nombreCliente(p)}</div>
                        <div className="gp-tabla-email">{p.usuario?.email || ""}</div>
                      </td>
                      <td>{formatearFecha(p.createdAt)}</td>
                      <td>{formatearPrecio(p.total)}</td>
                      <td>
                        <EstadoPagoBadge pedido={p} />
                      </td>
                      <td>
                        <EstadoPedidoBadge pedido={p} />
                      </td>
                      <td>
                        <button
                          className="gp-btn gp-btn--secundario"
                          onClick={() => abrirPedido(p, "checklist")}
                        >
                          Ver pedido
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      )}

      {/* ══ TABLA ENVÍOS ══ */}
      {!cargando && seccion === "envios" && (
        enviosFiltrados.length === 0
          ? <p className="gp-vacio">No hay pedidos despachados para registrar envíos.</p>
          : (
            <div className="gp-tabla-wrap">
              <table className="gp-tabla">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Transportadora</th>
                    <th>Rastreo</th>
                    <th>Estado envío</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {enviosFiltrados.map((p) => (
                    <tr key={p._id}>
                      <td className="gp-tabla-id">#{p._id?.slice(-6).toUpperCase()}</td>
                      <td>
                        <div className="gp-tabla-nombre">{nombreCliente(p)}</div>
                        <div className="gp-tabla-email">{p.usuario?.email || ""}</div>
                      </td>
                      <td>{formatearFecha(p.createdAt)}</td>
                      <td>{formatearPrecio(p.total)}</td>
                      <td>{p.transportadoraNombre || <span className="gp-muted">—</span>}</td>
                      <td>
                        {p.numeroRastreo
                          ? <code style={{ fontSize: 12 }}>{p.numeroRastreo}</code>
                          : <span className="gp-muted">—</span>}
                      </td>
                      <td>
                        <span className={`gp-badge ${envioRegistrado(p) ? "gp-badge--entregado" : "gp-badge--nuevo"}`}>
                          {envioRegistrado(p) ? "Registrado" : "Pendiente"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="gp-btn gp-btn--secundario"
                          onClick={() => abrirPedido(p, "envio")}
                        >
                          {envioRegistrado(p) ? "Ver envío" : "Registrar envío"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      )}

      {/* ══ MODALES (mismo cromo visual que empleado / Generar factura) ══ */}
      {pedidoActivo && (
        <div className="emp-modal-backdrop" onClick={cerrarPedido}>
          <div className="emp-modal emp-modal--detalle" onClick={(e) => e.stopPropagation()}>
            {modoModal === "checklist" && (
              <>
                <div className="emp-modal-header">
                  <h2>Pedido #{pedidoActivo._id?.slice(-6).toUpperCase()}</h2>
                  <button type="button" className="emp-modal-cerrar" onClick={cerrarPedido}>&times;</button>
                </div>
                <div className="emp-detalle-body">
                  <div className="emp-detalle-bloque">
                    <h3 className="emp-detalle-subtitulo">Cliente</h3>
                    <div className="pedido-cliente-card">
                      <div className="pedido-cliente-avatar">
                        {nombreCliente(pedidoActivo).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="pedido-cliente-nombre">{nombreCliente(pedidoActivo)}</p>
                        {pedidoActivo.usuario?.email && (
                          <p className="pedido-cliente-email">{pedidoActivo.usuario.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="emp-detalle-bloque">
                    <h3 className="emp-detalle-subtitulo">Productos</h3>
                    <p className="emp-texto-muted">
                      Marca cada producto a medida que lo alistas. Si al menos uno está marcado, el pedido pasa a espera.
                    </p>
                    {pedidoActivoPagoPendiente && (
                      <p className="emp-mensaje emp-mensaje--error" style={{ marginTop: 8 }}>
                        No puedes despachar este pedido hasta que Wompi confirme el pago.
                      </p>
                    )}
                    <div className="pedido-items-lista">
                      {pedidoActivo.items.map((item, index) => (
                        <ProductoFila
                          key={`${pedidoActivo._id}-${index}`}
                          item={item}
                          checkable
                          checked={item.checklist}
                          disabled={guardando || pedidoActivo.estado === "despachado"}
                          onToggle={() => toggleChecklist(index)}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="emp-btn emp-btn--primario emp-btn--full"
                    disabled={pedidoActivoPagoPendiente || !todosChecklist || guardando || pedidoActivo.estado === "despachado"}
                    onClick={() => setModoModal("confirmar-despacho")}
                  >
                    Despachar pedido
                  </button>
                </div>
              </>
            )}

            {modoModal === "confirmar-despacho" && (
              <>
                <div className="emp-modal-header">
                  <h2>Verificación antes de despachar</h2>
                  <button type="button" className="emp-modal-cerrar" onClick={cerrarPedido}>&times;</button>
                </div>
                <div className="emp-detalle-body">
                  <div className="emp-detalle-bloque">
                    <p className="emp-texto-muted">Confirma que estos son los productos del pedido.</p>
                    <div className="pedido-items-lista">
                      {pedidoActivo.items.map((item, index) => (
                        <ProductoFila key={`${pedidoActivo._id}-confirm-${index}`} item={item} />
                      ))}
                    </div>
                  </div>
                  <div className="emp-form-acciones">
                    <button type="button" className="emp-btn emp-btn--ghost" onClick={() => setModoModal("checklist")}>
                      Volver
                    </button>
                    <button type="button" className="emp-btn emp-btn--primario" disabled={guardando} onClick={despacharPedido}>
                      {guardando ? "Despachando..." : "Despachar"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {modoModal === "envio" && (
              <form onSubmit={guardarEnvio}>
                <div className="emp-modal-header">
                  <h2>Envío y número de rastreo</h2>
                  <button type="button" className="emp-modal-cerrar" onClick={cerrarPedido}>&times;</button>
                </div>
                <div className="emp-detalle-body">
                  <div className="emp-detalle-bloque">
                    <p style={{ fontWeight: 600, color: "#1a1a1a" }}>
                      Pedido #{pedidoActivo._id?.slice(-6).toUpperCase()} — {nombreCliente(pedidoActivo)}
                    </p>
                    {pedidoActivoEnviado && (
                      <p className="emp-mensaje emp-mensaje--error" style={{ marginTop: 8, marginBottom: 0 }}>
                        Este envío ya fue registrado y no se puede editar.
                      </p>
                    )}
                  </div>
                  <div className="emp-detalle-bloque">
                    <h3 className="emp-detalle-subtitulo">Productos</h3>
                    <div className="pedido-items-lista">
                      {pedidoActivo.items.map((item, index) => (
                        <ProductoFila key={`${pedidoActivo._id}-envio-${index}`} item={item} />
                      ))}
                    </div>
                  </div>
                  <div className="emp-detalle-bloque">
                    <h3 className="emp-detalle-subtitulo">Datos del envío</h3>
                    <label className="emp-label">
                      Transportadora
                      <select
                        className="emp-input"
                        value={envioForm.transportadoraNombre}
                        disabled={pedidoActivoEnviado || guardando}
                        onChange={(e) => setEnvioForm((prev) => ({ ...prev, transportadoraNombre: e.target.value }))}
                      >
                        <option value="">Selecciona una transportadora</option>
                        {transportadoras.map((t) => (
                          <option key={t.nombre} value={t.nombre}>{t.nombre}</option>
                        ))}
                      </select>
                    </label>
                    <label className="emp-label">
                      Número de rastreo
                      <input
                        className="emp-input"
                        value={envioForm.numeroRastreo}
                        disabled={pedidoActivoEnviado || guardando}
                        onChange={(e) => setEnvioForm((prev) => ({ ...prev, numeroRastreo: e.target.value }))}
                        placeholder="Ej: 1234567890"
                      />
                    </label>
                    {pedidoActivo.transportadoraUrl && (
                      <p className="emp-texto-muted" style={{ marginTop: 8 }}>
                        🔗{" "}
                        <a href={pedidoActivo.transportadoraUrl} target="_blank" rel="noopener noreferrer"
                          style={{ color: "#c0392b" }}>
                          {pedidoActivo.transportadoraUrl}
                        </a>
                      </p>
                    )}
                  </div>
                  <div className="emp-form-acciones">
                    <button type="button" className="emp-btn emp-btn--ghost" onClick={cerrarPedido}>
                      Cerrar
                    </button>
                    {!pedidoActivoEnviado && (
                      <button type="submit" className="emp-btn emp-btn--primario" disabled={guardando}>
                        {guardando ? "Guardando..." : "Guardar envío"}
                      </button>
                    )}
                    {pedidoActivoEnviado && (
                      <button type="button" className="emp-btn emp-btn--primario" onClick={reenviarCorreoEnvio} disabled={guardando}>
                        {guardando ? "Enviando..." : "Reenviar correo"}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
