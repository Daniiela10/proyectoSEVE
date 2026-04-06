import { useState, useEffect } from "react";
import axios from "axios";
import { useApp } from "../context/AppContext";
import { API_BASE } from "@/config";
import "./PerfilUsuario.css";

export default function PerfilUsuario() {
  const { usuario, actualizarPerfil, verificarCambioEmail, reenviarCambioEmail } = useApp();
  const [formData, setFormData] = useState({
    telefono: "",
    direccion: "",
    barrio: "",
    ciudad: "",
    municipio: "",
    nombres: "",
    apellidos: "",
    email: ""
  });
  const [departamentos, setDepartamentos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("success");
  const [ubicacionesError, setUbicacionesError] = useState("");
  const [codigoEmail, setCodigoEmail] = useState("");
  const [verificandoEmail, setVerificandoEmail] = useState(false);
  const [reenviandoCodigo, setReenviandoCodigo] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const esAdmin = Boolean(usuario?.esAdmin || usuario?.rol === "admin");

  useEffect(() => {
    axios.get(`${API_BASE}/ubicaciones/departamentos`)
      .then(({ data }) => {
        setDepartamentos(data);
        setUbicacionesError("");
      })
      .catch(() => {
        setUbicacionesError("No fue posible cargar departamentos y municipios.");
      });
  }, []);

  useEffect(() => {
    if (usuario) {
      setFormData({
        telefono: usuario.telefono || "",
        direccion: usuario.direccion || "",
        barrio: usuario.barrio || "",
        ciudad: usuario.ciudad || "",
        municipio: usuario.municipio || "",
        nombres: usuario.nombres || "",
        apellidos: usuario.apellidos || "",
        email: usuario.email || ""
      });
      setPendingEmail(usuario.pendingEmail || "");
    }
  }, [usuario]);

  const municipiosDisponibles = formData.ciudad
    ? (departamentos.find((depto) => depto.nombre === formData.ciudad)?.ciudades || [])
    : [];

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleDepartamentoChange(e) {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, ciudad: value, municipio: "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    setMensaje("");
    setTipoMensaje("success");
    try {
      const payload = esAdmin
        ? {
            nombres: formData.nombres,
            apellidos: formData.apellidos,
            email: formData.email,
          }
        : formData;

      const data = await actualizarPerfil(payload);
      setPendingEmail(data.pendingEmail || "");
      setMensaje(data.mensaje || "Datos guardados correctamente");
      setTipoMensaje("success");
      if (!data.emailChangePending) {
        setCodigoEmail("");
      }
      setTimeout(() => setMensaje(""), 4000);
    } catch (err) {
      setTipoMensaje("error");
      setMensaje(err.response?.data?.error || "Error al guardar los datos");
    }
    setGuardando(false);
  }

  async function handleVerificarEmail(e) {
    e.preventDefault();
    setVerificandoEmail(true);
    setMensaje("");
    setTipoMensaje("success");
    try {
      const data = await verificarCambioEmail(codigoEmail);
      setPendingEmail("");
      setCodigoEmail("");
      setFormData(prev => ({ ...prev, email: data.email || prev.email }));
      setMensaje(data.mensaje || "Correo actualizado correctamente");
      setTipoMensaje("success");
      setTimeout(() => setMensaje(""), 4000);
    } catch (err) {
      setTipoMensaje("error");
      setMensaje(err.response?.data?.error || "No fue posible verificar el nuevo correo");
    }
    setVerificandoEmail(false);
  }

  async function handleReenviarCodigo() {
    setReenviandoCodigo(true);
    setMensaje("");
    setTipoMensaje("success");
    try {
      const data = await reenviarCambioEmail();
      setMensaje(data.mensaje || "Te enviamos un nuevo codigo al correo pendiente.");
      setTipoMensaje("success");
      setTimeout(() => setMensaje(""), 4000);
    } catch (err) {
      setTipoMensaje("error");
      setMensaje(err.response?.data?.error || "No fue posible reenviar el codigo");
    }
    setReenviandoCodigo(false);
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
          <h3>Informacion Personal</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="email">Correo Electronico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Tu correo electronico"
              />
            </div>
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
            {!esAdmin && (
              <div className="form-group">
                <label htmlFor="telefono">Telefono</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="Tu numero de telefono"
                />
              </div>
            )}
          </div>
        </div>

        {!esAdmin && (
          <div className="perfil-section">
            <h3>Direccion de Entrega</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="direccion">Direccion</label>
                <input
                  type="text"
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Calle, numero, apartamento, etc."
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
                <label htmlFor="ciudad">Departamento</label>
                <select
                  id="ciudad"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleDepartamentoChange}
                >
                  <option value="">Selecciona un departamento</option>
                  {departamentos.map((depto) => (
                    <option key={depto.nombre} value={depto.nombre}>{depto.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="municipio">Municipio</label>
                <select
                  id="municipio"
                  name="municipio"
                  value={formData.municipio}
                  onChange={handleChange}
                  disabled={!formData.ciudad}
                >
                  <option value="">Selecciona un municipio</option>
                  {municipiosDisponibles.map((municipio) => (
                    <option key={municipio} value={municipio}>{municipio}</option>
                  ))}
                </select>
              </div>
            </div>
            {ubicacionesError && <p className="mensaje error">{ubicacionesError}</p>}
          </div>
        )}

        {pendingEmail && (
          <div className="perfil-section">
            <h3>Verificar Nuevo Correo</h3>
            <p className="perfil-helper">
              Enviamos un codigo de 6 digitos a <strong>{pendingEmail}</strong>. El correo actual no cambiara hasta que lo verifiques.
            </p>
            <div className="form-grid perfil-verificacion-grid">
              <div className="form-group">
                <label htmlFor="codigoEmail">Codigo de verificacion</label>
                <input
                  type="text"
                  id="codigoEmail"
                  value={codigoEmail}
                  onChange={(e) => setCodigoEmail(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                />
              </div>
            </div>
            <div className="perfil-actions perfil-actions-inline">
              <button type="button" className="btn btn-primary" onClick={handleVerificarEmail} disabled={verificandoEmail || codigoEmail.length !== 6}>
                {verificandoEmail ? "Verificando..." : "Verificar correo"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={handleReenviarCodigo} disabled={reenviandoCodigo}>
                {reenviandoCodigo ? "Reenviando..." : "Reenviar codigo"}
              </button>
            </div>
          </div>
        )}

        <div className="perfil-actions">
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar Cambios"}
          </button>
          {mensaje && (
            <span className={`mensaje ${tipoMensaje}`}>
              {mensaje}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
