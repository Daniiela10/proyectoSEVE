import { useState } from "react";
import { useApp } from "@/context/AppContext";

const ADMIN_ITEMS = [
  { vista: "preview-inicio-admin", label: "Pagina principal" },
  { vista: "gestion-carrusel", label: "Editar pagina principal" },
  { vista: "gestion-pedidos", label: "Pedidos" },
  { vista: "gestion-envios", label: "Envios" },
  { vista: "roles", label: "Roles" },
  { vista: "editar-productos", label: "Editar productos" },
  { vista: "gestion-categorias", label: "Categorías" },
  { vista: "productos-oferta-admin", label: "Ofertas" },
  { vista: "historial-ventas", label: "Ventas" },
];

const EMPLEADO_ITEMS = [
  { vista: "emp-pedidos", label: "Pedidos" },
  { vista: "emp-envios", label: "Envios" },
  { vista: "emp-productos", label: "Productos" },
];

export default function StaffSidebar({ esAdmin, esEmpleado }) {
  const { vista, setVista } = useApp();
  const [abierto, setAbierto] = useState(false);
  const items = esAdmin ? ADMIN_ITEMS : esEmpleado ? EMPLEADO_ITEMS : [];
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
