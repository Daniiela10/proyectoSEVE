export const ADMIN_MENU_ITEMS = [
  { vista: "preview-inicio-admin", label: "Pagina principal" },
  { vista: "gestion-carrusel", label: "Editar pagina principal" },
  { vista: "gestion-pedidos", label: "Pedidos" },
  { vista: "gestion-envios", label: "Envios" },
  { vista: "editar-productos", label: "Editar productos" },
  { vista: "gestion-combos", label: "Combos" },
  { vista: "productos-oferta-admin", label: "Ofertas" },
  { vista: "historial-ventas", label: "Ventas" },
];

export const ADMIN_ONLY_MENU_ITEMS = [
  { vista: "gestion-colores", label: "Colores" },
  { vista: "roles", label: "Roles" },
  { vista: "permisos", label: "Permisos" },
];

export const EMPLEADO_BASE_ITEMS = [
  { vista: "emp-pedidos", label: "Pedidos" },
  { vista: "emp-envios", label: "Envios" },
  { vista: "emp-productos", label: "Productos" },
];

export function usuarioTienePermiso(usuario, vista) {
  if (!usuario) return false;
  if (usuario.esAdmin || usuario.rol === "admin") return true;
  return usuario.rol === "empleado" && Array.isArray(usuario.permisos) && usuario.permisos.includes(vista);
}

export function obtenerItemsStaff(usuario) {
  if (!usuario) return [];
  if (usuario.esAdmin || usuario.rol === "admin") {
    return [...ADMIN_MENU_ITEMS, ...ADMIN_ONLY_MENU_ITEMS];
  }
  if (usuario.rol !== "empleado") return [];

  const concedidos = ADMIN_MENU_ITEMS.filter((item) => usuarioTienePermiso(usuario, item.vista));
  return [...EMPLEADO_BASE_ITEMS, ...concedidos];
}
