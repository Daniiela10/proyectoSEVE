import { useApp } from "@/context/AppContext";

const ADMIN_ITEMS = [
  { vista: "inicio", label: "Página principal" },
  { vista: "gestion-pedidos", label: "Pedidos" },
  { vista: "gestion-envios", label: "Envios" },
  { vista: "roles", label: "Roles" },
  { vista: "editar-productos", label: "Editar productos" },
  { vista: "productos-oferta-admin", label: "Ofertas" },
  { vista: "historial-ventas", label: "Ventas" },
  { vista: "gestion-carrusel", label: "Carrusel" },
];

const EMPLEADO_ITEMS = [
  { vista: "emp-pedidos", label: "Pedidos" },
  { vista: "emp-envios", label: "Envios" },
  { vista: "emp-productos", label: "Productos" },
];

export default function StaffSidebar({ esAdmin, esEmpleado }) {
  const { vista, setVista } = useApp();
  const items = esAdmin ? ADMIN_ITEMS : esEmpleado ? EMPLEADO_ITEMS : [];

  if (!items.length) return null;

  return (
    <aside className="staff-sidebar">
      <div className="staff-sidebar-card">
        <div className="staff-sidebar-head">
          <span className="staff-sidebar-kicker">{esAdmin ? "Administrador" : "Empleado"}</span>
          <strong>{esAdmin ? "Panel de control" : "Panel operativo"}</strong>
        </div>
        <nav className="staff-sidebar-nav" aria-label="Navegacion del panel">
          {items.map((item) => (
            <button
              key={item.vista}
              type="button"
              className={`staff-sidebar-link${vista === item.vista ? " is-active" : ""}`}
              onClick={() => setVista(item.vista)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
