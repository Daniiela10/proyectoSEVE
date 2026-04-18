import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import Header from "@/components/Header";
import CarritoDrawer from "@/components/CarritoDrawer";
import PerfilDrawer from "@/components/PerfilDrawer";
import ProductModal from "@/components/ProductModal";
import StaffSidebar from "@/components/StaffSidebar";
import Inicio from "@/pages/Inicio";
import Productos from "@/pages/Productos";
import Ofertas from "@/pages/Ofertas";
import Carrito from "@/pages/Carrito";
import Historial from "@/pages/Historial";
import GestionPedidos from "@/pages/GestionPedidos";
import HistorialVentas from "@/pages/HistorialVentas";
import EditarProductos from "@/pages/EditarProductos";
import ProductosOfertaAdmin from "@/pages/ProductosOfertaAdmin";
import Roles from "@/pages/Roles";
import ModalLogin from "@/components/ModalLogin";
import RestablecerPassword from "@/pages/RestablecerPassword";
import VerificarEmail from "@/pages/VerificarEmail";
import EmpleadoProductos from "@/pages/EmpleadoProductos";
import EmpleadoPedidos from "@/pages/EmpleadoPedidos";
import PagoResultado from "@/pages/PagoResultado";

export default function App() {
  const { vista, setVista, usuario, cartFeedback } = useApp();
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [vistaBase, setVistaBase] = useState("inicio");

  const esAdmin = Boolean(usuario?.esAdmin);
  const esEmpleado = !esAdmin && usuario?.rol === "empleado";
  const ocultarWhatsapp = esAdmin || esEmpleado;
  const mostrarSidebarStaff = esAdmin || esEmpleado;

  useEffect(() => {
    if (window.location.pathname === "/verificar-email") {
      setVista("verificar-email");
    } else if (window.location.pathname === "/restablecer-password") {
      setVista("restablecer-password");
    } else if (window.location.pathname === "/pago-resultado") {
      setVista("pago-resultado");
    }
  }, []);

  const vistaPrincipal = vista === "perfil" || vista === "login" ? vistaBase : vista;

  return (
    <div>
      <Header onAbrirCarrito={() => setCarritoAbierto(true)} />
      <main className={`main-wrap${mostrarSidebarStaff ? " has-staff-sidebar" : ""}`}>
        {mostrarSidebarStaff && <StaffSidebar esAdmin={esAdmin} esEmpleado={esEmpleado} />}

        <div className="main-content-shell">
          {vistaPrincipal === "inicio" && <Inicio />}
          {vistaPrincipal === "productos" && <Productos />}
          {vistaPrincipal === "ofertas" && <Ofertas />}
          {vistaPrincipal === "carrito" && <Carrito />}
          {vistaPrincipal === "historial" && <Historial />}

          {vistaPrincipal === "historial-ventas" && esAdmin && <HistorialVentas />}
          {vistaPrincipal === "editar-productos" && esAdmin && <EditarProductos />}
          {vistaPrincipal === "productos-oferta-admin" && esAdmin && <ProductosOfertaAdmin />}
          {vistaPrincipal === "roles" && esAdmin && <Roles />}
          {vistaPrincipal === "gestion-pedidos" && esAdmin && <GestionPedidos seccionInicial="pedidos" />}
          {vistaPrincipal === "gestion-envios" && esAdmin && <GestionPedidos seccionInicial="envios" />}

          {vistaPrincipal === "emp-productos" && (esEmpleado || esAdmin) && <EmpleadoProductos />}
          {vistaPrincipal === "emp-pedidos" && (esEmpleado || esAdmin) && <EmpleadoPedidos seccionInicial="pedidos" />}
          {vistaPrincipal === "emp-envios" && (esEmpleado || esAdmin) && <EmpleadoPedidos seccionInicial="envios" />}

          {vistaPrincipal === "verificar-email" && <VerificarEmail />}
          {vistaPrincipal === "restablecer-password" && <RestablecerPassword />}
          {vistaPrincipal === "pago-resultado" && <PagoResultado />}
        </div>
      </main>

      <ProductModal />
      <ModalLogin />

      <footer className="footer">
        <div className="footer-info">
          <p>&copy; 2026 SEVE Aluminios - Todos los derechos reservados</p>
        </div>
        <div className="footer-links">
          <a href="#" onClick={(e) => e.preventDefault()}>Politicas de privacidad</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Terminos y condiciones</a>
        </div>
      </footer>

      {!ocultarWhatsapp && (
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
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          title="Escribenos por WhatsApp"
        >
          <svg width="30" height="30" viewBox="0 0 32 32" fill="white">
            <path d="M16 2C8.28 2 2 8.28 2 16c0 2.46.66 4.76 1.8 6.76L2 30l7.44-1.76A13.93 13.93 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm7.06 19.46c-.3.84-1.74 1.6-2.4 1.7-.62.1-1.4.14-2.26-.14-.52-.16-1.18-.38-2.04-.74-3.58-1.54-5.92-5.14-6.1-5.38-.18-.24-1.46-1.94-1.46-3.7s.92-2.62 1.26-2.98c.3-.32.66-.4.88-.4l.64.01c.2 0 .48-.08.74.56.3.7 1.02 2.46 1.1 2.64.1.18.16.38.04.62-.12.24-.18.38-.36.58-.18.2-.38.44-.54.6-.18.18-.36.36-.16.72.2.34.9 1.5 1.94 2.42 1.34 1.18 2.46 1.56 2.8 1.72.34.18.54.16.74-.08.2-.24.88-1.02 1.12-1.36.22-.34.46-.28.76-.16.3.1 1.9.9 2.22 1.06.34.18.56.26.64.4.08.16.08.9-.22 1.74z"/>
          </svg>
        </a>
      )}

      <CarritoDrawer abierto={carritoAbierto} onCerrar={() => setCarritoAbierto(false)} />
      <PerfilDrawer abierto={vista === "perfil"} onCerrar={() => setVista(vistaBase)} />

      {cartFeedback && (
        <div className="cart-toast" role="status" aria-live="polite">
          <strong>Agregado al carrito</strong>
          <span>{cartFeedback.nombre} x {cartFeedback.cantidad}</span>
        </div>
      )}
    </div>
  );
}
