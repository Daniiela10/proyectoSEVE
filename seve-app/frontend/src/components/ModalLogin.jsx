import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function ModalLogin() {
  const { vista, setVista, login, registro } = useApp();
  const [modo, setModo] = useState("login"); // "login" | "registro"
  const [form, setForm] = useState({ nombres: "", apellidos: "", email: "", password: "", password2: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  if (vista !== "login") return null;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await login(form.email, form.password);
      setVista("inicio");
    } catch (err) {
      setError(err.response?.data?.error || "Error al iniciar sesión");
    } finally {
      setCargando(false);
    }
  }

  async function handleRegistro(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.password2) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setCargando(true);
    try {
      await registro(form.nombres, form.apellidos, form.email, form.password);
      setVista("inicio");
    } catch (err) {
      setError(err.response?.data?.error || "Error al registrarse");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={() => setVista("inicio")} />
      <div className="modal-box modal-auth">
        <button className="modal-cerrar" onClick={() => setVista("inicio")}>&times;</button>

        {modo === "login" ? (
          <>
            <h2>Iniciar sesión</h2>
            <form onSubmit={handleLogin}>
              <label>Usuario o correo</label>
              <input type="email" value={form.email} onChange={set("email")} required placeholder="tu@email.com" />
              <label>Contraseña</label>
              <input type="password" value={form.password} onChange={set("password")} required placeholder="Contraseña" />
              {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}
              <button type="submit" className="btn btn-primary btn-block" disabled={cargando}>
                {cargando ? "Entrando..." : "Iniciar sesión"}
              </button>
            </form>
            <p className="auth-switch">¿No tienes cuenta? <a href="#" onClick={() => { setModo("registro"); setError(""); }}>Registrarse</a></p>
          </>
        ) : (
          <>
            <h2>Registrarse</h2>
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
              <input type="password" value={form.password} onChange={set("password")} required placeholder="Contraseña" minLength={6} />
              <label>Repetir contraseña</label>
              <input type="password" value={form.password2} onChange={set("password2")} required placeholder="Repetir contraseña" minLength={6} />
              {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}
              <button type="submit" className="btn btn-primary btn-block" disabled={cargando}>
                {cargando ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </form>
            <p className="auth-switch">¿Ya tienes cuenta? <a href="#" onClick={() => { setModo("login"); setError(""); }}>Iniciar sesión</a></p>
          </>
        )}
      </div>
    </div>
  );
}
