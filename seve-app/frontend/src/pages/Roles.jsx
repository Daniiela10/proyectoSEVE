import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import "./GestionPedidos.css";

const ROLES_DISPONIBLES = [
  { value: "cliente", label: "Cliente" },
  { value: "empleado", label: "Empleado" },
  { value: "admin", label: "Admin" },
];

const ROL_BADGE = {
  cliente: { cls: "gp-badge gp-badge--cancelado", label: "Cliente" },
  empleado: { cls: "gp-badge gp-badge--espera", label: "Empleado" },
  admin: { cls: "gp-badge gp-badge--despachado", label: "Admin" },
};

function BadgeRol({ rol }) {
  const cfg = ROL_BADGE[rol] || { cls: "gp-badge", label: rol || "Sin rol" };
  return <span className={cfg.cls}>{cfg.label}</span>;
}

function nombreCompletoUsuario(item) {
  const desdeNombres = [item?.nombres, item?.apellidos].filter(Boolean).join(" ").trim();
  return desdeNombres || item?.nombre || "Usuario sin nombre";
}

export default function Roles() {
  const { usuario, obtenerUsuarios, actualizarRolUsuario, actualizarUsuarioAdmin } = useApp();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState("");
  const [cambiosPendientes, setCambiosPendientes] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
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

  function confirmarCambioRol(usuarioId) {
    const nuevoRol = cambiosPendientes[usuarioId];
    if (!nuevoRol) return;
    manejarCambioRol(usuarioId, nuevoRol);
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

    return usuarios.filter((item) => {
      const nombre = nombreCompletoUsuario(item).toLowerCase();
      const email = String(item.email || "").toLowerCase();
      const rol = String(item.rol || "").toLowerCase();
      const id = String(item._id || "").toLowerCase();
      const coincideBusqueda = !termino || nombre.includes(termino) || email.includes(termino) || rol.includes(termino) || id.includes(termino);
      const coincideRol = filtroRol === "todos" || item.rol === filtroRol;
      return coincideBusqueda && coincideRol;
    });
  }, [usuarios, busqueda, filtroRol]);

  if (!usuario?.esAdmin) {
    return (
      <div className="roles-vista">
        <h1 className="titulo-vista">Roles</h1>
        <div className="gp-vacio">No tienes permisos para ver esta seccion.</div>
      </div>
    );
  }

  return (
    <div className="roles-vista">
      <div className="gp-header">
        <div>
          <h1 className="titulo-vista" style={{ marginBottom: 4 }}>Roles</h1>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
            Administra usuarios registrados, actualiza sus datos y asigna permisos con el mismo flujo visual del panel de pedidos.
          </p>
        </div>
        <div className="gp-tabs">
          <button className="gp-tab gp-tab--activo" type="button">
            Usuarios
            <span className="gp-tab-badge">{usuarios.length}</span>
          </button>
          <button className="gp-tab" type="button" onClick={cargarUsuarios}>
            Actualizar
          </button>
        </div>
      </div>

      {mensaje && (
        <div className={`roles-mensaje ${mensajeTipo === "error" ? "error" : "ok"}`}>
          {mensaje}
        </div>
      )}

      <div className="gp-filtros">
        <input
          type="text"
          className="gp-busqueda"
          placeholder="Buscar por ID, nombre, correo o rol..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select className="gp-select" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
          <option value="todos">Todos los roles</option>
          {ROLES_DISPONIBLES.map((rol) => (
            <option key={rol.value} value={rol.value}>{rol.label}</option>
          ))}
        </select>
      </div>

      {cargando ? (
        <p style={{ color: "#888", padding: "24px 0" }}>Cargando usuarios...</p>
      ) : usuariosFiltrados.length === 0 ? (
        <p className="gp-vacio">No se encontraron usuarios con ese criterio.</p>
      ) : (
        <div className="gp-tabla-wrap">
          <table className="gp-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Registro</th>
                <th>Estado correo</th>
                <th>Rol actual</th>
                <th>Asignar rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((item) => {
                const cambioPendiente = cambiosPendientes[item._id];
                const hayCambio = Boolean(cambioPendiente && cambioPendiente !== item.rol);
                const guardando = guardandoId === item._id;

                return (
                  <tr key={item._id}>
                    <td className="gp-tabla-id">#{item._id?.slice(-6).toUpperCase()}</td>
                    <td>
                      <div className="gp-tabla-nombre">{nombreCompletoUsuario(item)}</div>
                      <div className="gp-tabla-email">{item.email}</div>
                    </td>
                    <td>{new Date(item.createdAt).toLocaleDateString("es-CO")}</td>
                    <td>
                      <span className={`gp-badge ${item.isVerified ? "gp-badge--entregado" : "gp-badge--nuevo"}`}>
                        {item.isVerified ? "Verificado" : "Pendiente"}
                      </span>
                    </td>
                    <td><BadgeRol rol={item.rol} /></td>
                    <td style={{ minWidth: 180 }}>
                      <select
                        id={`rol-${item._id}`}
                        className="gp-select"
                        value={cambioPendiente ?? item.rol}
                        disabled={guardando}
                        onChange={(e) => seleccionarRolPendiente(item._id, e.target.value)}
                      >
                        {ROLES_DISPONIBLES.map((rol) => (
                          <option key={rol.value} value={rol.value}>
                            {rol.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="gp-btn gp-btn--secundario"
                          onClick={() => abrirModalEdicion(item)}
                        >
                          Editar usuario
                        </button>
                        {hayCambio && (
                          <>
                            <button
                              type="button"
                              className="gp-btn"
                              style={{ background: "#c0392b", color: "#fff" }}
                              disabled={guardando}
                              onClick={() => confirmarCambioRol(item._id)}
                            >
                              {guardando ? "Guardando..." : "Aceptar"}
                            </button>
                            <button
                              type="button"
                              className="gp-btn gp-btn--secundario"
                              disabled={guardando}
                              onClick={() => cancelarCambioRol(item._id)}
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
                <span>{nombreCompletoUsuario(usuarioEditando)}</span>
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
