import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";
import { API_BASE } from "@/config";

// ── Wompi public key ──────────────────────────────────────────────
const WOMPI_PUBLIC_KEY = "pub_test_R3Jz03Tdwipd524EvC32vWNhdXgFJTyI";

const ICONOS = {
  carrito: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  ),
  datos: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  envio: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  pago: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
};

const PASOS = [
  { num: 1, label: "Carrito", icon: ICONOS.carrito },
  { num: 2, label: "Datos",   icon: ICONOS.datos   },
  { num: 3, label: "Envío",   icon: ICONOS.envio   },
  { num: 4, label: "Pago",    icon: ICONOS.pago    },
];

const inputStyle = {
  display: "block", width: "100%", border: "1.5px solid #e0e0e0",
  borderRadius: 8, padding: "12px 15px", marginTop: 6,
  boxSizing: "border-box", fontSize: 14, fontFamily: "inherit",
  outline: "none", transition: "border-color 0.2s", background: "#fafafa",
};

const labelStyle = { fontSize: 13, fontWeight: 600, color: "#444", display: "block" };

// ── Panel lateral: Resumen ────────────────────────────────────────
function ResumenCompra({ items, totalCarrito }) {
  return (
    <div style={{
      background: "#f5f5f5", borderRadius: 12, padding: "24px 20px",
      position: "sticky", top: 20, minWidth: 280,
    }}>
      <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#222" }}>
        Resumen de la compra
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
        {items.map(({ producto, cantidad }) => (
          <div key={producto.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img src={producto.imagen} alt={producto.nombre}
                style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff" }}
                onError={e => { e.target.style.display = "none"; }} />
              <div style={{
                position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%",
                background: "#c0392b", color: "#fff", fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{cantidad}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#222", fontWeight: 500, lineHeight: 1.4 }}>{producto.nombre}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#c0392b", marginTop: 4 }}>
                {formatearPrecio(producto.precio * cantidad)}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #ddd", paddingTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666", marginBottom: 8 }}>
          <span>Subtotal</span><span>{formatearPrecio(totalCarrito())}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666", marginBottom: 16 }}>
          <span>Envío</span>
          <span style={{ color: "#27ae60", fontWeight: 600 }}>Gratis</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#222" }}>Total</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#222" }}>{formatearPrecio(totalCarrito())}</span>
        </div>
      </div>
    </div>
  );
}

// ── Productos relacionados ────────────────────────────────────────
function ProductosRelacionados({ itemsCarrito }) {
  const { agregarAlCarrito, productos } = useApp();
  const [inicio, setInicio] = useState(0);
  const POR_PAGINA = 3;
  const idsEnCarrito = new Set((itemsCarrito || []).map(i => i.producto.id));
  const disponibles = productos.filter(p => !idsEnCarrito.has(p.id));
  const total = disponibles.length;
  if (total === 0) return null;
  const visibles = disponibles.slice(inicio, inicio + POR_PAGINA);
  return (
    <div style={{ maxWidth: 1100, margin: "32px auto 0", padding: "0 20px 60px" }}>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: "#222", textAlign: "center", marginBottom: 28 }}>Cómpralo con</h3>
      <div style={{ position: "relative" }}>
        <button onClick={() => setInicio(Math.max(0, inicio - POR_PAGINA))} disabled={inicio === 0}
          style={{ position: "absolute", left: -20, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", border: "1px solid #ddd", background: "#fff", cursor: inicio === 0 ? "default" : "pointer", opacity: inicio === 0 ? 0.3 : 1, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>‹</button>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {visibles.map(producto => (
            <div key={producto.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", padding: "20px 16px 16px", textAlign: "center", transition: "box-shadow 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
              <img src={producto.imagen} alt={producto.nombre} style={{ width: "100%", height: 160, objectFit: "contain", marginBottom: 12 }} onError={e => e.target.style.display = "none"} />
              {producto.enOferta && <div style={{ display: "inline-block", background: "#c0392b", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 4, marginBottom: 8 }}>Oferta SEVE</div>}
              <div style={{ fontSize: 14, fontWeight: 600, color: "#222", marginBottom: 6, lineHeight: 1.4 }}>{producto.nombre}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#222", marginBottom: 14 }}>{formatearPrecio(producto.precio)}</div>
              <button onClick={() => agregarAlCarrito(producto)} style={{ width: "100%", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8, padding: "11px 0", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.background = "#c0392b"}
                onMouseLeave={e => e.currentTarget.style.background = "#1a1a1a"}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/></svg>
                Agregar
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => setInicio(Math.min(total - POR_PAGINA, inicio + POR_PAGINA))} disabled={inicio + POR_PAGINA >= total}
          style={{ position: "absolute", right: -20, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", border: "1px solid #ddd", background: "#fff", cursor: inicio + POR_PAGINA >= total ? "default" : "pointer", opacity: inicio + POR_PAGINA >= total ? 0.3 : 1, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>›</button>
      </div>
    </div>
  );
}

// ── Componente principal Checkout ─────────────────────────────────
export default function Checkout({ onVolver, initialPaso = 1 }) {
  const { items, totalCarrito, crearPedido, vaciarCarrito, setVista, resetCheckout, usuario } = useApp();
  const [paso, setPaso] = useState(initialPaso);
  const [datos, setDatos] = useState({ nombre: "", apellido: "", email: "", telefono: "", doc: "" });
  const [envio, setEnvio] = useState({ depto: "", ciudad: "", direccion: "", infoadicional: "", barrio: "", destinatario: "", notas: "" });
  const [departamentos, setDepartamentos] = useState([]);
  const [ubicacionesError, setUbicacionesError] = useState("");
  const [terminado, setTerminado] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [pedidoId, setPedidoId] = useState(null);
  const [cargandoPago, setCargandoPago] = useState(false);
  const [errorPago, setErrorPago] = useState("");
  const wompiRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_BASE}/ubicaciones/departamentos`)
      .then(({ data }) => { setDepartamentos(data); setUbicacionesError(""); })
      .catch(() => setUbicacionesError("No fue posible cargar departamentos y municipios."));
  }, []);

  useEffect(() => {
    if (!usuario) return;
    setDatos(prev => ({
      ...prev,
      nombre:   prev.nombre   || usuario.nombres   || "",
      apellido: prev.apellido || usuario.apellidos  || "",
      email:    prev.email    || usuario.email      || "",
      telefono: prev.telefono || usuario.telefono   || "",
    }));
    setEnvio(prev => ({
      ...prev,
      depto:        prev.depto        || usuario.ciudad    || "",
      ciudad:       prev.ciudad       || usuario.municipio || "",
      direccion:    prev.direccion    || usuario.direccion || "",
      barrio:       prev.barrio       || usuario.barrio    || "",
      destinatario: prev.destinatario || `${usuario.nombres || ""} ${usuario.apellidos || ""}`.trim(),
    }));
  }, [usuario]);

  // Inyectar script de Wompi una sola vez
  useEffect(() => {
    if (!document.getElementById("wompi-script")) {
      const script = document.createElement("script");
      script.id = "wompi-script";
      script.src = "https://checkout.wompi.co/widget.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const setField = (obj, setObj) => (k) => (e) => setObj({ ...obj, [k]: e.target.value });
  function handleDepto(e) { setEnvio({ ...envio, depto: e.target.value, ciudad: "" }); }
  const municipios = envio.depto
    ? (departamentos.find(d => d.nombre === envio.depto)?.ciudades || [])
    : [];

  // ── Paso 4: crear pedido pendiente y lanzar widget Wompi ────────
  async function iniciarPagoWompi() {
    setErrorPago("");
    setCargandoPago(true);
    try {
      // 1. Crear pedido con estado "pendiente" (esperando pago)
      const pedido = await crearPedido({
        items: items.map(i => ({
          productoId: i.producto.id,
          nombre:     i.producto.nombre,
          precio:     i.producto.precio,
          cantidad:   i.cantidad,
        })),
        total:      totalCarrito(),
        metodoPago: "Wompi",
        direccion:  `${envio.direccion}${envio.infoadicional ? ", " + envio.infoadicional : ""}${envio.barrio ? ", Barrio " + envio.barrio : ""}`,
        ciudad:     envio.ciudad,
      });

      setPedidoId(pedido._id);

      // 2. Obtener firma de integridad desde el backend
      const { data: firmaData } = await axios.post(
        `${API_BASE}/pedidos/wompi/firma`,
        { pedidoId: pedido._id, total: totalCarrito() },
        { headers: { Authorization: `Bearer ${localStorage.getItem("seve_token")}` } }
      );

      // 3. Montar el formulario de Wompi en el DOM
      if (wompiRef.current) {
        wompiRef.current.innerHTML = "";

        const form = document.createElement("form");
        form.action = "https://checkout.wompi.co/p/";
        form.method = "GET";

        const campos = {
          "public-key":          WOMPI_PUBLIC_KEY,
          "currency":            "COP",
          // Wompi trabaja en centavos
          "amount-in-cents":     String(totalCarrito() * 100),
          "reference":           pedido._id,
          "signature:integrity": firmaData.firma,
          "redirect-url":        `${window.location.origin}/pago-resultado`,
          "customer-data:email":          datos.email,
          "customer-data:full-name":      `${datos.nombre} ${datos.apellido}`.trim(),
          "customer-data:phone-number":   datos.telefono.replace(/\D/g, ""),
          "customer-data:phone-number-prefix": "+57",
          "customer-data:legal-id":       datos.doc,
          "customer-data:legal-id-type":  "CC",
        };

        Object.entries(campos).forEach(([name, value]) => {
          const input = document.createElement("input");
          input.type  = "hidden";
          input.name  = name;
          input.value = value;
          form.appendChild(input);
        });

        const btn = document.createElement("button");
        btn.type = "submit";
        btn.style.cssText = `
          width: 100%; padding: 16px; background: #c0392b; color: #fff;
          border: none; border-radius: 10px; font-size: 16px; font-weight: 700;
          cursor: pointer; font-family: inherit; display: flex;
          align-items: center; justify-content: center; gap: 10px;
        `;
        btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          Pagar ${formatearPrecio(totalCarrito())} con Wompi
        `;
        btn.onmouseover = () => { btn.style.background = "#a93226"; };
        btn.onmouseout  = () => { btn.style.background = "#c0392b"; };

        form.appendChild(btn);
        wompiRef.current.appendChild(form);

        // Vaciar carrito solo después de que el usuario sea redirigido
        form.addEventListener("submit", () => {
          vaciarCarrito();
        });
      }
    } catch (err) {
      setErrorPago(err?.response?.data?.error || "No se pudo iniciar el pago. Intenta de nuevo.");
    } finally {
      setCargandoPago(false);
    }
  }

  // Verificar resultado cuando Wompi redirige de vuelta
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const transaccionId = params.get("id");
    if (transaccionId && window.location.pathname === "/pago-resultado") {
      setTerminado(true);
    }
  }, []);

  if (terminado) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: "60px 40px", background: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", maxWidth: 480 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: "#1a1a1a", marginBottom: 10 }}>¡Pedido confirmado!</h2>
        <p style={{ color: "#666", marginBottom: 28, lineHeight: 1.6 }}>
          Recibirás un correo con los detalles de tu pedido.<br />¡Gracias por comprar en SEVE Aluminios!
        </p>
        <button className="btn btn-primary" onClick={() => { resetCheckout?.(); setVista("inicio"); }}>
          Volver al inicio
        </button>
      </div>
    </div>
  );

  const wrapStyle = {
    maxWidth: 1100, margin: "0 auto", padding: "0 20px 60px",
    display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px",
    gap: 24, alignItems: "start", width: "100%", boxSizing: "border-box",
  };

  return (
    <div>
      <div style={wrapStyle}>
        {/* Columna principal */}
        <div>
          {/* Stepper */}
          <div style={{ padding: "32px 0 36px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              {PASOS.map((p, i) => {
                const activo    = p.num === paso;
                const completado = p.num < paso;
                return (
                  <div key={p.num} style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: "50%",
                        background: completado || activo ? "#c0392b" : "#fff",
                        color: completado || activo ? "#fff" : "#bbb",
                        border: activo ? "3px solid #8b1a1a" : completado ? "3px solid #c0392b" : "2.5px solid #ddd",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: 15,
                        boxShadow: activo ? "0 4px 16px rgba(192,57,43,0.3)" : "none",
                        transition: "all 0.3s",
                      }}>
                        {completado ? "✓" : p.icon}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: activo ? 700 : 500, color: activo || completado ? "#c0392b" : "#aaa", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        {p.label}
                      </span>
                    </div>
                    {i < PASOS.length - 1 && (
                      <div style={{ width: 80, height: 2, marginBottom: 22, marginLeft: 4, marginRight: 4, background: p.num < paso ? "#c0392b" : "#e8e8e8", transition: "background 0.3s" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ background: "#c0392b", padding: "20px 32px" }}>
              <h3 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                {PASOS[paso - 1].icon} {PASOS[paso - 1].label}
              </h3>
              <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>Paso {paso} de 4</p>
            </div>

            <div style={{ padding: "32px" }}>

              {/* ── PASO 1: Carrito ── */}
              {paso === 1 && (
                <>
                  <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #f0f0f0" }}>
                    {items.map(({ producto, cantidad }, idx) => (
                      <div key={producto.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", background: idx % 2 === 0 ? "#fafafa" : "#fff", borderBottom: idx < items.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#222" }}>{producto.nombre}</div>
                          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Cantidad: {cantidad}</div>
                        </div>
                        <strong style={{ color: "#c0392b", fontSize: 15 }}>{formatearPrecio(producto.precio * cantidad)}</strong>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, padding: "16px 20px", background: "#fff5f5", borderRadius: 10, border: "1px solid #fcd5d5" }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: "#333" }}>Total a pagar</span>
                    <span style={{ fontWeight: 800, fontSize: 22, color: "#c0392b" }}>{formatearPrecio(totalCarrito())}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
                    <button className="btn btn-ghost" onClick={onVolver} style={{ flex: 1 }}>← Volver al carrito</button>
                    <button className="btn btn-primary" onClick={() => setPaso(2)} style={{ flex: 2 }}>Continuar con mis datos →</button>
                  </div>
                </>
              )}

              {/* ── PASO 2: Datos ── */}
              {paso === 2 && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {[["nombre", "Nombre"], ["apellido", "Apellido"]].map(([k, l]) => (
                      <div key={k}>
                        <label style={labelStyle}>{l} <span style={{ color: "#c0392b" }}>*</span></label>
                        <input style={{ ...inputStyle, borderColor: focusedInput === k ? "#c0392b" : "#e0e0e0" }}
                          value={datos[k]} onChange={setField(datos, setDatos)(k)}
                          onFocus={() => setFocusedInput(k)} onBlur={() => setFocusedInput(null)} placeholder={l} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <label style={labelStyle}>Correo electrónico <span style={{ color: "#c0392b" }}>*</span></label>
                    <input style={{ ...inputStyle, borderColor: focusedInput === "email" ? "#c0392b" : "#e0e0e0" }}
                      value={datos.email} onChange={setField(datos, setDatos)("email")}
                      onFocus={() => setFocusedInput("email")} onBlur={() => setFocusedInput(null)}
                      placeholder="ejemplo@correo.com" type="email" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                    {[["telefono", "Teléfono"], ["doc", "Documento de identidad"]].map(([k, l]) => (
                      <div key={k}>
                        <label style={labelStyle}>{l} <span style={{ color: "#c0392b" }}>*</span></label>
                        <input style={{ ...inputStyle, borderColor: focusedInput === k ? "#c0392b" : "#e0e0e0" }}
                          value={datos[k]} onChange={setField(datos, setDatos)(k)}
                          onFocus={() => setFocusedInput(k)} onBlur={() => setFocusedInput(null)} placeholder={l} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
                    <button className="btn btn-ghost" onClick={() => setPaso(1)} style={{ flex: 1 }}>← Volver</button>
                    <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => {
                      if (!datos.nombre || !datos.apellido || !datos.email || !datos.telefono || !datos.doc) {
                        alert("Por favor completa todos los campos obligatorios"); return;
                      }
                      setPaso(3);
                    }}>Continuar con el envío →</button>
                  </div>
                </>
              )}

              {/* ── PASO 3: Envío ── */}
              {paso === 3 && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Departamento <span style={{ color: "#c0392b" }}>*</span></label>
                      <select style={{ ...inputStyle, cursor: "pointer", borderColor: focusedInput === "depto" ? "#c0392b" : "#e0e0e0" }}
                        value={envio.depto} onChange={handleDepto}
                        onFocus={() => setFocusedInput("depto")} onBlur={() => setFocusedInput(null)}>
                        <option value="">Seleccione un Departamento</option>
                        {departamentos.map(d => <option key={d.nombre} value={d.nombre}>{d.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Municipio <span style={{ color: "#c0392b" }}>*</span></label>
                      <select style={{ ...inputStyle, cursor: "pointer", borderColor: focusedInput === "ciudad" ? "#c0392b" : "#e0e0e0", opacity: !envio.depto ? 0.5 : 1 }}
                        value={envio.ciudad} onChange={setField(envio, setEnvio)("ciudad")}
                        onFocus={() => setFocusedInput("ciudad")} onBlur={() => setFocusedInput(null)} disabled={!envio.depto}>
                        <option value="">Seleccione un Municipio</option>
                        {municipios.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  {ubicacionesError && <p style={{ color: "#c0392b", fontSize: 13, marginTop: 10 }}>{ubicacionesError}</p>}
                  <div style={{ marginTop: 16 }}>
                    <label style={labelStyle}>Dirección <span style={{ color: "#c0392b" }}>*</span></label>
                    <input style={{ ...inputStyle, borderColor: focusedInput === "direccion" ? "#c0392b" : "#e0e0e0" }}
                      value={envio.direccion} onChange={setField(envio, setEnvio)("direccion")}
                      onFocus={() => setFocusedInput("direccion")} onBlur={() => setFocusedInput(null)}
                      placeholder="Calle 123 # 45-67" />
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <label style={labelStyle}>Información adicional</label>
                    <input style={{ ...inputStyle, borderColor: focusedInput === "infoadicional" ? "#c0392b" : "#e0e0e0" }}
                      value={envio.infoadicional} onChange={setField(envio, setEnvio)("infoadicional")}
                      onFocus={() => setFocusedInput("infoadicional")} onBlur={() => setFocusedInput(null)}
                      placeholder="Apto. 201, Torre B, etc." />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                    <div>
                      <label style={labelStyle}>Barrio</label>
                      <input style={{ ...inputStyle, borderColor: focusedInput === "barrio" ? "#c0392b" : "#e0e0e0" }}
                        value={envio.barrio} onChange={setField(envio, setEnvio)("barrio")}
                        onFocus={() => setFocusedInput("barrio")} onBlur={() => setFocusedInput(null)} placeholder="Opcional" />
                    </div>
                    <div>
                      <label style={labelStyle}>Destinatario <span style={{ color: "#c0392b" }}>*</span></label>
                      <input style={{ ...inputStyle, borderColor: focusedInput === "destinatario" ? "#c0392b" : "#e0e0e0" }}
                        value={envio.destinatario} onChange={setField(envio, setEnvio)("destinatario")}
                        onFocus={() => setFocusedInput("destinatario")} onBlur={() => setFocusedInput(null)}
                        placeholder="Nombre de quien recibe" />
                    </div>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <label style={{ ...labelStyle, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      Método de entrega
                    </label>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", border: "2px solid #c0392b", borderRadius: 10, background: "#fff5f5" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#c0392b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />
                        </div>
                        <span style={{ fontSize: 14, color: "#333" }}>En hasta 2 días hábiles</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#27ae60" }}>Gratis</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
                    <button className="btn btn-ghost" onClick={() => setPaso(2)} style={{ flex: 1 }}>← Volver</button>
                    <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => {
                      if (!envio.depto || !envio.ciudad || !envio.direccion || !envio.destinatario) {
                        alert("Por favor completa departamento, municipio, dirección y destinatario"); return;
                      }
                      setPaso(4);
                      // Pre-cargar el botón de pago
                      setTimeout(() => iniciarPagoWompi(), 100);
                    }}>Ir a PAGO →</button>
                  </div>
                </>
              )}

              {/* ── PASO 4: Pago con Wompi ── */}
              {paso === 4 && (
                <div>
                  {/* Info del pedido */}
                  <div style={{ background: "#f8f8f8", borderRadius: 10, padding: "16px 20px", marginBottom: 24, border: "1px solid #eee" }}>
                    <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>Dirección de envío</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#222" }}>
                      {envio.direccion}{envio.infoadicional ? `, ${envio.infoadicional}` : ""}
                      {envio.barrio ? `, Barrio ${envio.barrio}` : ""}, {envio.ciudad}, {envio.depto}
                    </div>
                    <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Para: {envio.destinatario}</div>
                  </div>

                  {/* Error */}
                  {errorPago && (
                    <div style={{ background: "#fce4e4", border: "1px solid #f5c6c6", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#c0392b", fontSize: 13, fontWeight: 500 }}>
                      {errorPago}
                    </div>
                  )}

                  {/* Botón Wompi — se monta aquí via DOM */}
                  <div ref={wompiRef} style={{ marginBottom: 16 }}>
                    {cargandoPago && (
                      <div style={{ textAlign: "center", padding: "32px 0", color: "#888" }}>
                        Preparando el pago...
                      </div>
                    )}
                  </div>

                  {/* Seguridad */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 16, color: "#888", fontSize: 12 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Pago 100% seguro procesado por Wompi
                  </div>

                  <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                    <button className="btn btn-ghost" onClick={() => { setPaso(3); if (wompiRef.current) wompiRef.current.innerHTML = ""; }} style={{ flex: 1 }}>
                      ← Volver
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Columna lateral */}
        <ResumenCompra items={items} totalCarrito={totalCarrito} />
      </div>

      <ProductosRelacionados itemsCarrito={items} />
    </div>
  );
}
