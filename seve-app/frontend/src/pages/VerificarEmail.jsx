import { useEffect, useState } from "react";
import axios from "axios";
import { useApp } from "@/context/AppContext";
import { API_BASE } from "@/config";

export default function VerificarEmail() {
  const { setVista, verificarEmail, reenviarCodigoVerificacion } = useApp();
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [verificado, setVerificado] = useState(false);
  const [modoToken, setModoToken] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    const tokenParam = params.get("token");
    if (emailParam) setEmail(emailParam);

    if (!tokenParam) return;

    setModoToken(true);
    setCargando(true);
    axios.get(`${API_BASE}/auth/verificar-email?token=${encodeURIComponent(tokenParam)}`)
      .then(({ data }) => {
        setVerificado(true);
        setMensaje(data.mensaje);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "No fue posible verificar el correo.");
      })
      .finally(() => {
        setCargando(false);
      });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);

    try {
      const data = await verificarEmail(email, codigo);
      setVerificado(true);
      setMensaje(data.mensaje);
    } catch (err) {
      setError(err.response?.data?.error || "No fue posible verificar el correo.");
    } finally {
      setCargando(false);
    }
  }

  async function handleReenviar() {
    setError("");
    setMensaje("");
    setReenviando(true);

    try {
      const data = await reenviarCodigoVerificacion(email);
      setMensaje(data.mensaje);
    } catch (err) {
      setError(err.response?.data?.error || "No fue posible reenviar el codigo.");
    } finally {
      setReenviando(false);
    }
  }

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: 460, padding: "40px 32px", background: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{verificado ? "Listo" : "Codigo"}</div>
          <h2 style={{ color: "#1a1a1a", marginBottom: 10 }}>{verificado ? "Correo verificado" : "Verifica tu correo"}</h2>
          <p style={{ color: "#666", lineHeight: 1.6 }}>
            {verificado
              ? mensaje
              : "Ingresa el codigo de 6 digitos que enviamos a tu correo para activar tu cuenta."}
          </p>
        </div>

        {!verificado && !modoToken ? (
          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #ddd", marginBottom: 16 }}
            />

            <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Codigo</label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              required
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #ddd", marginBottom: 16, fontSize: 24, letterSpacing: 8, textAlign: "center" }}
            />

            {mensaje && <p style={{ color: "#1f7a1f", fontSize: 14, marginBottom: 12 }}>{mensaje}</p>}
            {error && <p style={{ color: "#c0392b", fontSize: 14, marginBottom: 12 }}>{error}</p>}

            <button type="submit" className="btn btn-primary btn-block" disabled={cargando}>
              {cargando ? "Verificando..." : "Verificar cuenta"}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={handleReenviar}
              disabled={reenviando || !email}
              style={{ marginTop: 12 }}
            >
              {reenviando ? "Reenviando..." : "Reenviar codigo"}
            </button>
          </form>
        ) : (
          <button
            className="btn btn-primary btn-block"
            disabled={cargando}
            onClick={() => {
              setVista("login");
              window.history.pushState({}, "", "/");
            }}
          >
            {cargando ? "Verificando..." : "Ir a iniciar sesion"}
          </button>
        )}
      </div>
    </div>
  );
}
