import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";

export default function PagoResultado() {
  const { setVista } = useApp();
  const [estado, setEstado] = useState("cargando"); // cargando | aprobado | rechazado | pendiente

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Wompi agrega estos params en la URL de retorno
    const transaccionId     = params.get("id");
    const transaccionEstado = params.get("transaction[status]") || params.get("status");

    if (!transaccionId) {
      // Si no hay ID de transacción, redirigir al inicio
      setVista("inicio");
      return;
    }

    if (transaccionEstado === "APPROVED") {
      setEstado("aprobado");
    } else if (transaccionEstado === "PENDING") {
      setEstado("pendiente");
    } else {
      setEstado("rechazado");
    }

    // Limpiar los parámetros de la URL sin recargar la página
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  const CONFIGS = {
    cargando: {
      icono:    "⏳",
      titulo:   "Verificando tu pago...",
      mensaje:  "Estamos confirmando el estado de tu transacción.",
      color:    "#888",
      bg:       "#f5f5f5",
    },
    aprobado: {
      icono:    "✅",
      titulo:   "¡Pago aprobado!",
      mensaje:  "Tu pedido fue confirmado y está siendo preparado. Recibirás un correo con los detalles.",
      color:    "#2e7d32",
      bg:       "#e8f5e9",
    },
    pendiente: {
      icono:    "⏳",
      titulo:   "Pago en proceso",
      mensaje:  "Tu pago está siendo procesado. Te notificaremos por correo cuando se confirme.",
      color:    "#f57f17",
      bg:       "#fff8e1",
    },
    rechazado: {
      icono:    "❌",
      titulo:   "Pago no aprobado",
      mensaje:  "Tu pago no pudo ser procesado. Puedes intentarlo de nuevo con otro método de pago.",
      color:    "#c0392b",
      bg:       "#fce4e4",
    },
  };

  const cfg = CONFIGS[estado];

  return (
    <div style={{
      minHeight: "70vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
    }}>
      <div style={{
        textAlign: "center",
        padding: "60px 48px",
        background: "#fff",
        borderRadius: 20,
        boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
        maxWidth: 500,
        width: "100%",
        border: `1px solid ${cfg.bg}`,
      }}>
        {/* Ícono */}
        <div style={{ fontSize: 72, marginBottom: 20, lineHeight: 1 }}>
          {cfg.icono}
        </div>

        {/* Badge de estado */}
        <div style={{
          display: "inline-block",
          background: cfg.bg,
          color: cfg.color,
          fontSize: 12,
          fontWeight: 700,
          padding: "4px 14px",
          borderRadius: 20,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          marginBottom: 16,
        }}>
          {estado === "cargando"  ? "Verificando"  : ""}
          {estado === "aprobado"  ? "Aprobado"     : ""}
          {estado === "pendiente" ? "En proceso"   : ""}
          {estado === "rechazado" ? "Rechazado"    : ""}
        </div>

        {/* Título */}
        <h2 style={{
          color: "#1a1a1a",
          fontSize: 24,
          fontWeight: 700,
          margin: "0 0 12px",
        }}>
          {cfg.titulo}
        </h2>

        {/* Mensaje */}
        <p style={{
          color: "#666",
          fontSize: 15,
          lineHeight: 1.7,
          margin: "0 0 32px",
        }}>
          {cfg.mensaje}
        </p>

        {/* Botones según estado */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(estado === "aprobado" || estado === "pendiente") && (
            <>
              <button
                className="btn btn-primary"
                onClick={() => setVista("historial")}
              >
                Ver mis pedidos
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setVista("inicio")}
              >
                Volver al inicio
              </button>
            </>
          )}

          {estado === "rechazado" && (
            <>
              <button
                className="btn btn-primary"
                onClick={() => setVista("carrito")}
              >
                Intentar de nuevo
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setVista("inicio")}
              >
                Volver al inicio
              </button>
            </>
          )}

          {estado === "cargando" && (
            <button
              className="btn btn-ghost"
              onClick={() => setVista("inicio")}
            >
              Volver al inicio
            </button>
          )}
        </div>

        {/* Nota de seguridad */}
        <p style={{
          marginTop: 28,
          fontSize: 12,
          color: "#bbb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Pago procesado de forma segura por Wompi
        </p>
      </div>
    </div>
  );
}
