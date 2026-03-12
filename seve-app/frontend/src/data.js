export const listaProductos = [
  { 
    id: 1, 
    nombre: "Olla SEVE 5L",               
    precio: 100000, 
    categoria: "ollas",         
    imagen: "/img/olla.png",
    descripcion: [
      "Aluminio premium 99.5% puro",
      "Capacidad 5 litros familiar",
      "Tapa de vidrio templado",
      "Compatible con todas las estufas"
    ],
    colores: ["rojo", "negro", "azul", "verde"]
  },
  { 
    id: 2, 
    nombre: "Olla SEVE 3L",               
    precio: 85000,  
    categoria: "ollas",         
    imagen: "/img/olla.png",
    descripcion: [
      "Aluminio de alta calidad",
      "Capacidad 3 litros",
      "Tapa de vidrio resistente",
      "Asas ergonómicas anticalor"
    ],
    colores: ["rojo", "negro", "azul", "verde"]
  },
  { 
    id: 3, 
    nombre: "Olla Alta SEVE",             
    precio: 95000,  
    categoria: "ollas",         
    imagen: "/img/olla.png",
    descripcion: [
      "Diseño alto para sopas",
      "Capacidad 4L",
      "Espesor uniforme para cocción",
      "Fondo reforzado"
    ],
    colores: ["rojo", "negro", "azul", "verde"]
  },
  { 
    id: 4, 
    nombre: "Olleta SEVE 2L",             
    precio: 45000,  
    categoria: "olletas",       
    imagen: "/img/calderos.png",
    descripcion: [
      "Perfecta para 2 personas",
      "Capacidad 2L",
      "Ideal para caldos y guisos",
      "Tapa hermética"
    ],
    colores: ["rojo", "negro", "azul", "verde"]
  },
  { 
    id: 5, 
    nombre: "Olleta SEVE 1.5L",           
    precio: 38000,  
    categoria: "olletas",       
    imagen: "/img/calderos.png",
    descripcion: [
      "Compacta para solteros",
      "Capacidad 1.5L",
      "Ligera y fácil de manejar",
      "Cocción uniforme"
    ],
    colores: ["rojo", "negro", "azul", "verde"]
  },
  { 
    id: 6, 
    nombre: "Olleta con tapa",            
    precio: 52000,  
    categoria: "olletas",       
    imagen: "/img/calderos.png",
    descripcion: [
      "Tapa de vidrio con sello",
      "Capacidad 2.5L",
      "Retiene sabores y aromas",
      "Fácil limpieza"
    ],
    colores: ["rojo", "negro", "azul", "verde"]
  },
  { 
    id: 7, 
    nombre: "Juego de Ollas 3 piezas",    
    precio: 120000, 
    categoria: "juego-de-ollas",
    imagen: "/img/juegodeOllas.png",
    descripcion: [
      "3 ollas: 2L, 4L, 6L",
      "Set completo económico",
      "Aluminio premium",
      "Tapas incluidas"
    ],
    colores: ["rojo", "negro", "azul", "verde"]
  },
  { 
    id: 8, 
    nombre: "Juego de Ollas 5 piezas",    
    precio: 180000, 
    categoria: "juego-de-ollas",
    imagen: "/img/juegodeOllas.png",
    descripcion: [
      "5 piezas versátiles",
      "Ollas + olletas + fiambrera",
      "Para toda la familia",
      "Estuche incluido"
    ],
    colores: ["rojo", "negro", "azul", "verde"]
  },
  { 
    id: 9, 
    nombre: "Juego de Ollas Premium",     
    precio: 220000, 
    categoria: "juego-de-ollas",
    imagen: "/img/juegodeOllas.png",
    descripcion: [
      "Set profesional 7 piezas",
      "Acabado premium",
      "Tapas vidrio + utensilios",
      "Garantía extendida"
    ],
    colores: ["rojo", "negro", "azul", "verde"]
  },
  { 
    id: 10, 
    nombre: "Fiambrera SEVE 500ml",      
    precio: 25000,  
    categoria: "fiambreras",    
    imagen: "/img/olla.png",
    descripcion: [
      "Comida para 1 persona",
      "500ml capacidad",
      "Apilable y ligera",
      "Sellado hermético"
    ],
    colores: ["rojo", "negro", "azul", "verde"]
  },
  { 
    id: 11, 
    nombre: "Fiambrera SEVE 1L",         
    precio: 35000,  
    categoria: "fiambreras",    
    imagen: "/img/olla.png",
    descripcion: [
      "Capacidad 1 litro",
      "2 compartimentos",
      "Mantiene temperatura",
      "Ideal oficina"
    ],
    colores: ["rojo", "negro", "azul", "verde"]
  },
  { 
    id: 12, 
    nombre: "Fiambrera 3 compartimentos",
    precio: 42000,  
    categoria: "fiambreras",    
    imagen: "/img/olla.png",
    descripcion: [
      "3 secciones independientes",
      "1L total",
      "Sin BPA, segura microondas",
      "Funda térmica"
    ],
    colores: ["rojo", "negro", "azul", "verde"]
  },
];

export const productosOferta = listaProductos.filter(p => [1,4,7,10].includes(p.id));

export function formatearPrecio(num) {
  return "$" + Number(num).toLocaleString("es-CO");
}

