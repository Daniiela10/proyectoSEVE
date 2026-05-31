import { useEffect, useState } from "react";
import axios from "axios";
import { useApp } from "@/context/AppContext";
import { API_BASE, WOMPI_PEDIDO_STORAGE_KEY } from "@/config";

function resolverVistaDesdePedido(pedido, estadoPago) {
  const estadoWompi = estadoPago || pedido?.wompiEstado;
  if (estadoWompi === "APPROVED") return "aprobado";
  if (estadoWompi === "PENDING") return "pendiente";
  if (estadoWompi === "DECLINED" || estadoWompi === "ERROR" || estadoWompi === "VOIDED") {
    return "rechazado";
  }
  return "cargando";
}

function obtenerTransactionId(params) {
  return (
    params.get("id") ||
    params.get("transaction_id") ||
    params.get("transactionId") ||
    params.get("wompi_transaction_id") ||
    ""
  );
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function PagoResultado() {
  const { setVista, vaciarCarrito } = useApp();
  const [estado, setEstado] = useState("cargando");
  const [mensajeExtra, setMensajeExtra] = useState("");

  useEffect(() => {
    let activo = true;

    async function sincronizarResultado() {
      const params = new URLSearchParams(window.location.search);
      const pedidoId = params.get("pedidoId") || sessionStorage.getItem(WOMPI_PEDIDO_STORAGE_KEY);
      const transactionId = obtenerTransactionId(params);
      const token = localStorage.getItem("seve_token");

      if (!pedidoId) {
        if (activo) {
          setEstado("rechazado");
          setMensajeExtra("No encontramos un pedido asociado al retorno de Wompi.");
        }
        return;
      }

      try {
        let pedido = null;
        let estadoPago = "";

        if (token && transactionId) {
          for (let intento = 0; intento < 3; intento += 1) {
            const { data } = await axios.post(
              `${API_BASE}/pedidos/wompi/retorno`,
              { pedidoId, transactionId },
              { headers: { Authorization: `Bearer ${token}` }, timeout: 18000 }
            );
            pedido = data?.pedido || null;
            estadoPago = data?.estadoPago || estadoPago;
            if (estadoPago && estadoPago !== "PENDING") break;
            if (intento < 2) await esperar(2500);
          }
        } else if (token) {
          const { data } = await axios.get(`${API_BASE}/pedidos/${pedidoId}`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 12000,
          });
          pedido = data;
          estadoPago = data?.wompiEstado || estadoPago;
        }

        const vistaResultado = resolverVistaDesdePedido(pedido, estadoPago);
        if (!activo) return;

        setEstado(vistaResultado);

        if (vistaResultado === "aprobado" || vistaResultado === "pendiente") {
          vaciarCarrito();
          sessionStorage.removeItem(WOMPI_PEDIDO_STORAGE_KEY);
        }

        if (!pedido && !transactionId) {
          setMensajeExtra("Todavia no hay confirmacion del pago. Si acabas de pagar, espera unos segundos y vuelve a entrar.");
        }
      } catch (err) {
        if (!activo) return;
        const vistaFallback = resolverVistaDesdePedido(null, "");
        setEstado(vistaFallback === "cargando" ? "pendiente" : vistaFallback);
        setMensajeExtra(err?.response?.data?.error || "No fue posible sincronizar el pago con el servidor.");
      }
    }

    sincronizarResultado();

    return () => {
      activo = false;
    };
  }, []);

  const CONFIGS = {
    cargando: {
      icono: "...",
      titulo: "Verificando tu pago...",
      mensaje: "Estamos confirmando el estado de tu transaccion.",
      color: "#888",
      bg: "#f5f5f5",
    },
    aprobado: {
      icono: "OK",
      titulo: "Pago aprobado",
      mensaje: "Tu pedido fue confirmado y ya entro al flujo normal de preparacion.",
      color: "#2e7d32",
      bg: "#e8f5e9",
    },
    pendiente: {
      icono: "...",
      titulo: "Pago en proceso",
      mensaje: "Tu pago esta en revision o procesamiento. Te mostraremos el pedido en tu historial mientras Wompi termina de confirmarlo.",
      color: "#f57f17",
      bg: "#fff8e1",
    },
    rechazado: {
      icono: "X",
      titulo: "Pago no aprobado",
      mensaje: "Tu pago no pudo completarse. Puedes volver al carrito e intentarlo otra vez.",
      color: "#c0392b",
      bg: "#fce4e4",
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
        maxWidth: 540,
        width: "100%",
        border: `1px solid ${cfg.bg}`,
      }}>
        <div style={{ fontSize: 72, marginBottom: 20, lineHeight: 1 }}>
          {cfg.icono}
        </div>

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
          {estado === "cargando" ? "Verificando" : ""}
          {estado === "aprobado" ? "Aprobado" : ""}
          {estado === "pendiente" ? "En proceso" : ""}
          {estado === "rechazado" ? "Rechazado" : ""}
        </div>

        <h2 style={{
          color: "#1a1a1a",
          fontSize: 24,
          fontWeight: 700,
          margin: "0 0 12px",
        }}>
          {cfg.titulo}
        </h2>

        <p style={{
          color: "#666",
          fontSize: 15,
          lineHeight: 1.7,
          margin: "0 0 20px",
        }}>
          {cfg.mensaje}
        </p>

        {mensajeExtra && (
          <p style={{
            color: "#777",
            fontSize: 13,
            lineHeight: 1.6,
            margin: "0 0 28px",
          }}>
            {mensajeExtra}
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(estado === "aprobado" || estado === "pendiente") && (
            <>
              <button className="btn btn-primary" onClick={() => setVista("historial")}>
                Ver mis pedidos
              </button>
              <button className="btn btn-ghost" onClick={() => setVista("inicio")}>
                Volver al inicio
              </button>
            </>
          )}

          {estado === "rechazado" && (
            <>
              <button className="btn btn-primary" onClick={() => setVista("carrito")}>
                Intentar de nuevo
              </button>
              <button className="btn btn-ghost" onClick={() => setVista("inicio")}>
                Volver al inicio
              </button>
            </>
          )}

          {estado === "cargando" && (
            <button className="btn btn-ghost" onClick={() => setVista("inicio")}>
              Volver al inicio
            </button>
          )}
        </div>

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
