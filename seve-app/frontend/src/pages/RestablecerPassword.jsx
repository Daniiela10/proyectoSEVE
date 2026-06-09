import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import PasswordInput from "@/components/PasswordInput";

export default function RestablecerPassword() {
  const { setVista, resetPassword } = useApp();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!token) {
      setError("No se encontro el token de recuperacion.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    try {
      const data = await resetPassword(token, password);
      setMensaje(data.mensaje || "Contraseña actualizada correctamente.");
    } catch (err) {
      setError(err.response?.data?.error || "No fue posible restablecer la contraseña.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: 460, padding: "40px 32px", background: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ color: "#1a1a1a", marginBottom: 10 }}>Restablecer contraseña</h2>
          <p style={{ color: "#666", lineHeight: 1.6 }}>
            Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Nueva contraseña</label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nueva contraseña"
            minLength={6}
            required
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #ddd" }}
          />

          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Confirmar contraseña</label>
          <PasswordInput
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="Confirma tu contraseña"
            minLength={6}
            required
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #ddd" }}
          />

          {mensaje && <p style={{ color: "#1f7a1f", fontSize: 14, marginBottom: 12 }}>{mensaje}</p>}
          {error && <p style={{ color: "#c0392b", fontSize: 14, marginBottom: 12 }}>{error}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={cargando}>
            {cargando ? "Actualizando..." : "Guardar nueva contraseña"}
          </button>
        </form>

        <button
          className="btn btn-ghost btn-block"
          style={{ marginTop: 12 }}
          onClick={() => {
            setVista("login");
            window.history.pushState({}, "", "/");
          }}
        >
          Volver a iniciar sesion
        </button>
      </div>
    </div>
  );
}
