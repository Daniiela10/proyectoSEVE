import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";

const adminDropdownBtnStyle = {
  display: "block",
  width: "100%",
  padding: "10px 16px",
  textAlign: "left",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
  color: "#333",
};

const profileMenuBtnStyle = {
  display: "block",
  width: "100%",
  padding: "10px 16px",
  textAlign: "left",
  background: "none",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: 14,
  color: "#333",
};

function DropdownChevron() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}

export default function Header({ onAbrirCarrito }) {
  const { usuario, cerrarSesion, setVista, cantidadCarrito, vista, setBusqueda, productos } = useApp();
  const [busquedaLocal, setBusquedaLocal] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [menuMobileAbierto, setMenuMobileAbierto] = useState(false);
  const [menuProductosAdminAbierto, setMenuProductosAdminAbierto] = useState(false);
  const [menuPedidosAdminAbierto, setMenuPedidosAdminAbierto] = useState(false);
  const [menuEmpleadoProductosAbierto, setMenuEmpleadoProductosAbierto] = useState(false);
  const [menuEmpleadoPedidosAbierto, setMenuEmpleadoPedidosAbierto] = useState(false);
  const [headerOculto, setHeaderOculto] = useState(false);

  const esAdmin    = Boolean(usuario?.esAdmin);
  const esEmpleado = !esAdmin && usuario?.rol === "empleado";

  useEffect(() => {
    let lastScrollY = window.scrollY;
    function onScroll() {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const shouldHide = scrollingDown && currentScrollY > 120 && !menuMobileAbierto;
      setHeaderOculto(shouldHide);
      lastScrollY = currentScrollY;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuMobileAbierto]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    function handleClickFuera(e) {
      if (!e.target.closest(".perfil-dropdown"))    setMenuPerfilAbierto(false);
      if (!e.target.closest(".nav-admin-productos")) setMenuProductosAdminAbierto(false);
      if (!e.target.closest(".nav-admin-pedidos"))   setMenuPedidosAdminAbierto(false);
      if (!e.target.closest(".nav-emp-productos"))   setMenuEmpleadoProductosAbierto(false);
      if (!e.target.closest(".nav-emp-pedidos"))     setMenuEmpleadoPedidosAbierto(false);
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  function handleBusqueda(e) {
    const valor = e.target.value;
    setBusquedaLocal(valor);
    setBusqueda(valor);
    if (valor.trim().length > 1) {
      const resultados = productos
        .filter((p) =>
          p.nombre.toLowerCase().includes(valor.toLowerCase()) ||
          p.categoria?.toLowerCase().includes(valor.toLowerCase())
        )
        .slice(0, 5);
      setSugerencias(resultados);
      if (vista !== "productos") setVista("productos");
    } else {
      setSugerencias([]);
    }
  }

  function seleccionarSugerencia(producto) {
    setBusquedaLocal(producto.nombre);
    setBusqueda(producto.nombre);
    setSugerencias([]);
    setVista("productos");
  }

  function limpiarBusqueda() {
    setBusquedaLocal("");
    setBusqueda("");
    setSugerencias([]);
  }

  function navegarAdmin(destino) {
    setVista(destino);
    setMenuProductosAdminAbierto(false);
    setMenuPedidosAdminAbierto(false);
    setMenuMobileAbierto(false);
  }

  function navegarEmpleado(destino) {
    setVista(destino);
    setMenuEmpleadoProductosAbierto(false);
    setMenuEmpleadoPedidosAbierto(false);
    setMenuMobileAbierto(false);
  }

  // Estilo reutilizable para dropdowns
  const dropdownStyle = {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    minWidth: "220px",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    border: "1px solid #eee",
    overflow: "hidden",
    zIndex: 1000,
  };

  return (
    <header className={`header${headerOculto ? " header-hidden" : ""}`} style={{ zIndex: 100 }}>
      {/* Logo */}
      <a
        href="#"
        className="logo"
        onClick={(e) => {
          e.preventDefault();
          if (esAdmin)    setVista("gestion-pedidos");
          else if (esEmpleado) setVista("emp-pedidos");
          else            setVista("inicio");
          limpiarBusqueda();
        }}
      >
        <img src="/img/Logo.jpeg" alt="SEVE" onError={(e) => (e.target.style.display = "none")} />
        <span className="logo-text">SEVE</span>
      </a>

      {/* Hamburguesa móvil */}
      <button
        className="menu-hamburguesa"
        onClick={() => setMenuMobileAbierto(!menuMobileAbierto)}
        aria-label="Menu"
      >
        <div className="menu-icono">
          <span></span><span></span><span></span>
        </div>
      </button>

      {/* Buscador (oculto para empleado y admin) */}
      {!esAdmin && !esEmpleado && (
        <div style={{ position: "relative", flex: 1, maxWidth: 420, margin: "0 24px" }}>
          <div style={{
            display: "flex", alignItems: "center",
            background: "#fff", borderRadius: 8,
            border: "2px solid #f40808", overflow: "visible",
          }}>
            <span style={{ padding: "0 10px 0 14px", color: "#999", fontSize: 16 }}></span>
            <input
              type="text"
              value={busquedaLocal}
              onChange={handleBusqueda}
              placeholder="Buscar productos..."
              style={{
                flex: 1, border: "none", outline: "none",
                padding: "10px 0", fontSize: 14,
                background: "transparent", fontFamily: "inherit",
              }}
            />
            {busquedaLocal && (
              <button onClick={limpiarBusqueda} style={{
                border: "none", background: "none", cursor: "pointer",
                padding: "0 12px", color: "#aaa", fontSize: 18, lineHeight: 1,
              }}>×</button>
            )}
          </div>
          {sugerencias.length > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
              background: "#fff", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              border: "1px solid #eee", zIndex: 999, overflow: "hidden",
            }}>
              {sugerencias.map((p) => (
                <div
                  key={p.id}
                  onClick={() => seleccionarSugerencia(p)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 16px", cursor: "pointer",
                    borderBottom: "1px solid #f5f5f5",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fff5f5")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >
                  <img src={p.imagen} alt={p.nombre}
                    style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6 }}
                    onError={(e) => (e.target.style.display = "none")}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>{p.nombre}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{p.categoria}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── NAV PRINCIPAL ── */}
      <nav className="nav-principal">
        <ul>

          {/* ── CLIENTE ── */}
          {!esAdmin && !esEmpleado && [
            { vista: "inicio",    label: "Inicio" },
            { vista: "productos", label: "Productos" },
            { vista: "ofertas",   label: "Ofertas" },
          ].map(({ vista: v, label }) => (
            <li key={v} className="nav-cliente">
              <a href="#" className={`nav-link${vista === v ? " active" : ""}`}
                onClick={(e) => { e.preventDefault(); setVista(v); limpiarBusqueda(); }}>
                {label}
              </a>
            </li>
          ))}

          {!esAdmin && !esEmpleado && (
            <li className="nav-cliente">
              <a href="#" className="nav-link nav-carrito"
                onClick={(e) => {
                  e.preventDefault();
                  onAbrirCarrito ? onAbrirCarrito() : setVista("carrito");
                  limpiarBusqueda();
                }}>
                Carrito <span className="badge">{cantidadCarrito()}</span>
              </a>
            </li>
          )}

          {/* ── EMPLEADO ── */}
          {esEmpleado && (
            <>
              {/* Productos empleado (dropdown) */}
              <li className="nav-admin nav-emp-productos" style={{ position: "relative" }}>
                <a
                  href="#"
                  className={`nav-link${vista === "emp-productos" ? " active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuEmpleadoProductosAbierto((v) => !v);
                    setMenuEmpleadoPedidosAbierto(false);
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Productos <DropdownChevron />
                  </span>
                </a>
                {menuEmpleadoProductosAbierto && (
                  <div style={dropdownStyle}>
                    <button onClick={() => navegarEmpleado("emp-productos")} style={adminDropdownBtnStyle}>
                      Gestionar productos
                    </button>
                  </div>
                )}
              </li>

              {/* Pedidos empleado (dropdown) */}
              <li className="nav-admin nav-emp-pedidos" style={{ position: "relative" }}>
                <a
                  href="#"
                  className={`nav-link${vista === "emp-pedidos" ? " active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuEmpleadoPedidosAbierto((v) => !v);
                    setMenuEmpleadoProductosAbierto(false);
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Pedidos <DropdownChevron />
                  </span>
                </a>
                {menuEmpleadoPedidosAbierto && (
                  <div style={dropdownStyle}>
                    <button onClick={() => navegarEmpleado("emp-pedidos")} style={adminDropdownBtnStyle}>
                      Gestionar pedidos
                    </button>
                    <button onClick={() => navegarEmpleado("emp-envios")} style={adminDropdownBtnStyle}>
                      Envíos y rastreo
                    </button>
                  </div>
                )}
              </li>
            </>
          )}

          {/* ── ADMIN ── */}
          {esAdmin && (
            <>
              <li className="nav-admin">
                <a href="#" className={`nav-link${vista === "roles" ? " active" : ""}`}
                  onClick={(e) => { e.preventDefault(); navegarAdmin("roles"); }}>
                  Roles
                </a>
              </li>

              <li className="nav-admin nav-admin-productos" style={{ position: "relative" }}>
                <a href="#"
                  className={`nav-link${vista === "editar-productos" || vista === "productos-oferta-admin" ? " active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuProductosAdminAbierto((v) => !v);
                    setMenuPedidosAdminAbierto(false);
                  }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Productos <DropdownChevron />
                  </span>
                </a>
                {menuProductosAdminAbierto && (
                  <div style={dropdownStyle}>
                    <button onClick={() => navegarAdmin("editar-productos")} style={adminDropdownBtnStyle}>
                      Editar productos
                    </button>
                    <button onClick={() => navegarAdmin("productos-oferta-admin")} style={adminDropdownBtnStyle}>
                      Productos en oferta
                    </button>
                  </div>
                )}
              </li>

              <li className="nav-admin">
                <a href="#" className={`nav-link${vista === "historial-ventas" ? " active" : ""}`}
                  onClick={(e) => { e.preventDefault(); navegarAdmin("historial-ventas"); }}>
                  Historial de ventas
                </a>
              </li>

              <li className="nav-admin nav-admin-pedidos" style={{ position: "relative" }}>
                <a href="#"
                  className={`nav-link${vista === "gestion-pedidos" || vista === "gestion-envios" ? " active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuPedidosAdminAbierto((v) => !v);
                    setMenuProductosAdminAbierto(false);
                  }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Gestion de pedidos <DropdownChevron />
                  </span>
                </a>
                {menuPedidosAdminAbierto && (
                  <div style={dropdownStyle}>
                    <button onClick={() => navegarAdmin("gestion-pedidos")} style={adminDropdownBtnStyle}>
                      Pedidos
                    </button>
                    <button onClick={() => navegarAdmin("gestion-envios")} style={adminDropdownBtnStyle}>
                      Envios y numero de rastreo
                    </button>
                  </div>
                )}
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* ── ACCIONES (Mi Cuenta) ── */}
      <div className="header-actions">
        {!usuario ? (
          <button className="btn btn-ghost" onClick={() => setVista("login")}>
            Iniciar sesion
          </button>
        ) : (
          <div className="perfil-dropdown" style={{ position: "relative" }}>
            <button
              className="btn-perfil"
              onClick={() => setMenuPerfilAbierto((v) => !v)}
              title="Mi cuenta"
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "none", border: "none", cursor: "pointer",
                padding: "8px 12px", borderRadius: "8px", transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(244,8,8,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f40808" style={{ width: 28, height: 28 }}>
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.349a.75.75 0 01-.437-.695z" clipRule="evenodd" />
              </svg>
              <span style={{ color: "#333", fontSize: 14, fontWeight: 500 }}>Mi Cuenta</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#666" style={{ width: 16, height: 16 }}>
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>

            {menuPerfilAbierto && (
              <div className="perfil-menu" style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "#fff", borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                border: "1px solid #eee", minWidth: "200px",
                overflow: "hidden", zIndex: 1000,
              }}>
                <div style={{ padding: "16px", borderBottom: "1px solid #eee" }}>
                  <p style={{ margin: 0, fontWeight: 600, color: "#222" }}>{usuario.nombre}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>{usuario.email}</p>
                  {esEmpleado && (
                    <span style={{
                      display: "inline-block", marginTop: 6,
                      background: "#fff3e0", color: "#e65100",
                      fontSize: 11, fontWeight: 700, padding: "2px 8px",
                      borderRadius: 20, letterSpacing: "0.3px",
                    }}>
                      Empleado
                    </span>
                  )}
                </div>
                <div style={{ padding: "8px" }}>
                  <button
                    onClick={() => { setVista("perfil"); setMenuPerfilAbierto(false); }}
                    style={profileMenuBtnStyle}
                  >
                    Editar mi perfil
                  </button>
                  {!esAdmin && !esEmpleado && (
                    <button
                      onClick={() => { setVista("historial"); setMenuPerfilAbierto(false); }}
                      style={profileMenuBtnStyle}
                    >
                      Mis pedidos
                    </button>
                  )}
                  <button
                    onClick={() => { cerrarSesion(); setMenuPerfilAbierto(false); }}
                    style={{ ...profileMenuBtnStyle, color: "#f40808" }}
                  >
                    Cerrar sesion
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MENÚ MÓVIL ── */}
      {menuMobileAbierto && (
        <div className="menu-mobile">
          <ul className="menu-mobile-ul">

            {/* Cliente */}
            {!esAdmin && !esEmpleado && [
              { vista: "inicio",    label: "Inicio" },
              { vista: "productos", label: "Productos" },
              { vista: "ofertas",   label: "Ofertas" },
            ].map(({ vista: v, label }) => (
              <li key={v}>
                <a href="#" className={`menu-mobile-link${vista === v ? " active" : ""}`}
                  onClick={(e) => { e.preventDefault(); setVista(v); limpiarBusqueda(); setMenuMobileAbierto(false); }}>
                  {label}
                </a>
              </li>
            ))}
            {!esAdmin && !esEmpleado && (
              <li>
                <a href="#" className="menu-mobile-link"
                  onClick={(e) => {
                    e.preventDefault();
                    onAbrirCarrito ? onAbrirCarrito() : setVista("carrito");
                    limpiarBusqueda();
                    setMenuMobileAbierto(false);
                  }}>
                  Carrito <span className="badge">{cantidadCarrito()}</span>
                </a>
              </li>
            )}

            {/* Empleado móvil */}
            {esEmpleado && (
              <>
                <li>
                  <a href="#" className={`menu-mobile-link${vista === "emp-productos" ? " active" : ""}`}
                    onClick={(e) => { e.preventDefault(); navegarEmpleado("emp-productos"); }}>
                    Gestionar productos
                  </a>
                </li>
                <li>
                  <a href="#" className={`menu-mobile-link${vista === "emp-pedidos" ? " active" : ""}`}
                    onClick={(e) => { e.preventDefault(); navegarEmpleado("emp-pedidos"); }}>
                    Gestionar pedidos
                  </a>
                </li>
                <li>
                  <a href="#" className={`menu-mobile-link${vista === "emp-envios" ? " active" : ""}`}
                    onClick={(e) => { e.preventDefault(); navegarEmpleado("emp-envios"); }}>
                    Envíos y rastreo
                  </a>
                </li>
              </>
            )}

            {/* Admin móvil */}
            {esAdmin && (
              <>
                <li>
                  <a href="#" className={`menu-mobile-link${vista === "roles" ? " active" : ""}`}
                    onClick={(e) => { e.preventDefault(); navegarAdmin("roles"); }}>Roles</a>
                </li>
                <li>
                  <a href="#" className={`menu-mobile-link${vista === "editar-productos" ? " active" : ""}`}
                    onClick={(e) => { e.preventDefault(); navegarAdmin("editar-productos"); }}>
                    Editar productos
                  </a>
                </li>
                <li>
                  <a href="#" className={`menu-mobile-link${vista === "productos-oferta-admin" ? " active" : ""}`}
                    onClick={(e) => { e.preventDefault(); navegarAdmin("productos-oferta-admin"); }}>
                    Productos en oferta
                  </a>
                </li>
                <li>
                  <a href="#" className={`menu-mobile-link${vista === "historial-ventas" ? " active" : ""}`}
                    onClick={(e) => { e.preventDefault(); navegarAdmin("historial-ventas"); }}>
                    Historial de ventas
                  </a>
                </li>
                <li>
                  <a href="#" className={`menu-mobile-link${vista === "gestion-pedidos" ? " active" : ""}`}
                    onClick={(e) => { e.preventDefault(); navegarAdmin("gestion-pedidos"); }}>
                    Gestion de pedidos - Pedidos
                  </a>
                </li>
                <li>
                  <a href="#" className={`menu-mobile-link${vista === "gestion-envios" ? " active" : ""}`}
                    onClick={(e) => { e.preventDefault(); navegarAdmin("gestion-envios"); }}>
                    Gestion de pedidos - Envios
                  </a>
                </li>
              </>
            )}
          </ul>

          <div className="menu-mobile-actions">
            {!usuario ? (
              <button className="btn btn-primary" onClick={() => { setVista("login"); setMenuMobileAbierto(false); }}>
                Iniciar sesion
              </button>
            ) : (
              <div className="menu-mobile-user">
                <p className="menu-mobile-user-name">{usuario.nombre}</p>
                <button className="menu-mobile-link" onClick={() => { setVista("perfil"); setMenuMobileAbierto(false); }}>
                  Editar mi perfil
                </button>
                {!esAdmin && !esEmpleado && (
                  <button className="menu-mobile-link" onClick={() => { setVista("historial"); setMenuMobileAbierto(false); }}>
                    Mis pedidos
                  </button>
                )}
                <button className="menu-mobile-link"
                  onClick={() => { cerrarSesion(); setMenuMobileAbierto(false); }}
                  style={{ color: "#f40808" }}>
                  Cerrar sesion
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
