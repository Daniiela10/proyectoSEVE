import { useApp } from "./context/AppContext";
import Header from "./components/Header";
import PerfilUsuario from "./components/PerfilUsuario";
import Inicio from "./pages/Inicio";
import Productos from "./pages/Productos";
import Ofertas from "./pages/Ofertas";
import Carrito from "./pages/Carrito";
import Historial from "./pages/Historial";
import Contacto from "./pages/Contacto";
import GestionPedidos from "./pages/GestionPedidos";
import ModalLogin from "./components/ModalLogin";

export default function App() {
  const { vista } = useApp();

  return (
    <div>
      <Header />
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
          <a href="#">Políticas de privacidad</a>
          <a href="#">Términos y condiciones</a>
        </div>
      </footer>
    </div>
  );
}
