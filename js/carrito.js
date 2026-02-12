export class Carrito {
    constructor() {
        this.items = [];
    }

    agregar(producto) {
        this.items.push(producto);
    }

    eliminar(id) {
        this.items = this.items.filter(p => p.id !== id);
    }

    total() {
        return this.items.reduce((sum, p) => sum + p.precio, 0);
    }

    cantidad() {
        return this.items.length;
    }
}
