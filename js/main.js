import { Carrito } from "./carrito.js";
import { UI } from "./ui.js";
import { listaProductos } from "../data/productos.js";
import { filtrarProductos } from "./filtros.js";

const carrito = new Carrito();
const ui = new UI();

ui.mostrarProductos(listaProductos);

document.addEventListener("click", e => {
    if (e.target.matches(".producto button")) {
        const id = Number(e.target.dataset.id);
        const producto = listaProductos.find(p => p.id === id);

        carrito.agregar(producto);
        ui.actualizarCarrito(carrito.cantidad());
    }

    if (e.target.matches(".filtros a")) {
        const categoria = e.target.textContent.toLowerCase();
        const filtrados = filtrarProductos(categoria, listaProductos);
        ui.mostrarProductos(filtrados);
    }
});
