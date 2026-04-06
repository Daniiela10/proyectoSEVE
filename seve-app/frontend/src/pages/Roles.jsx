import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";

const ROLES_DISPONIBLES = [
  { value: "cliente", label: "Cliente" },
  { value: "empleado", label: "Empleado" },
  { value: "admin", label: "Admin" },
];

export default function Roles() {
  const { usuario, obtenerUsuarios, actualizarRolUsuario, actualizarUsuarioAdmin } = useApp();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState("");
  const [cambiosPendientes, setCambiosPendientes] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState("");
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [emailEditando, setEmailEditando] = useState("");

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    try {
      setCargando(true);
      setMensaje("");
      const data = await obtenerUsuarios();
      setUsuarios(data);
    } catch (err) {
      setMensaje(err?.response?.data?.error || "No se pudieron cargar los usuarios");
      setMensajeTipo("error");
    } finally {
      setCargando(false);
    }
  }

  async function manejarCambioRol(usuarioId, nuevoRol) {
    try {
      setGuardandoId(usuarioId);
      setMensaje("");
      const { usuario: usuarioActualizado, mensaje: mensajeRespuesta } = await actualizarRolUsuario(usuarioId, nuevoRol);
      setUsuarios((prev) => prev.map((item) => item._id === usuarioId ? usuarioActualizado : item));
      setCambiosPendientes((prev) => {
        const siguientes = { ...prev };
        delete siguientes[usuarioId];
        return siguientes;
      });
      setMensaje(mensajeRespuesta || "Rol actualizado correctamente");
      setMensajeTipo("ok");
    } catch (err) {
      setMensaje(err?.response?.data?.error || "No se pudo actualizar el rol");
      setMensajeTipo("error");
    } finally {
      setGuardandoId("");
    }
  }

  function seleccionarRolPendiente(usuarioId, nuevoRol) {
    setCambiosPendientes((prev) => ({
      ...prev,
      [usuarioId]: nuevoRol,
    }));
  }

  function cancelarCambioRol(usuarioId) {
    setCambiosPendientes((prev) => {
      const siguientes = { ...prev };
      delete siguientes[usuarioId];
      return siguientes;
    });
  }

  async function confirmarCambioRol(usuarioId) {
    const nuevoRol = cambiosPendientes[usuarioId];
    if (!nuevoRol) return;

    try {
      await manejarCambioRol(usuarioId, nuevoRol);
    } catch {}
  }

  function abrirModalEdicion(item) {
    setUsuarioEditando(item);
    setEmailEditando(item.email || "");
  }

  function cerrarModalEdicion() {
    setUsuarioEditando(null);
    setEmailEditando("");
  }

  async function guardarEdicionUsuario(e) {
    e.preventDefault();
    if (!usuarioEditando) return;

    try {
      setGuardandoId(usuarioEditando._id);
      setMensaje("");
      const { usuario: usuarioActualizado, mensaje: mensajeRespuesta } = await actualizarUsuarioAdmin(usuarioEditando._id, {
        email: emailEditando,
      });
      setUsuarios((prev) => prev.map((item) => item._id === usuarioEditando._id ? usuarioActualizado : item));
      setMensaje(mensajeRespuesta || "Usuario actualizado correctamente");
      setMensajeTipo("ok");
      cerrarModalEdicion();
    } catch (err) {
      setMensaje(err?.response?.data?.error || "No se pudo actualizar el usuario");
      setMensajeTipo("error");
    } finally {
      setGuardandoId("");
    }
  }

  const usuariosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return usuarios;

    return usuarios.filter((item) =>
      item.nombre?.toLowerCase().includes(termino) ||
      item.email?.toLowerCase().includes(termino) ||
      item.rol?.toLowerCase().includes(termino)
    );
  }, [usuarios, busqueda]);

  if (!usuario?.esAdmin) {
    return (
      <div className="roles-vista">
        <h1 className="titulo-vista">Roles</h1>
        <div className="roles-vacio">No tienes permisos para ver esta seccion.</div>
      </div>
    );
  }

  return (
    <div className="roles-vista">
      <div className="roles-header">
        <div>
          <h1 className="titulo-vista">Roles</h1>
          <p className="roles-desc">
            Aqui puedes ver todos los usuarios registrados y asignarles rol de admin o empleado.
          </p>
        </div>
        <input
          type="text"
          className="roles-busqueda"
          placeholder="Buscar por nombre, correo o rol"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {mensaje && (
        <div className={`roles-mensaje ${mensajeTipo === "error" ? "error" : "ok"}`}>
          {mensaje}
        </div>
      )}

      {cargando ? (
        <div className="roles-vacio">Cargando usuarios...</div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="roles-vacio">No se encontraron usuarios con ese criterio.</div>
      ) : (
        <div className="roles-grid">
          {usuariosFiltrados.map((item) => (
            <div key={item._id} className="roles-card">
              <div className="roles-card-top">
                <div>
                  <h3>{item.nombre || "Usuario sin nombre"}</h3>
                  <p>{item.email}</p>
                </div>
                <span className={`roles-badge roles-badge-${item.rol}`}>
                  {item.rol}
                </span>
              </div>

              <div className="roles-meta">
                <span>{item.isVerified ? "Correo verificado" : "Correo pendiente"}</span>
                <span>Registrado: {new Date(item.createdAt).toLocaleDateString("es-CO")}</span>
              </div>

              <button
                type="button"
                className="roles-btn roles-btn-cancelar"
                onClick={() => abrirModalEdicion(item)}
              >
                Editar usuario
              </button>

              <label className="roles-label" htmlFor={`rol-${item._id}`}>
                Asignar rol
              </label>
              <select
                id={`rol-${item._id}`}
                className="roles-select"
                value={cambiosPendientes[item._id] ?? item.rol}
                disabled={guardandoId === item._id}
                onChange={(e) => seleccionarRolPendiente(item._id, e.target.value)}
              >
                {ROLES_DISPONIBLES.map((rol) => (
                  <option key={rol.value} value={rol.value}>
                    {rol.label}
                  </option>
                ))}
              </select>

              {cambiosPendientes[item._id] && cambiosPendientes[item._id] !== item.rol && (
                <div className="roles-acciones">
                  <button
                    type="button"
                    className="roles-btn roles-btn-aceptar"
                    disabled={guardandoId === item._id}
                    onClick={() => confirmarCambioRol(item._id)}
                  >
                    Aceptar
                  </button>
                  <button
                    type="button"
                    className="roles-btn roles-btn-cancelar"
                    disabled={guardandoId === item._id}
                    onClick={() => cancelarCambioRol(item._id)}
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {guardandoId === item._id && (
                <p className="roles-guardando">Guardando cambio...</p>
              )}
            </div>
          ))}
        </div>
      )}

      {usuarioEditando && (
        <div className="modal">
          <div className="modal-backdrop" onClick={cerrarModalEdicion} />
          <div className="modal-box admin-producto-modal">
            <button className="modal-cerrar" onClick={cerrarModalEdicion}>&times;</button>
            <form className="admin-producto-form admin-producto-form-modal" onSubmit={guardarEdicionUsuario}>
              <div className="admin-producto-form-header">
                <h2>Editar usuario</h2>
              </div>

              <div className="roles-meta" style={{ marginBottom: "1rem" }}>
                <span>{usuarioEditando.nombre}</span>
                <span>Rol actual: {usuarioEditando.rol}</span>
              </div>

              <div>
                <label className="roles-label">Correo</label>
                <input
                  type="email"
                  className="roles-select admin-input"
                  value={emailEditando}
                  onChange={(e) => setEmailEditando(e.target.value)}
                />
              </div>

              <p className="historial-desc" style={{ marginTop: "1rem" }}>
                El correo se actualiza de inmediato y al nuevo email se enviara un enlace para gestionar el acceso.
              </p>

              <div className="admin-producto-form-actions">
                <button type="button" className="btn btn-ghost" onClick={cerrarModalEdicion}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={guardandoId === usuarioEditando._id}>
                  {guardandoId === usuarioEditando._id ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
