import { useState } from "react";
import { useApp } from "@/context/AppContext";
import Header from "@/components/Header";
import CarritoDrawer from "@/components/CarritoDrawer";
import PerfilUsuario from "@/components/PerfilUsuario";
import Inicio from "@/pages/Inicio";
import Productos from "@/pages/Productos";
import Ofertas from "@/pages/Ofertas";
import Carrito from "@/pages/Carrito";
import Historial from "@/pages/Historial";
import Contacto from "@/pages/Contacto";
import GestionPedidos from "@/pages/GestionPedidos";
import ModalLogin from "@/components/ModalLogin";

export default function App() {
  const { vista } = useApp();
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  return (
    <div>
      <Header onAbrirCarrito={() => setCarritoAbierto(true)} />
      <main className="main-wrap">
        {vista === "inicio"          && <Inicio />}
        {vista === "productos"       && <Productos />}
        {vista === "ofertas"         && <Ofertas />}
        {vista === "carrito"         && <Carrito />}
        {vista === "historial"       && <Historial />}
        {vista === "contacto"        && <Contacto />}
        {vista === "gestion-pedidos" && <GestionPedidos />}
        {vista === "perfil"          && <PerfilUsuario />}
      </main>
      <ModalLogin />
      <footer className="footer">
        <div className="footer-info">
          <p>&copy; 2026 SEVE Aluminios — Todos los derechos reservados</p>
        </div>
        <div className="footer-links">
          <a href="#" onClick={(e) => e.preventDefault()}>Políticas de privacidad</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Términos y condiciones</a>
        </div>
      </footer>

      {/* WhatsApp flotante */}
      <a
        href="https://wa.me/573228877166"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed", bottom: 24, left: 24,
          width: 56, height: 56, borderRadius: "50%",
          background: "#52ea11", display: "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(37,211,102,0.5)",
          zIndex: 9999, transition: "transform 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        title="Escríbenos por WhatsApp"
      >
        <svg width="30" height="30" viewBox="0 0 32 32" fill="white">
          <path d="M16 2C8.28 2 2 8.28 2 16c0 2.46.66 4.76 1.8 6.76L2 30l7.44-1.76A13.93 13.93 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm7.06 19.46c-.3.84-1.74 1.6-2.4 1.7-.62.1-1.4.14-2.26-.14-.52-.16-1.18-.38-2.04-.74-3.58-1.54-5.92-5.14-6.1-5.38-.18-.24-1.46-1.94-1.46-3.7s.92-2.62 1.26-2.98c.3-.32.66-.4.88-.4l.64.01c.2 0 .48-.08.74.56.3.7 1.02 2.46 1.1 2.64.1.18.16.38.04.62-.12.24-.18.38-.36.58-.18.2-.38.44-.54.6-.18.18-.36.36-.16.72.2.34.9 1.5 1.94 2.42 1.34 1.18 2.46 1.56 2.8 1.72.34.18.54.16.74-.08.2-.24.88-1.02 1.12-1.36.22-.34.46-.28.76-.16.3.1 1.9.9 2.22 1.06.34.18.56.26.64.4.08.16.08.9-.22 1.74z"/>
        </svg>
      </a>

      <CarritoDrawer abierto={carritoAbierto} onCerrar={() => setCarritoAbierto(false)} />
    </div>
  );
}
