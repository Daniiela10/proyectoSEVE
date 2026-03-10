import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import "./PerfilUsuario.css";

export default function PerfilUsuario() {
  const { usuario, actualizarPerfil } = useApp();
  const [formData, setFormData] = useState({
    telefono: "",
    direccion: "",
    barrio: "",
    ciudad: "",
    municipio: "",
    nombres: "",
    apellidos: ""
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (usuario) {
      setFormData({
        telefono: usuario.telefono || "",
        direccion: usuario.direccion || "",
        barrio: usuario.barrio || "",
        ciudad: usuario.ciudad || "",
        municipio: usuario.municipio || "",
        nombres: usuario.nombres || "",
        apellidos: usuario.apellidos || ""
      });
    }
  }, [usuario]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    setMensaje("");
    try {
      await actualizarPerfil(formData);
      setMensaje("Datos guardados correctamente");
      setTimeout(() => setMensaje(""), 3000);
    } catch (err) {
      setMensaje("Error al guardar los datos");
    }
    setGuardando(false);
  }

  if (!usuario) return null;

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <div className="perfil-avatar">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.349a.75.75 0 01-.437-.695z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="perfil-info">
          <h2>Mi Cuenta</h2>
          <p className="perfil-email">{usuario.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="perfil-form">
        <div className="perfil-section">
          <h3>Información Personal</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="nombres">Nombres</label>
              <input
                type="text"
                id="nombres"
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                placeholder="Tus nombres"
              />
            </div>
            <div className="form-group">
              <label htmlFor="apellidos">Apellidos</label>
              <input
                type="text"
                id="apellidos"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                placeholder="Tus apellidos"
              />
            </div>
            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Tu número de teléfono"
              />
            </div>
          </div>
        </div>

        <div className="perfil-section">
          <h3>Dirección de Entrega</h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="direccion">Dirección</label>
              <input
                type="text"
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Calle, número, apartamento, etc."
              />
            </div>
            <div className="form-group">
              <label htmlFor="barrio">Barrio</label>
              <input
                type="text"
                id="barrio"
                name="barrio"
                value={formData.barrio}
                onChange={handleChange}
                placeholder="Tu barrio"
              />
            </div>
            <div className="form-group">
              <label htmlFor="ciudad">Ciudad</label>
              <input
                type="text"
                id="ciudad"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                placeholder="Tu ciudad"
              />
            </div>
            <div className="form-group">
              <label htmlFor="municipio">Municipio</label>
              <input
                type="text"
                id="municipio"
                name="municipio"
                value={formData.municipio}
                onChange={handleChange}
                placeholder="Tu municipio"
              />
            </div>
          </div>
        </div>

        <div className="perfil-actions">
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar Cambios"}
          </button>
          {mensaje && (
            <span className={`mensaje ${mensaje.includes("Error") ? "error" : "success"}`}>
              {mensaje}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

