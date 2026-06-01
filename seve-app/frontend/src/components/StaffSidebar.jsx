import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { obtenerItemsStaff } from "@/config/permisos";

export default function StaffSidebar({ esAdmin, esEmpleado }) {
  const { vista, setVista, usuario } = useApp();
  const [abierto, setAbierto] = useState(false);
  const items = esAdmin || esEmpleado ? obtenerItemsStaff(usuario) : [];
  const itemActivo = items.find((item) => item.vista === vista);

  if (!items.length) return null;

  return (
    <aside className={`staff-sidebar${abierto ? " is-open" : ""}`}>
      <div className="staff-sidebar-card">
        <div className="staff-sidebar-head">
          <div className="staff-sidebar-title">
            <span className="staff-sidebar-kicker">{esAdmin ? "Administrador" : "Empleado"}</span>
            <strong>{esAdmin ? "Panel de control" : "Panel operativo"}</strong>
            {itemActivo && <small>{itemActivo.label}</small>}
          </div>
          <button
            type="button"
            className="staff-sidebar-toggle"
            onClick={() => setAbierto((valor) => !valor)}
            aria-expanded={abierto}
          >
            Menu
          </button>
        </div>
        <nav className="staff-sidebar-nav" aria-label="Navegacion del panel">
          {items.map((item) => (
            <button
              key={item.vista}
              type="button"
              className={`staff-sidebar-link${vista === item.vista ? " is-active" : ""}`}
              onClick={() => {
                setVista(item.vista);
                setAbierto(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
