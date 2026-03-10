import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatearPrecio } from "@/data";

const PASOS = [
  { num: 1, label: "Carrito", icon: "🛒" },
  { num: 2, label: "Datos", icon: "👤" },
  { num: 3, label: "Envío", icon: "📦" },
  { num: 4, label: "Pago", icon: "💳" },
];

const inputStyle = {
  display: "block",
  width: "100%",
  border: "1.5px solid #e0e0e0",
  borderRadius: 8,
  padding: "12px 15px",
  marginTop: 6,
  boxSizing: "border-box",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.2s",
  background: "#fafafa",
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#444",
  display: "block",
};

export default function Checkout({ onVolver, initialPaso = 1 }) {
  const { items, totalCarrito, crearPedido, vaciarCarrito, setVista, resetCheckout } = useApp();
  const [paso, setPaso] = useState(initialPaso);
  const [datos, setDatos] = useState({ nombre: "", apellido: "", email: "", telefono: "", doc: "" });
  const [envio, setEnvio] = useState({ ciudad: "", depto: "", direccion: "", notas: "" });
  const [metodo, setMetodo] = useState("");
  const [terminado, setTerminado] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const setField = (obj, setObj) => (k) => (e) => setObj({ ...obj, [k]: e.target.value });

  async function confirmar() {
    if (!metodo) { alert("Selecciona un método de pago"); return; }
    await crearPedido({
      items: items.map(i => ({ productoId: i.producto.id, nombre: i.producto.nombre, precio: i.producto.precio, cantidad: i.cantidad })),
      total: totalCarrito(),
      metodoPago: metodo,
      direccion: envio.direccion,
      ciudad: envio.ciudad,
    });
    vaciarCarrito();
    setTerminado(true);
  }

  if (terminado) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: "60px 40px", background: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", maxWidth: 480 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: "#1a1a1a", marginBottom: 10 }}>¡Pedido confirmado!</h2>
        <p style={{ color: "#666", marginBottom: 28, lineHeight: 1.6 }}>
          Recibirás un correo con los detalles de tu pedido.<br />¡Gracias por comprar en SEVE Aluminios!
        </p>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetCheckout?.();
            setVista("carrito");
          }}
        >
          Volver al carrito
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px 60px" }}>

      {/* ── Indicador de pasos estilo Imusa ── */}
      <div style={{ padding: "32px 0 36px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          {PASOS.map((p, i) => {
            const activo = p.num === paso;
            const completado = p.num < paso;
            return (
              <div key={p.num} style={{ display: "flex", alignItems: "center" }}>
                {/* Círculo + etiqueta */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%",
                    background: completado ? "#c0392b" : activo ? "#c0392b" : "#fff",
                    color: completado || activo ? "#fff" : "#bbb",
                    border: activo ? "3px solid #8b1a1a" : completado ? "3px solid #c0392b" : "2.5px solid #ddd",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 15,
                    boxShadow: activo ? "0 4px 16px rgba(192,57,43,0.3)" : "none",
                    transition: "all 0.3s",
                  }}>
                    {completado ? "✓" : p.num}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: activo ? 700 : 500,
                    color: activo ? "#c0392b" : completado ? "#c0392b" : "#aaa",
                    letterSpacing: "0.04em", textTransform: "uppercase",
                  }}>{p.label}</span>
                </div>

                {/* Línea conectora */}
                {i < PASOS.length - 1 && (
                  <div style={{
                    width: 80, height: 2, marginBottom: 22, marginLeft: 4, marginRight: 4,
                    background: p.num < paso ? "#c0392b" : "#e8e8e8",
                    transition: "background 0.3s",
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Contenedor del formulario ── */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", overflow: "hidden" }}>

        {/* Cabecera del paso */}
        <div style={{ background: "#c0392b", padding: "20px 32px" }}>
          <h3 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 700 }}>
            {PASOS[paso - 1].icon} {PASOS[paso - 1].label}
          </h3>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
            Paso {paso} de 4
          </p>
        </div>

        <div style={{ padding: "32px" }}>

          {/* ── PASO 1: Carrito ── */}
          {paso === 1 && (
            <>
              <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #f0f0f0" }}>
                {items.map(({ producto, cantidad }, idx) => (
                  <div key={producto.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 20px",
                    background: idx % 2 === 0 ? "#fafafa" : "#fff",
                    borderBottom: idx < items.length - 1 ? "1px solid #f0f0f0" : "none",
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#222" }}>{producto.nombre}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Cantidad: {cantidad}</div>
                    </div>
                    <strong style={{ color: "#c0392b", fontSize: 15 }}>{formatearPrecio(producto.precio * cantidad)}</strong>
                  </div>
                ))}
              </div>

              {/* Total */}
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

          {/* ── PASO 2: Datos personales ── */}
          {paso === 2 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[["nombre", "Nombre"], ["apellido", "Apellido"]].map(([k, l]) => (
                  <div key={k}>
                    <label style={labelStyle}>{l} <span style={{ color: "#c0392b" }}>*</span></label>
                    <input
                      style={{ ...inputStyle, borderColor: focusedInput === k ? "#c0392b" : "#e0e0e0" }}
                      value={datos[k]} onChange={setField(datos, setDatos)(k)}
                      onFocus={() => setFocusedInput(k)} onBlur={() => setFocusedInput(null)}
                      placeholder={l}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Correo electrónico <span style={{ color: "#c0392b" }}>*</span></label>
                <input
                  style={{ ...inputStyle, borderColor: focusedInput === "email" ? "#c0392b" : "#e0e0e0" }}
                  value={datos.email} onChange={setField(datos, setDatos)("email")}
                  onFocus={() => setFocusedInput("email")} onBlur={() => setFocusedInput(null)}
                  placeholder="ejemplo@correo.com" type="email"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                {[["telefono", "Teléfono"], ["doc", "Documento de identidad"]].map(([k, l]) => (
                  <div key={k}>
                    <label style={labelStyle}>{l} <span style={{ color: "#c0392b" }}>*</span></label>
                    <input
                      style={{ ...inputStyle, borderColor: focusedInput === k ? "#c0392b" : "#e0e0e0" }}
                      value={datos[k]} onChange={setField(datos, setDatos)(k)}
                      onFocus={() => setFocusedInput(k)} onBlur={() => setFocusedInput(null)}
                      placeholder={l}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
                <button className="btn btn-ghost" onClick={() => setPaso(1)} style={{ flex: 1 }}>← Volver</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => {
                  if (!datos.nombre || !datos.apellido || !datos.email || !datos.telefono) {
                    alert("Por favor completa todos los campos obligatorios");
                    return;
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
                {[["ciudad", "Ciudad"], ["depto", "Departamento"]].map(([k, l]) => (
                  <div key={k}>
                    <label style={labelStyle}>{l} <span style={{ color: "#c0392b" }}>*</span></label>
                    <input
                      style={{ ...inputStyle, borderColor: focusedInput === k ? "#c0392b" : "#e0e0e0" }}
                      value={envio[k]} onChange={setField(envio, setEnvio)(k)}
                      onFocus={() => setFocusedInput(k)} onBlur={() => setFocusedInput(null)}
                      placeholder={l}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Dirección completa <span style={{ color: "#c0392b" }}>*</span></label>
                <input
                  style={{ ...inputStyle, borderColor: focusedInput === "direccion" ? "#c0392b" : "#e0e0e0" }}
                  value={envio.direccion} onChange={setField(envio, setEnvio)("direccion")}
                  onFocus={() => setFocusedInput("direccion")} onBlur={() => setFocusedInput(null)}
                  placeholder="Calle 00 # 00 - 00, Barrio"
                />
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Notas adicionales <span style={{ color: "#aaa", fontWeight: 400 }}>(opcional)</span></label>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: "vertical", borderColor: focusedInput === "notas" ? "#c0392b" : "#e0e0e0" }}
                  value={envio.notas} onChange={setField(envio, setEnvio)("notas")}
                  onFocus={() => setFocusedInput("notas")} onBlur={() => setFocusedInput(null)}
                  placeholder="Instrucciones especiales para la entrega..."
                />
              </div>

              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 18px", marginTop: 20, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>🚚</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#166534" }}>Envío estándar (3–5 días hábiles)</div>
                  <div style={{ fontSize: 13, color: "#15803d" }}>¡Envío GRATIS en tu pedido!</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
                <button className="btn btn-ghost" onClick={() => setPaso(2)} style={{ flex: 1 }}>← Volver</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => {
                  if (!envio.ciudad || !envio.direccion) {
                    alert("Por favor completa ciudad y dirección");
                    return;
                  }
                  setPaso(4);
                }}>Continuar al pago →</button>
              </div>
            </>
          )}

          {/* ── PASO 4: Pago ── */}
          {paso === 4 && (
            <>
              <p style={{ color: "#666", fontSize: 14, marginTop: 0, marginBottom: 20 }}>
                Selecciona tu método de pago preferido:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "PSE", icon: "🏦" },
                  { label: "Tarjeta débito / crédito", icon: "💳" },
                  { label: "Nequi", icon: "📱" },
                  { label: "Daviplata", icon: "📲" },
                  { label: "Efectivo", icon: "💵" },
                  { label: "Bancolombia", icon: "🏧" },
                ].map(({ label, icon }) => (
                  <label key={label} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px",
                    border: `2px solid ${metodo === label ? "#c0392b" : "#e8e8e8"}`,
                    borderRadius: 10, cursor: "pointer",
                    background: metodo === label ? "#fff5f5" : "#fafafa",
                    transition: "all 0.2s",
                  }}>
                    <input type="radio" name="metodo" value={label} checked={metodo === label} onChange={() => setMetodo(label)}
                      style={{ accentColor: "#c0392b" }} />
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <span style={{ fontSize: 13, fontWeight: metodo === label ? 700 : 500, color: metodo === label ? "#c0392b" : "#333" }}>{label}</span>
                  </label>
                ))}
              </div>

              {/* Resumen final */}
              <div style={{ marginTop: 24, padding: "16px 20px", background: "#f9f9f9", borderRadius: 10, border: "1px solid #eee" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#555", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Resumen del pedido</div>
                {items.map(({ producto, cantidad }) => (
                  <div key={producto.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555", marginBottom: 6 }}>
                    <span>{producto.nombre} × {cantidad}</span>
                    <span>{formatearPrecio(producto.precio * cantidad)}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid #ddd", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ color: "#222" }}>Total</strong>
                  <strong style={{ color: "#c0392b", fontSize: 16 }}>{formatearPrecio(totalCarrito())}</strong>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={() => setPaso(3)} style={{ flex: 1 }}>← Volver</button>
                <button className="btn btn-primary" onClick={confirmar} style={{ flex: 2 }}>
                  Finalizar compra ✓
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
