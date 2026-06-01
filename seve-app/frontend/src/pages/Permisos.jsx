import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { ADMIN_MENU_ITEMS } from "@/config/permisos";
import "./GestionPedidos.css";

function nombreCompletoUsuario(item) {
  return [item?.nombres, item?.apellidos].filter(Boolean).join(" ").trim() || item?.nombre || item?.email || "Empleado";
}

export default function Permisos() {
  const { usuario, obtenerUsuarios, actualizarPermisosUsuario } = useApp();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState("ok");

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    try {
      setCargando(true);
      setMensaje("");
      const data = await obtenerUsuarios();
      setUsuarios(data.filter((item) => item.rol === "empleado"));
    } catch (err) {
      setMensaje(err?.response?.data?.error || "No se pudieron cargar los empleados");
      setMensajeTipo("error");
    } finally {
      setCargando(false);
    }
  }

  async function alternarPermiso(empleado, permiso) {
    const permisosActuales = Array.isArray(empleado.permisos) ? empleado.permisos : [];
    const permisos = permisosActuales.includes(permiso)
      ? permisosActuales.filter((item) => item !== permiso)
      : [...permisosActuales, permiso];

    try {
      setGuardandoId(empleado._id);
      setMensaje("");
      const { usuario: actualizado, mensaje: texto } = await actualizarPermisosUsuario(empleado._id, permisos);
      setUsuarios((prev) => prev.map((item) => item._id === empleado._id ? actualizado : item));
      setMensaje(texto || "Permisos actualizados correctamente");
      setMensajeTipo("ok");
    } catch (err) {
      setMensaje(err?.response?.data?.error || "No se pudieron actualizar los permisos");
      setMensajeTipo("error");
    } finally {
      setGuardandoId("");
    }
  }

  const empleadosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return usuarios;
    return usuarios.filter((item) => {
      const nombre = nombreCompletoUsuario(item).toLowerCase();
      const email = String(item.email || "").toLowerCase();
      return nombre.includes(termino) || email.includes(termino);
    });
  }, [usuarios, busqueda]);

  if (!usuario?.esAdmin) {
    return (
      <div>
        <h1 className="titulo-vista">Permisos</h1>
        <p className="gp-vacio">No tienes permisos para ver esta seccion.</p>
      </div>
    );
  }

  return (
    <div className="roles-vista">
      <div className="gp-header">
        <div>
          <h1 className="titulo-vista" style={{ marginBottom: 4 }}>Permisos</h1>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
            Activa las secciones del panel administrador que cada empleado puede ver y usar.
          </p>
        </div>
        <div className="gp-tabs">
          <button className="gp-tab gp-tab--activo" type="button">
            Empleados
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
          placeholder="Buscar empleado por nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {cargando ? (
        <p style={{ color: "#888", padding: "24px 0" }}>Cargando empleados...</p>
      ) : empleadosFiltrados.length === 0 ? (
        <p className="gp-vacio">No hay empleados para asignar permisos.</p>
      ) : (
        <div className="gp-tabla-wrap">
          <table className="gp-tabla">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Permisos del panel administrador</th>
              </tr>
            </thead>
            <tbody>
              {empleadosFiltrados.map((empleado) => {
                const permisos = Array.isArray(empleado.permisos) ? empleado.permisos : [];
                const guardando = guardandoId === empleado._id;

                return (
                  <tr key={empleado._id}>
                    <td style={{ minWidth: 220 }}>
                      <div className="gp-tabla-nombre">{nombreCompletoUsuario(empleado)}</div>
                      <div className="gp-tabla-email">{empleado.email}</div>
                    </td>
                    <td>
                      <div className="permisos-grid">
                        {ADMIN_MENU_ITEMS.map((permiso) => (
                          <label key={`${empleado._id}-${permiso.vista}`} className="permiso-check">
                            <input
                              type="checkbox"
                              checked={permisos.includes(permiso.vista)}
                              disabled={guardando}
                              onChange={() => alternarPermiso(empleado, permiso.vista)}
                            />
                            <span>{permiso.label}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
