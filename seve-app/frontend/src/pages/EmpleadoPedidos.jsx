import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { API_BASE } from "@/config";
import axios from "axios";
import EmpleadoFactura from "./EmpleadoFactura";
import "./empleado.css";

const AUTO_REFRESH_MS = 60 * 1000;

function nombreCompleto(usuario) {
  if (!usuario) return "—";
  const partes = [usuario.nombres, usuario.apellidos].filter(Boolean);
  return partes.length > 0 ? partes.join(" ") : usuario.email || "—";
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

// Estados que van a la sección Envíos y rastreo
const ESTADOS_ENVIO = ["despachado", "enviado", "entregado"];

const ESTADO_COLORES = {
  pendiente:  "emp-badge--pendiente",
  procesando: "emp-badge--procesando",
  enviado:    "emp-badge--enviado",
  entregado:  "emp-badge--entregado",
  cancelado:  "emp-badge--cancelado",
  nuevo:      "emp-badge--nuevo",
  espera:     "emp-badge--espera",
  despachado: "emp-badge--despachado",
};

/** Estados que el empleado puede asignar manualmente (sin Pendiente ni Entregado). */
const ESTADOS_CAMBIO = ["procesando", "enviado", "cancelado"];

function etiquetaEstado(estado) {
  const etiquetas = {
    nuevo: "Nuevo",
    espera: "En espera",
    pendiente: "Pendiente",
    procesando: "Procesando",
    enviado: "Enviado",
    entregado: "Entregado",
    cancelado: "Cancelado",
    despachado: "Despachado",
  };
  return etiquetas[estado] || estado || "—";
}

function estadoOperativoPedido(pedido) {
  if (pedido?.estado === "pendiente_pago" || pedido?.estado === "pago_aprobado") return "nuevo";
  return pedido?.estado;
}

function EstadoPedidoBadge({ pedido }) {
  const estado = estadoOperativoPedido(pedido);
  return (
    <span className={`emp-badge ${ESTADO_COLORES[estado] || "emp-badge--inactivo"}`}>
      {etiquetaEstado(estado)}
    </span>
  );
}

function EstadoPagoBadge({ pedido }) {
  const wompiEstado = String(pedido?.wompiEstado || "").trim().toUpperCase();
  const esWompi = pedido?.metodoPago?.toLowerCase().includes("wompi") || pedido?.wompiEstado;
  if (!esWompi) return <span className="emp-badge emp-badge--manual">Pago manual</span>;
  if (wompiEstado === "APPROVED") {
    return <span className="emp-badge emp-badge--pago-aprobado">Pago aprobado</span>;
  }
  if (wompiEstado === "PENDING") {
    return <span className="emp-badge emp-badge--pago-pendiente">Pago pendiente</span>;
  }
  if (["DECLINED", "ERROR", "VOIDED"].includes(wompiEstado)) {
    return <span className="emp-badge emp-badge--cancelado">Pago rechazado</span>;
  }
  return <span className="emp-badge emp-badge--pendiente">Pago por confirmar</span>;
}

export default function EmpleadoPedidos({ seccionInicial = "pedidos" }) {
  const { obtenerTodosPedidos, actualizarEstadoPedido } = useApp();

  const [pedidos, setPedidos]                       = useState([]);
  const [cargando, setCargando]                     = useState(true);
  const [seccion, setSeccion]                       = useState(seccionInicial);
  const [busqueda, setBusqueda]                     = useState("");
  const [filtroEstado, setFiltroEstado]             = useState("todos");
  const [filtroEnvio, setFiltroEnvio]               = useState("todos");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [modoModal, setModoModal]                   = useState("detalle");
  const [actualizando, setActualizando]             = useState("");
  const [mensaje, setMensaje]                       = useState({ texto: "", tipo: "" });
  const [facturaData, setFacturaData]               = useState(null); // pedido para factura
  const [transportadoras, setTransportadoras]       = useState([]);
  const [envioForm, setEnvioForm]                   = useState({ transportadoraNombre: "", numeroRastreo: "" });
  const [guardandoEnvio, setGuardandoEnvio]         = useState(false);

  useEffect(() => { cargar(); cargarTransportadoras(); }, []);
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      cargar({ silent: true });
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  async function cargar({ silent = false } = {}) {
    try {
      if (!silent) setCargando(true);
      const data = await obtenerTodosPedidos();
      setPedidos(data);
      setPedidoSeleccionado((prev) => (prev ? data.find((pedido) => pedido._id === prev._id) || prev : prev));
    } catch {
      mostrarMensaje("No se pudieron cargar los pedidos", "error");
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

  async function cambiarEstado(pedidoId, nuevoEstado) {
    try {
      setActualizando(pedidoId);
      await actualizarEstadoPedido(pedidoId, nuevoEstado);
      setPedidos((prev) => prev.map((p) => p._id === pedidoId ? { ...p, estado: nuevoEstado } : p));
      if (pedidoSeleccionado?._id === pedidoId) {
        setPedidoSeleccionado((prev) => ({ ...prev, estado: nuevoEstado }));
      }
      mostrarMensaje("Estado actualizado", "ok");
    } catch {
      mostrarMensaje("No se pudo actualizar el estado", "error");
    } finally {
      setActualizando("");
    }
  }

  async function guardarEnvio(e) {
    e.preventDefault();
    if (!pedidoSeleccionado) return;
    if (pagoPendiente(pedidoSeleccionado)) {
      mostrarMensaje("No puedes registrar envio porque el pago todavia esta pendiente.", "error");
      return;
    }
    try {
      setGuardandoEnvio(true);
      const token = localStorage.getItem("seve_token");
      const { data } = await axios.patch(
        `${API_BASE}/pedidos/${pedidoSeleccionado._id}/envio`,
        envioForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPedidos((prev) => prev.map((p) => p._id === data._id ? data : p));
      setPedidoSeleccionado(data);
      mostrarMensaje(
        data.correoRastreoEnviado
          ? "Envio registrado correctamente. Se envio correo al cliente."
          : data.correoRastreoError || "Envio registrado. No se confirmo el envio del correo.",
        data.correoRastreoEnviado ? "ok" : "error"
      );
      cerrarModal();
    } catch (err) {
      mostrarMensaje(err?.response?.data?.error || "No se pudo registrar el envío", "error");
    } finally {
      setGuardandoEnvio(false);
    }
  }

  async function reenviarCorreoEnvio() {
    if (!pedidoSeleccionado) return;
    try {
      setGuardandoEnvio(true);
      const token = localStorage.getItem("seve_token");
      const { data } = await axios.post(
        `${API_BASE}/pedidos/${pedidoSeleccionado._id}/envio/correo`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPedidos((prev) => prev.map((p) => p._id === data._id ? data : p));
      setPedidoSeleccionado(data);
      mostrarMensaje("Correo de rastreo enviado al cliente.", "ok");
    } catch (err) {
      mostrarMensaje(err?.response?.data?.error || "No se pudo enviar el correo de rastreo", "error");
    } finally {
      setGuardandoEnvio(false);
    }
  }

  function abrirDetalle(pedido) {
    setPedidoSeleccionado(pedido);
    setModoModal("detalle");
  }

  function abrirEnvio(pedido) {
    if (pagoPendiente(pedido)) {
      mostrarMensaje("No puedes registrar envio porque el pago todavia esta pendiente.", "error");
      return;
    }
    setPedidoSeleccionado(pedido);
    setModoModal("envio");
    setEnvioForm({
      transportadoraNombre: pedido.transportadoraNombre || "",
      numeroRastreo:        pedido.numeroRastreo        || "",
    });
  }

  function cerrarModal() {
    setPedidoSeleccionado(null);
    setModoModal("detalle");
    setEnvioForm({ transportadoraNombre: "", numeroRastreo: "" });
  }

  function mostrarMensaje(texto, tipo) {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3500);
  }

  // ── Pedidos: todos excepto los que van a envíos ───────────────
  const pedidosSeccion = useMemo(
    () => pedidos.filter((p) => !ESTADOS_ENVIO.includes(p.estado)),
    [pedidos]
  );

  // ── Envíos: despachado, enviado o entregado ───────────────────
  const enviosSeccion = useMemo(
    () =>
      pedidos
        .filter((p) => ESTADOS_ENVIO.includes(p.estado))
        .sort((a, b) => {
          // Primero los sin rastreo registrado (pendientes de número)
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
      const nombre = nombreCompleto(p.usuario).toLowerCase();
      const email  = (p.usuario?.email || "").toLowerCase();
      const id     = (p._id || "").toLowerCase();
      const coincideBusqueda = !q || nombre.includes(q) || email.includes(q) || id.includes(q);
      const coincideEstado   = filtroEstado === "todos" || estadoOperativoPedido(p) === filtroEstado;
      return coincideBusqueda && coincideEstado;
    });
  }, [pedidosSeccion, busqueda, filtroEstado]);

  const enviosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return enviosSeccion.filter((p) => {
      const nombre = nombreCompleto(p.usuario).toLowerCase();
      const email  = (p.usuario?.email || "").toLowerCase();
      const id     = (p._id || "").toLowerCase();
      const coincideBusqueda = !q || nombre.includes(q) || email.includes(q) || id.includes(q);
      const coincideEnvio =
        filtroEnvio === "todos" ||
        (filtroEnvio === "enviado"   &&  envioRegistrado(p)) ||
        (filtroEnvio === "pendiente" && !envioRegistrado(p));
      return coincideBusqueda && coincideEnvio;
    });
  }, [enviosSeccion, busqueda, filtroEnvio]);

  const pedidoYaEnviado = envioRegistrado(pedidoSeleccionado);

  // ── Vista factura ─────────────────────────────────────────────
  if (facturaData) {
    return (
      <EmpleadoFactura
        pedido={facturaData}
        onVolver={() => setFacturaData(null)}
      />
    );
  }

  return (
    <div className="emp-seccion">

      {/* ── Header ── */}
      <div className="emp-seccion-header">
        <div>
          <h1 className="emp-titulo">
            {seccion === "pedidos" ? "Gestión de Pedidos" : "Envíos y Rastreo"}
          </h1>
          <p className="emp-desc">
            {seccion === "pedidos"
              ? "Consulta, actualiza estado y genera facturas."
              : "Registra transportadora y número de rastreo. Al guardar se envía correo al cliente."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className={`emp-btn ${seccion === "pedidos" ? "emp-btn--primario" : "emp-btn--secundario"}`}
            onClick={() => { setSeccion("pedidos"); setBusqueda(""); setFiltroEstado("todos"); }}
          >
            Pedidos
          </button>
          <button
            className={`emp-btn ${seccion === "envios" ? "emp-btn--primario" : "emp-btn--secundario"}`}
            onClick={() => { setSeccion("envios"); setBusqueda(""); setFiltroEnvio("todos"); }}
          >
            Envíos y rastreo
            {/* Badge con pendientes */}
            {enviosSeccion.filter((p) => !envioRegistrado(p)).length > 0 && (
              <span style={{
                marginLeft: 6, background: "#e74c3c", color: "#fff",
                borderRadius: 20, fontSize: 11, fontWeight: 700,
                padding: "1px 7px",
              }}>
                {enviosSeccion.filter((p) => !envioRegistrado(p)).length}
              </span>
            )}
          </button>
          <button className="emp-btn emp-btn--ghost" onClick={cargar}>Actualizar</button>
        </div>
      </div>

      {mensaje.texto && (
        <div className={`emp-mensaje emp-mensaje--${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      {/* ── Filtros ── */}
      <div className="emp-filtros">
        <input
          className="emp-busqueda"
          type="text"
          placeholder="Buscar por ID, nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {seccion === "pedidos" && (
          <select className="emp-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="todos">Todos los estados</option>
            {["nuevo", "espera", "pendiente", "procesando", "cancelado"].map((e) => (
              <option key={e} value={e}>{etiquetaEstado(e)}</option>
            ))}
          </select>
        )}
        {seccion === "envios" && (
          <select className="emp-select" value={filtroEnvio} onChange={(e) => setFiltroEnvio(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="pendiente">Sin número de rastreo</option>
            <option value="enviado">Con rastreo registrado</option>
          </select>
        )}
      </div>

      {cargando && <p className="emp-vacio">Cargando pedidos...</p>}

      {/* ══ TABLA PEDIDOS ══ */}
      {!cargando && seccion === "pedidos" && (
        pedidosFiltrados.length === 0
          ? <p className="emp-vacio">No se encontraron pedidos.</p>
          : (
            <div className="emp-tabla-wrap">
              <table className="emp-tabla">
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
                      <td className="emp-tabla-id">#{p._id?.slice(-6).toUpperCase()}</td>
                      <td>
                        <div className="emp-tabla-nombre">{nombreCompleto(p.usuario)}</div>
                        <div className="emp-tabla-email">{p.usuario?.email || ""}</div>
                      </td>
                      <td>{formatearFecha(p.createdAt)}</td>
                      <td>${Number(p.total || 0).toLocaleString("es-CO")}</td>
                      <td>
                        <EstadoPagoBadge pedido={p} />
                      </td>
                      <td>
                        <EstadoPedidoBadge pedido={p} />
                      </td>
                      <td>
                        <div className="emp-tabla-acciones">
                          <button
                            className="emp-btn emp-btn--sm emp-btn--secundario"
                            onClick={() => abrirDetalle(p)}
                          >
                            Ver detalle
                          </button>
                          {/* ✅ Botón factura directo en la tabla */}
                          <button
                            className="emp-btn emp-btn--sm emp-btn--ghost"
                            onClick={() => setFacturaData(p)}
                            title="Generar factura"
                          >
                            🖨️ Factura
                          </button>
                        </div>
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
          ? <p className="emp-vacio">No hay pedidos en envíos y rastreo.</p>
          : (
            <div className="emp-tabla-wrap">
              <table className="emp-tabla">
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
                      <td className="emp-tabla-id">#{p._id?.slice(-6).toUpperCase()}</td>
                      <td>
                        <div className="emp-tabla-nombre">{nombreCompleto(p.usuario)}</div>
                        <div className="emp-tabla-email">{p.usuario?.email || ""}</div>
                      </td>
                      <td>{formatearFecha(p.createdAt)}</td>
                      <td>${Number(p.total || 0).toLocaleString("es-CO")}</td>
                      <td>{p.transportadoraNombre || <span className="emp-texto-muted">—</span>}</td>
                      <td>
                        {p.numeroRastreo
                          ? <code style={{ fontSize: 12 }}>{p.numeroRastreo}</code>
                          : <span className="emp-texto-muted">—</span>}
                      </td>
                      <td>
                        <span className={`emp-badge ${envioRegistrado(p) ? "emp-badge--activo" : "emp-badge--pendiente"}`}>
                          {envioRegistrado(p) ? "Registrado" : "Pendiente"}
                        </span>
                      </td>
                      <td>
                        <div className="emp-tabla-acciones">
                          <button
                            className="emp-btn emp-btn--sm emp-btn--secundario"
                            onClick={() => abrirEnvio(p)}
                          >
                            {envioRegistrado(p) ? "Ver envío" : "Registrar envío"}
                          </button>
                          {/* ✅ Botón factura también en tabla de envíos */}
                          <button
                            className="emp-btn emp-btn--sm emp-btn--ghost"
                            onClick={() => setFacturaData(p)}
                            title="Generar factura"
                          >
                            🖨️ Factura
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      )}

      {/* ══ MODAL DETALLE PEDIDO ══ */}
      {pedidoSeleccionado && modoModal === "detalle" && (
        <div className="emp-modal-backdrop" onClick={cerrarModal}>
          <div className="emp-modal emp-modal--detalle" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-header">
              <h2>Pedido #{pedidoSeleccionado._id?.slice(-6).toUpperCase()}</h2>
              <button className="emp-modal-cerrar" onClick={cerrarModal}>&times;</button>
            </div>
            <div className="emp-detalle-body">

              <div className="emp-detalle-bloque">
                <h3 className="emp-detalle-subtitulo">Cliente</h3>
                <p style={{ fontWeight: 600, color: "#1a1a1a" }}>{nombreCompleto(pedidoSeleccionado.usuario)}</p>
                <p className="emp-texto-muted">{pedidoSeleccionado.usuario?.email || "—"}</p>
                {pedidoSeleccionado.direccion && (
                  <p className="emp-texto-muted">
                    📍 {pedidoSeleccionado.direccion}
                    {pedidoSeleccionado.ciudad ? `, ${pedidoSeleccionado.ciudad}` : ""}
                  </p>
                )}
                {pedidoYaEnviado && (
                  <button type="button" className="emp-btn emp-btn--primario" onClick={reenviarCorreoEnvio} disabled={guardandoEnvio}>
                    {guardandoEnvio ? "Enviando..." : "Reenviar correo"}
                  </button>
                )}
              </div>

              <div className="emp-detalle-bloque">
                <h3 className="emp-detalle-subtitulo">Productos</h3>
                <div className="emp-detalle-items">
                  {(pedidoSeleccionado.items || []).map((item, i) => {
                    const precio = item.precioUnitario || item.precio || 0;
                    return (
                      <div key={i} className="emp-detalle-item">
                        <div className="emp-detalle-item-info">
                          <span className="emp-detalle-item-nombre">
                            {item.producto?.nombre || item.nombre || "Producto"}
                          </span>
                          <span className="emp-texto-muted">× {item.cantidad}</span>
                        </div>
                        <span>${Number(precio * item.cantidad).toLocaleString("es-CO")}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="emp-detalle-total">
                  <span>Total</span>
                  <strong>${Number(pedidoSeleccionado.total || 0).toLocaleString("es-CO")}</strong>
                </div>
              </div>

              <div className="emp-detalle-bloque">
                <h3 className="emp-detalle-subtitulo">Estado del pedido</h3>
                <div className="emp-estado-grid">
                  {ESTADOS_CAMBIO.map((e) => (
                    <button
                      key={e}
                      className={`emp-estado-btn ${pedidoSeleccionado.estado === e ? "emp-estado-btn--activo" : ""}`}
                      disabled={actualizando === pedidoSeleccionado._id}
                      onClick={() => cambiarEstado(pedidoSeleccionado._id, e)}
                    >
                      {etiquetaEstado(e)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="emp-btn emp-btn--primario emp-btn--full"
                onClick={() => { cerrarModal(); setFacturaData(pedidoSeleccionado); }}
              >
                🖨️ Generar factura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL ENVÍO Y RASTREO ══ */}
      {pedidoSeleccionado && modoModal === "envio" && (
        <div className="emp-modal-backdrop" onClick={cerrarModal}>
          <div className="emp-modal emp-modal--detalle" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-header">
              <h2>Envío y número de rastreo</h2>
              <button className="emp-modal-cerrar" onClick={cerrarModal}>&times;</button>
            </div>

            <form className="emp-detalle-body" onSubmit={guardarEnvio}>
              <div className="emp-detalle-bloque">
                <p style={{ fontWeight: 600 }}>
                  Pedido #{pedidoSeleccionado._id?.slice(-6).toUpperCase()} — {nombreCompleto(pedidoSeleccionado.usuario)}
                </p>
                {pedidoYaEnviado ? (
                  <p className="emp-mensaje emp-mensaje--ok" style={{ marginTop: 8 }}>
                    ✓ Este envío ya fue registrado. El cliente recibió el correo con el número de rastreo.
                  </p>
                ) : (
                  <p className="emp-texto-muted" style={{ marginTop: 6 }}>
                    Al guardar, se enviará automáticamente un correo al cliente con el número de rastreo.
                  </p>
                )}
              </div>

              <div className="emp-detalle-bloque">
                <h3 className="emp-detalle-subtitulo">Productos</h3>
                <div className="emp-detalle-items">
                  {(pedidoSeleccionado.items || []).map((item, i) => (
                    <div key={i} className="emp-detalle-item">
                      <span className="emp-detalle-item-nombre">
                        {item.producto?.nombre || item.nombre || "Producto"}
                      </span>
                      <span className="emp-texto-muted">× {item.cantidad}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="emp-detalle-bloque">
                <h3 className="emp-detalle-subtitulo">Datos del envío</h3>
                <label className="emp-label" style={{ marginBottom: 12 }}>
                  Transportadora
                  <select
                    className="emp-input"
                    value={envioForm.transportadoraNombre}
                    disabled={pedidoYaEnviado || guardandoEnvio}
                    onChange={(e) => setEnvioForm((prev) => ({ ...prev, transportadoraNombre: e.target.value }))}
                    required={!pedidoYaEnviado}
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
                    disabled={pedidoYaEnviado || guardandoEnvio}
                    onChange={(e) => setEnvioForm((prev) => ({ ...prev, numeroRastreo: e.target.value }))}
                    placeholder="Ej: 1234567890"
                    required={!pedidoYaEnviado}
                  />
                </label>
                {pedidoSeleccionado.transportadoraUrl && (
                  <p className="emp-texto-muted" style={{ marginTop: 8 }}>
                    🔗{" "}
                    <a href={pedidoSeleccionado.transportadoraUrl} target="_blank" rel="noopener noreferrer"
                      style={{ color: "#c0392b" }}>
                      {pedidoSeleccionado.transportadoraUrl}
                    </a>
                  </p>
                )}
              </div>

              <div className="emp-form-acciones">
                <button type="button" className="emp-btn emp-btn--ghost" onClick={cerrarModal}>
                  Cerrar
                </button>
                {!pedidoYaEnviado && (
                  <button type="submit" className="emp-btn emp-btn--primario" disabled={guardandoEnvio}>
                    {guardandoEnvio ? "Guardando..." : "Guardar envío y notificar cliente"}
                  </button>
                )}
                {pedidoYaEnviado && (
                  <button type="button" className="emp-btn emp-btn--primario" onClick={reenviarCorreoEnvio} disabled={guardandoEnvio}>
                    {guardandoEnvio ? "Enviando..." : "Reenviar correo"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
