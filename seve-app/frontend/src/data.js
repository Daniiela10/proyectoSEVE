export const listaProductos = [
  { id: 1, nombre: "Olla SEVE 5L",               precio: 100000, categoria: "ollas",         imagen: "/img/olla.png" },
  { id: 2, nombre: "Olla SEVE 3L",               precio: 85000,  categoria: "ollas",         imagen: "/img/olla.png" },
  { id: 3, nombre: "Olla Alta SEVE",             precio: 95000,  categoria: "ollas",         imagen: "/img/olla.png" },
  { id: 4, nombre: "Olleta SEVE 2L",             precio: 45000,  categoria: "olletas",       imagen: "/img/calderos.png" },
  { id: 5, nombre: "Olleta SEVE 1.5L",           precio: 38000,  categoria: "olletas",       imagen: "/img/calderos.png" },
  { id: 6, nombre: "Olleta con tapa",            precio: 52000,  categoria: "olletas",       imagen: "/img/calderos.png" },
  { id: 7, nombre: "Juego de Ollas 3 piezas",    precio: 120000, categoria: "juego-de-ollas",imagen: "/img/juegodeOllas.png" },
  { id: 8, nombre: "Juego de Ollas 5 piezas",    precio: 180000, categoria: "juego-de-ollas",imagen: "/img/juegodeOllas.png" },
  { id: 9, nombre: "Juego de Ollas Premium",     precio: 220000, categoria: "juego-de-ollas",imagen: "/img/juegodeOllas.png" },
  { id: 10, nombre: "Fiambrera SEVE 500ml",      precio: 25000,  categoria: "fiambreras",    imagen: "/img/olla.png" },
  { id: 11, nombre: "Fiambrera SEVE 1L",         precio: 35000,  categoria: "fiambreras",    imagen: "/img/olla.png" },
  { id: 12, nombre: "Fiambrera 3 compartimentos",precio: 42000,  categoria: "fiambreras",    imagen: "/img/olla.png" },
];

export const productosOferta = listaProductos.filter(p => [1,4,7,10].includes(p.id));

export function formatearPrecio(num) {
  return "$" + Number(num).toLocaleString("es-CO");
}