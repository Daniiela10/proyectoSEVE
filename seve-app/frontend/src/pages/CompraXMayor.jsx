const WHATSAPP_NUMERO = "573006429254";
const WHATSAPP_MENSAJE = "Hola, quiero hacer un pedido por mayor.";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MENSAJE)}`;

export default function CompraXMayor() {
  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "4rem 1.5rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: "rgba(37, 211, 102, 0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
        }}
      >
        <svg width="44" height="44" viewBox="0 0 32 32" fill="#25D366">
          <path d="M16 2C8.28 2 2 8.28 2 16c0 2.46.66 4.76 1.8 6.76L2 30l7.44-1.76A13.93 13.93 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm7.06 19.46c-.3.84-1.74 1.6-2.4 1.7-.62.1-1.4.14-2.26-.14-.52-.16-1.18-.38-2.04-.74-3.58-1.54-5.92-5.14-6.1-5.38-.18-.24-1.46-1.94-1.46-3.7s.92-2.62 1.26-2.98c.3-.32.66-.4.88-.4l.64.01c.2 0 .48-.08.74.56.3.7 1.02 2.46 1.1 2.64.1.18.16.38.04.62-.12.24-.18.38-.36.58-.18.2-.38.44-.54.6-.18.18-.36.36-.16.72.2.34.9 1.5 1.94 2.42 1.34 1.18 2.46 1.56 2.8 1.72.34.18.54.16.74-.08.2-.24.88-1.02 1.12-1.36.22-.34.46-.28.76-.16.3.1 1.9.9 2.22 1.06.34.18.56.26.64.4.08.16.08.9-.22 1.74z" />
        </svg>
      </div>

      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: 800,
          color: "#1a1a1a",
          margin: "0 0 12px",
        }}
      >
        Compra por Mayor
      </h1>

      <p
        style={{
          color: "#555",
          fontSize: "1.05rem",
          lineHeight: 1.6,
          margin: "0 0 32px",
        }}
      >
        ¿Deseas comprar al por mayor? Escríbenos directamente por WhatsApp y
        te ayudamos con tu pedido, precios y disponibilidad.
      </p>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "0.9rem 2rem",
          background: "#25D366",
          color: "#fff",
          fontWeight: 700,
          fontSize: "1rem",
          borderRadius: 50,
          textDecoration: "none",
          boxShadow: "0 6px 20px rgba(37,211,102,0.35)",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 10px 26px rgba(37,211,102,0.45)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,211,102,0.35)";
        }}
      >
        <svg width="22" height="22" viewBox="0 0 32 32" fill="currentColor">
          <path d="M16 2C8.28 2 2 8.28 2 16c0 2.46.66 4.76 1.8 6.76L2 30l7.44-1.76A13.93 13.93 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm7.06 19.46c-.3.84-1.74 1.6-2.4 1.7-.62.1-1.4.14-2.26-.14-.52-.16-1.18-.38-2.04-.74-3.58-1.54-5.92-5.14-6.1-5.38-.18-.24-1.46-1.94-1.46-3.7s.92-2.62 1.26-2.98c.3-.32.66-.4.88-.4l.64.01c.2 0 .48-.08.74.56.3.7 1.02 2.46 1.1 2.64.1.18.16.38.04.62-.12.24-.18.38-.36.58-.18.2-.38.44-.54.6-.18.18-.36.36-.16.72.2.34.9 1.5 1.94 2.42 1.34 1.18 2.46 1.56 2.8 1.72.34.18.54.16.74-.08.2-.24.88-1.02 1.12-1.36.22-.34.46-.28.76-.16.3.1 1.9.9 2.22 1.06.34.18.56.26.64.4.08.16.08.9-.22 1.74z" />
        </svg>
        Contactar por WhatsApp
      </a>

      <p style={{ marginTop: 20, fontSize: "0.85rem", color: "#999" }}>
        {WHATSAPP_NUMERO}
      </p>
    </div>
  );
}
