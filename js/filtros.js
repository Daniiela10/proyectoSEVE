export function filtrarProductos(categoria, productos) {
    if (categoria === "todos") return productos;
    return productos.filter(p => p.categoria === categoria);
}
