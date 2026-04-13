import React from "react";
import "./categorias.css";

const categorias = [
    {
        nombre: "Juego de Ollas",
        img: "/seve-app/frontend/public/img/Categorias/juegoOllas.png",
    },
    {
        nombre: "Utensilios",
        img: "",
    },
    {
        nombre: "Freidoras",
        img: "",
    },
    {
        nombre: "Multichef",
        img: "",
    },
    {
        nombre: "Licuadoras",
        img: "",
    },
    {
        nombre: "Otros Electrodomésticos",
        img: "https://images.unsplash.com/photo-1586201375761-83865001e17b",
    },
    {
        nombre: "Profesional",
        img: "https://images.unsplash.com/photo-1604908812423-9c91d88a7a4d",
    },
];

const Categorias = () => {
    return (
        <section className="categorias-section">
            <h2 className="categorias-title">CATEGORÍAS</h2>

        <div className="categorias-grid">
            {categorias.map((cat, index) => (
            <div key={index} className="categoria-item">
                <div className="categoria-circle">
                {cat.img ? (
                    <img src={cat.img} alt={cat.nombre} />
                ) : (
                <div className="categoria-placeholder" />
                )}
            </div>
            <p className="categoria-label">{cat.nombre}</p>
        </div>
    ))}
    </div>

    <div className="categorias-footer">
        <button className="btn-ver-todo">VER TODO</button>
        </div>
    </section>
    );
};

export default Categorias;
