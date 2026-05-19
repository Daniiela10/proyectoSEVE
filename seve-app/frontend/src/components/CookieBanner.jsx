import { useState, useEffect } from "react";

const COOKIE_NAME = "seve_cookie_consent";
const MESES = 6;

function setCookie(name, value, months) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const match = document.cookie.split("; ").find((row) => row.startsWith(name + "="));
  return match ? match.split("=")[1] : null;
}

export default function CookieBanner({ onVerPolitica }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getCookie(COOKIE_NAME)) {
      setTimeout(() => setVisible(true), 800);
    }
  }, []);

  function aceptar() {
    setCookie(COOKIE_NAME, "accepted", MESES);
    setVisible(false);
  }

  function rechazar() {
    setCookie(COOKIE_NAME, "rejected", MESES);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.banner}>
        <div style={styles.iconWrap}>🍪</div>
        <div style={styles.body}>
          <p style={styles.titulo}>Usamos cookies</p>
          <p style={styles.texto}>
            Utilizamos cookies propias y de terceros para mejorar tu experiencia de navegación.
            Puedes conocer más en nuestra{" "}
            <button type="button" style={styles.link} onClick={onVerPolitica}>
              Política de Cookies
            </button>
            .
          </p>
        </div>
        <div style={styles.botones}>
          <button type="button" style={styles.btnRechazar} onClick={rechazar}>
            Rechazar
          </button>
          <button type="button" style={styles.btnAceptar} onClick={aceptar}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    padding: "16px",
    display: "flex",
    justifyContent: "center",
    pointerEvents: "none",
  },
  banner: {
    background: "#000000",
    color: "#fff",
    borderRadius: "14px",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    maxWidth: "720px",
    width: "100%",
    boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
    border: "1.5px solid #C0602A",
    pointerEvents: "all",
    flexWrap: "wrap",
  },
  iconWrap: {
    fontSize: "28px",
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: "200px",
  },
  titulo: {
    margin: "0 0 4px 0",
    fontWeight: "700",
    fontSize: "15px",
    fontFamily: "sans-serif",
  },
  texto: {
    margin: 0,
    fontSize: "13px",
    color: "rgba(255,255,255,0.75)",
    lineHeight: "1.5",
    fontFamily: "sans-serif",
  },
  link: {
    background: "none",
    border: "none",
    color: "#f8284b",
    cursor: "pointer",
    padding: 0,
    fontSize: "13px",
    fontFamily: "sans-serif",
    textDecoration: "underline",
  },
  botones: {
    display: "flex",
    gap: "10px",
    flexShrink: 0,
  },
  btnRechazar: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "rgba(255,255,255,0.8)",
    borderRadius: "8px",
    padding: "9px 18px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "sans-serif",
    fontWeight: "500",
  },
  btnAceptar: {
    background: "#c41e3a",
    border: "none",
    color: "#fff",
    borderRadius: "8px",
    padding: "9px 18px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "sans-serif",
    fontWeight: "600",
  },
};
