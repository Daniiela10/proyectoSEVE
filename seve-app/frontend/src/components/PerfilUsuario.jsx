import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useApp } from "../context/AppContext";
import { API_BASE } from "@/config";
import { subirImagen, comprimirImagen } from "@/utils/subirImagen";
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
  const [foto, setFoto] = useState(null);
  const [menuFotoAbierto, setMenuFotoAbierto] = useState(false);
  const inputFotoRef = useRef(null);
  const menuFotoRef = useRef(null);

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
      setFoto(usuario.fotoPerfil || null);
      setPendingEmail(usuario.pendingEmail || "");
    }
  }, [usuario]);

  useEffect(() => {
    function handleClickFuera(e) {
      if (menuFotoRef.current && !menuFotoRef.current.contains(e.target)) {
        setMenuFotoAbierto(false);
      }
    }
    if (menuFotoAbierto) document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, [menuFotoAbierto]);

  function handleAvatarClick() {
    if (foto) {
      setMenuFotoAbierto((v) => !v);
    } else {
      inputFotoRef.current?.click();
    }
  }

  async function handleFotoChange(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    e.target.value = "";
    setMenuFotoAbierto(false);
    const base64 = await comprimirImagen(archivo, 400, 0.80);
    setFoto(base64);
    try {
      const url = await subirImagen(base64, "seve-perfiles");
      setFoto(url);
    } catch { /* queda el preview base64 */ }
  }

  function handleEliminarFoto() {
    setFoto(null);
    setMenuFotoAbierto(false);
  }

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
            fotoPerfil: foto,
          }
        : { ...formData, fotoPerfil: foto };

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
        <div className="perfil-avatar-wrap" ref={menuFotoRef}>
          <button
            type="button"
            className="perfil-avatar-btn"
            onClick={handleAvatarClick}
            title={foto ? "Cambiar foto de perfil" : "Agregar foto de perfil"}
          >
            {foto ? (
              <img src={foto} alt="Foto de perfil" className="perfil-avatar-img" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.349a.75.75 0 01-.437-.695z" clipRule="evenodd" />
              </svg>
            )}
            {!foto && (
              <span className="perfil-avatar-camara">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
                  <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3h-15a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0zm12-1.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </button>

          {menuFotoAbierto && (
            <div className="perfil-foto-menu">
              <button
                type="button"
                className="perfil-foto-menu-item"
                onClick={() => { inputFotoRef.current?.click(); setMenuFotoAbierto(false); }}
              >
                Cambiar foto
              </button>
              <button
                type="button"
                className="perfil-foto-menu-item perfil-foto-menu-item--eliminar"
                onClick={handleEliminarFoto}
              >
                Eliminar foto
              </button>
            </div>
          )}

          <input
            ref={inputFotoRef}
            type="file"
            accept="image/*"
            onChange={handleFotoChange}
            style={{ display: "none" }}
          />
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
                  placeholder="Tu número de telefono"
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
