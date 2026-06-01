const PERMISOS_EMPLEADO_VALIDOS = [
  'preview-inicio-admin',
  'gestion-carrusel',
  'gestion-pedidos',
  'gestion-envios',
  'editar-productos',
  'gestion-combos',
  'productos-oferta-admin',
  'historial-ventas',
];

function normalizarPermisos(permisos) {
  const valores = Array.isArray(permisos) ? permisos : [];
  return [...new Set(valores.map(String).filter((permiso) => PERMISOS_EMPLEADO_VALIDOS.includes(permiso)))];
}

function tienePermiso(usuario, permiso) {
  if (!usuario) return false;
  if (usuario.esAdmin || usuario.rol === 'admin') return true;
  return usuario.rol === 'empleado' && Array.isArray(usuario.permisos) && usuario.permisos.includes(permiso);
}

module.exports = {
  PERMISOS_EMPLEADO_VALIDOS,
  normalizarPermisos,
  tienePermiso,
};
