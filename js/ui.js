export class UI {

    mostrarProductos(productos) {
        const contenedor = document.querySelector(".productos");
        contenedor.innerHTML = "";

        productos.forEach(p => {
            contenedor.innerHTML += `
                <article class="producto" data-categoria="${p.categoria}">
                    <img src="${p.imagen}">
                    <h4>${p.nombre}</h4>
                    <p>$${p.precio}</p>
                    <button data-id="${p.id}">Agregar</button>
                </article>
            `;
        });
    }

    actualizarCarrito(cantidad) {
        document.querySelector("#contador-carrito").textContent = cantidad;
    }
}
