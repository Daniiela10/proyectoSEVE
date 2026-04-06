export function formatearPrecio(num) {
  return "$" + Number(num).toLocaleString("es-CO");
}
