import { useState } from "react";
import { useApp } from "@/context/AppContext";
import PasswordInput from "@/components/PasswordInput";

export default function ModalLogin() {
  const { vista, setVista, login, registro, forgotPassword } = useApp();
  const [modo, setModo] = useState("login");
  const [form, setForm] = useState({ nombres: "", apellidos: "", email: "", password: "", password2: "" });
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  if (vista !== "login") return null;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);
    try {
      const data = await login(form.email, form.password);
      setVista(data?.esAdmin ? "gestion-pedidos" : "inicio");
    } catch (err) {
      setError(err.response?.data?.error || "Error al iniciar sesion");
    } finally {
      setCargando(false);
    }
  }

  async function handleRegistro(e) {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (form.password !== form.password2) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setCargando(true);
    try {
      const data = await registro(form.nombres, form.apellidos, form.email, form.password);
      window.history.pushState({}, "", `/verificar-email?email=${encodeURIComponent(data.email || form.email)}`);
      setVista("verificar-email");
    } catch (err) {
      setError(err.response?.data?.error || "Error al registrarse");
    } finally {
      setCargando(false);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);
    try {
      const data = await forgotPassword(form.email);
      setMensaje(data.mensaje || "Si el correo existe, enviaremos un enlace para restablecer la contraseña.");
    } catch (err) {
      setError(
        err.code === "ECONNABORTED"
          ? "El servidor tardo demasiado enviando el correo. Intenta de nuevo en unos segundos."
          : err.response?.data?.error || "No fue posible procesar la solicitud"
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={() => setVista("inicio")} />
      <div className="modal-box modal-auth">
        <button className="modal-cerrar" onClick={() => setVista("inicio")}>×</button>

        {modo === "login" ? (
          <>
            <h2>Iniciar sesion</h2>
            <form onSubmit={handleLogin}>
              <label>Usuario o correo</label>
              <input type="email" value={form.email} onChange={set("email")} required placeholder="tu@email.com" />
              <label>Contraseña</label>
              <PasswordInput value={form.password} onChange={set("password")} required placeholder="Contraseña" />
              {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}
              {mensaje && <p style={{ color: "#1f7a1f", fontSize: 13 }}>{mensaje}</p>}
              <button type="submit" className="btn btn-primary btn-block" disabled={cargando}>
                {cargando ? "Entrando..." : "Iniciar sesion"}
              </button>
            </form>
            <p className="auth-switch"><a href="#" onClick={(e) => { e.preventDefault(); setModo("forgot"); setError(""); setMensaje(""); }}>Olvide mi contraseña</a></p>
            <p className="auth-switch">No tienes cuenta? <a href="#" onClick={(e) => { e.preventDefault(); setModo("registro"); setError(""); setMensaje(""); }}>Registrarse</a></p>
          </>
        ) : modo === "forgot" ? (
          <>
            <h2>Recuperar contraseña</h2>
            <p style={{ color: "#555", lineHeight: 1.6, fontSize: 14, marginBottom: 16 }}>
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <form onSubmit={handleForgotPassword}>
              <label>Correo</label>
              <input type="email" value={form.email} onChange={set("email")} required placeholder="tu@email.com" />
              {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}
              {mensaje && <p style={{ color: "#1f7a1f", fontSize: 13 }}>{mensaje}</p>}
              <button type="submit" className="btn btn-primary btn-block" disabled={cargando}>
                {cargando ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>
            <p className="auth-switch">Volver a <a href="#" onClick={(e) => { e.preventDefault(); setModo("login"); setError(""); setMensaje(""); }}>Iniciar sesion</a></p>
          </>
        ) : (
          <>
            <h2>Registrarse</h2>
            <p style={{ color: "#555", lineHeight: 1.6, fontSize: 14, marginBottom: 16 }}>
              Al crear tu cuenta te enviaremos un codigo de 6 digitos al correo para verificarla.
            </p>
            <form onSubmit={handleRegistro}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label>Nombres</label>
                  <input type="text" value={form.nombres} onChange={set("nombres")} required placeholder="Tus nombres" />
                </div>
                <div>
                  <label>Apellidos</label>
                  <input type="text" value={form.apellidos} onChange={set("apellidos")} required placeholder="Tus apellidos" />
                </div>
              </div>
              <label>Correo</label>
              <input type="email" value={form.email} onChange={set("email")} required placeholder="tu@email.com" />
              <label>Contraseña</label>
              <PasswordInput value={form.password} onChange={set("password")} required placeholder="Contraseña" minLength={6} />
              <label>Repetir contraseña</label>
              <PasswordInput value={form.password2} onChange={set("password2")} required placeholder="Repetir contraseña" minLength={6} />
              {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}
              <button type="submit" className="btn btn-primary btn-block" disabled={cargando}>
                {cargando ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </form>
            <p className="auth-switch">Ya tienes cuenta? <a href="#" onClick={(e) => { e.preventDefault(); setModo("login"); setError(""); setMensaje(""); }}>Iniciar sesion</a></p>
          </>
        )}
      </div>
    </div>
  );
}

