import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import Header from "@/components/Header";
import CarritoDrawer from "@/components/CarritoDrawer";
import PerfilDrawer from "@/components/PerfilDrawer";
import ProductModal from "@/components/ProductModal";
import StaffSidebar from "@/components/StaffSidebar";
import Carrusel from "@/components/Carrusel";
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
import Permisos from "@/pages/Permisos";
import ModalLogin from "@/components/ModalLogin";
import RestablecerPassword from "@/pages/RestablecerPassword";
import VerificarEmail from "@/pages/VerificarEmail";
import EmpleadoProductos from "@/pages/EmpleadoProductos";
import EmpleadoPedidos from "@/pages/EmpleadoPedidos";
import PagoResultado from "@/pages/PagoResultado";
import CompraXMayor from "@/pages/CompraXMayor";
import GestionCarrusel from "@/pages/GestionCarrusel";
import GestionCombos from "@/pages/GestionCombos";
import PoliticaPrivacidad from "@/pages/PoliticaPrivacidad";
import PoliticaCookies from "@/pages/PoliticaCookies";
import CookieBanner from "@/components/CookieBanner";
import { usuarioTienePermiso } from "@/config/permisos";

export default function App() {
  const { vista, setVista, usuario, cartFeedback } = useApp();
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [vistaBase, setVistaBase] = useState("inicio");

  const esAdmin = Boolean(usuario?.esAdmin);
  const esEmpleado = !esAdmin && usuario?.rol === "empleado";
  const vistasClientePreview = ["preview-inicio-admin", "inicio", "productos", "ofertas", "carrito", "compra-mayor"];
  const esPreviewClienteAdmin = esAdmin && vistasClientePreview.includes(vista);
  const ocultarWhatsapp = (esAdmin || esEmpleado) && !esPreviewClienteAdmin;
  const mostrarSidebarStaff = esAdmin || esEmpleado;
  const puedeVer = (vistaPermiso) => esAdmin || usuarioTienePermiso(usuario, vistaPermiso);

  useEffect(() => {
    if (window.location.pathname === "/verificar-email") {
      setVista("verificar-email");
    } else if (window.location.pathname === "/restablecer-password") {
      setVista("restablecer-password");
    } else if (window.location.pathname === "/pago-resultado") {
      setVista("pago-resultado");
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [vista]);

  const vistaPrincipal = vista === "perfil" || vista === "login" ? vistaBase : vista;

  return (
    <div>
      <Header
        onAbrirCarrito={() => setCarritoAbierto(true)}
        modoClientePreview={esPreviewClienteAdmin}
      />
      {(vistaPrincipal === "inicio" || vistaPrincipal === "preview-inicio-admin") && (
        <Carrusel onVerProductos={() => setVista("productos")} />
      )}
      <main className={`main-wrap${mostrarSidebarStaff ? " has-staff-sidebar" : ""}`}>
        {mostrarSidebarStaff && <StaffSidebar esAdmin={esAdmin} esEmpleado={esEmpleado} />}

        <div className="main-content-shell">
          {vistaPrincipal === "inicio" && <Inicio />}
          {vistaPrincipal === "preview-inicio-admin" && <Inicio />}
          {vistaPrincipal === "productos" && <Productos />}
          {vistaPrincipal === "ofertas" && <Ofertas />}
          {vistaPrincipal === "carrito" && <Carrito bloquearCheckout={esPreviewClienteAdmin} />}
          {vistaPrincipal === "historial" && <Historial />}

          {vistaPrincipal === "roles" && esAdmin && <Roles />}
          {vistaPrincipal === "permisos" && esAdmin && <Permisos />}
          {vistaPrincipal === "gestion-carrusel" && puedeVer("gestion-carrusel") && <GestionCarrusel />}
          {vistaPrincipal === "gestion-combos" && puedeVer("gestion-combos") && <GestionCombos />}
          {vistaPrincipal === "gestion-pedidos" && puedeVer("gestion-pedidos") && <GestionPedidos seccionInicial="pedidos" />}
          {vistaPrincipal === "gestion-envios" && puedeVer("gestion-envios") && <GestionPedidos seccionInicial="envios" />}
          {vistaPrincipal === "historial-ventas" && puedeVer("historial-ventas") && <HistorialVentas />}
          {vistaPrincipal === "editar-productos" && puedeVer("editar-productos") && <EditarProductos />}
          {vistaPrincipal === "productos-oferta-admin" && puedeVer("productos-oferta-admin") && <ProductosOfertaAdmin />}
          {vistaPrincipal === "emp-productos" && (esEmpleado || esAdmin) && <EmpleadoProductos />}
          {vistaPrincipal === "emp-pedidos" && (esEmpleado || esAdmin) && <EmpleadoPedidos seccionInicial="pedidos" />}
          {vistaPrincipal === "emp-envios" && (esEmpleado || esAdmin) && <EmpleadoPedidos seccionInicial="envios" />}

          {vistaPrincipal === "compra-mayor" && <CompraXMayor onAbrirCarrito={() => setCarritoAbierto(true)} />}
          {vistaPrincipal === "verificar-email" && <VerificarEmail />}
          {vistaPrincipal === "restablecer-password" && <RestablecerPassword />}
          {vistaPrincipal === "pago-resultado" && <PagoResultado />}
          {vistaPrincipal === "politica-privacidad" && <PoliticaPrivacidad />}
          {vistaPrincipal === "terminos-condiciones" && <PoliticaCookies />}
        </div>
      </main>

      <ProductModal />
      <ModalLogin />

      <footer className="footer">
        <div className="footer-body">

          {/* Columna 1 — Marca */}
          <div className="footer-col footer-col--brand">
            <img src="/img/Logo.png" alt="SEVE Aluminios" className="footer-logo" />
            <p className="footer-tagline">Tu hogar merece lo mejor.<br />Calidad en aluminio desde 2000.</p>
            <div className="footer-redes">
              <a href="https://www.facebook.com/profile.php?id=61589589836390" target="_blank" rel="noopener noreferrer" className="footer-red" aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://www.instagram.com/aluminios_seve/" target="_blank" rel="noopener noreferrer" className="footer-red" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="https://www.tiktok.com/@TU_USUARIO" target="_blank" rel="noopener noreferrer" className="footer-red" aria-label="TikTok">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>
              </a>
            </div>
          </div>

          {/* Columna 2 — Navegación */}
          <div className="footer-col">
            <h4 className="footer-col-title">Navegación</h4>
            <ul className="footer-nav">
              <li><a href="#" onClick={(e) => { e.preventDefault(); setVista("inicio"); }}>Inicio</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setVista("productos"); }}>Productos</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setVista("ofertas"); }}>Ofertas</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setVista("carrito"); }}>Carrito</a></li>
            </ul>
          </div>

          {/* Columna 3 — Contacto */}
          <div className="footer-col">
            <h4 className="footer-col-title">Contacto</h4>
            <ul className="footer-nav">
              <li>
                <a href="https://wa.me/573228877166" target="_blank" rel="noopener noreferrer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:6,verticalAlign:"middle"}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  +57 322 887 7166
                </a>
              </li>
              <li>
                <a href="mailto:aluminioseve2000@gmail.com">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:6,verticalAlign:"middle"}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  aluminioseve2000@gmail.com
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          <span>&copy; 2026 SEVE Aluminios. Todos los derechos reservados.</span>
          <div className="footer-bottom-links">
            <a href="#" onClick={(e) => { e.preventDefault(); setVista("politica-privacidad"); }}>Política de privacidad</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setVista("terminos-condiciones"); }}>Política de cookies</a>
          </div>
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

      <CookieBanner onVerPolitica={() => setVista("terminos-condiciones")} />

      <CarritoDrawer
        abierto={carritoAbierto}
        onCerrar={() => setCarritoAbierto(false)}
        bloquearCheckout={esPreviewClienteAdmin}
      />
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
