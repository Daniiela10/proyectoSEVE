import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { obtenerItemsStaff } from "@/config/permisos";

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

const CLIENTE_ITEMS = [
  { vista: "inicio", label: "Inicio" },
  { vista: "productos", label: "Productos" },
  { vista: "ofertas", label: "Ofertas" },
  { vista: "compra-mayor", label: "Por Mayor" },
];

// --- Config del reverse sticky header ---
// Al SUBIR, con un movimiento mínimo ya debe reaparecer ("de una").
const HEADER_SHOW_THRESHOLD = 4;
// Al BAJAR, pedimos un poco más de movimiento para ocultarlo (evita que un
// scroll accidental de unos pocos px lo esconda).
const HEADER_HIDE_THRESHOLD = 24;
// Zona superior (px) donde el header siempre se muestra, sin importar la dirección.
const HEADER_TOP_OFFSET = 80;

function obtenerScrollY() {
  return (
    window.scrollY ||
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

export default function Header({ onAbrirCarrito, modoClientePreview = false }) {
  const { usuario, cerrarSesion, setVista, cantidadCarrito, vista, setBusqueda, productos, cartPulseKey, setCategoriaFiltro } = useApp();
  const [busquedaLocal, setBusquedaLocal] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [menuMobileAbierto, setMenuMobileAbierto] = useState(false);
  const [headerOculto, setHeaderOculto] = useState(false);
  const [carritoAnimado, setCarritoAnimado] = useState(false);

  const esAdmin = Boolean(usuario?.esAdmin);
  const esEmpleado = !esAdmin && usuario?.rol === "empleado";
  const esStaff = (esAdmin || esEmpleado) && !modoClientePreview;
  const menuItems = esStaff ? obtenerItemsStaff(usuario) : CLIENTE_ITEMS;
  const menuTitulo = esStaff ? (esAdmin ? "Panel administrador" : "Panel empleado") : "Menu";

  // Guarda la última posición conocida de scroll entre renders sin disparar
  // recálculos del efecto (no queremos "resetear" el punto de referencia
  // cada vez que cambian menuMobileAbierto / menuPerfilAbierto / sugerencias).
  const lastScrollY = useRef(typeof window !== "undefined" ? window.scrollY : 0);

  // --- Reverse sticky: ocultar al bajar, mostrar al subir ---
  useEffect(() => {
    // Mientras haya un dropdown/menú abierto que "cuelgue" del header,
    // lo forzamos visible para no arrastrarlo fuera de pantalla.
    const bloqueado = menuMobileAbierto || menuPerfilAbierto || sugerencias.length > 0;
    if (bloqueado) {
      setHeaderOculto(false);
      return;
    }

    let ticking = false;

    function evaluarScroll() {
      // Math.max(0, ...) descarta los valores negativos que iOS reporta
      // durante el "rubber-band" al pasar del tope de la página.
      const currentScrollY = Math.max(0, obtenerScrollY());
      const delta = currentScrollY - lastScrollY.current;

      if (currentScrollY <= HEADER_TOP_OFFSET) {
        setHeaderOculto(false);
      } else if (delta < -HEADER_SHOW_THRESHOLD) {
        // Subiendo: aparece de inmediato, con muy poco movimiento.
        setHeaderOculto(false);
      } else if (delta > HEADER_HIDE_THRESHOLD) {
        // Bajando: pedimos un poco más de movimiento para ocultarlo.
        setHeaderOculto(true);
      }

      lastScrollY.current = currentScrollY;
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(evaluarScroll);
        ticking = true;
      }
    }

    // Escuchamos en window (caso normal: la ventana completa hace scroll)
    // Y en document con capture:true (cubre el caso de que el scroll real
    // ocurra dentro de un contenedor interno, ej. un <div style="overflow-y:auto">
    // que envuelve el layout en vez de la ventana).
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
    };
  }, [menuMobileAbierto, menuPerfilAbierto, sugerencias.length]);

  useEffect(() => {
    if (!cartPulseKey) return;
    setCarritoAnimado(true);
    const timeout = window.setTimeout(() => setCarritoAnimado(false), 650);
    return () => window.clearTimeout(timeout);
  }, [cartPulseKey]);

  // --- Bloqueo real del scroll del body cuando el menú móvil está abierto ---
  // `overflow: hidden` no es suficiente en iOS Safari (el fondo igual puede
  // rebotar). Fijar el body en su posición actual sí lo evita, y al cerrar
  // se restaura exactamente el scroll donde estaba.
  useEffect(() => {
    if (!menuMobileAbierto) return;

    const scrollY = window.scrollY;
    const { body } = document;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.classList.add("mobile-menu-open");

    return () => {
      body.classList.remove("mobile-menu-open");
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [menuMobileAbierto]);

  useEffect(() => {
    function handleClickFuera(e) {
      if (!e.target.closest(".perfil-dropdown")) setMenuPerfilAbierto(false);
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

  return (
    <header className={`header${headerOculto ? " header-hidden" : ""}`}>
      <a
        href="#"
        className="logo"
        onClick={(e) => {
          e.preventDefault();
          if (modoClientePreview) setVista("preview-inicio-admin");
          else if (esAdmin) setVista("gestion-pedidos");
          else if (esEmpleado) setVista("emp-pedidos");
          else setVista("inicio");
          limpiarBusqueda();
        }}
      >
        <img src="/img/Logo.png" alt="SEVE" onError={(e) => (e.target.style.display = "none")} />
      </a>

      <button
        className="menu-hamburguesa"
        onClick={() => setMenuMobileAbierto(!menuMobileAbierto)}
        aria-label="Menu"
        aria-expanded={menuMobileAbierto}
        type="button"
      >
        <div className="menu-icono">
          <span></span><span></span><span></span>
        </div>
      </button>

      {!esStaff && (
        <div className="header-search-wrap">
          <div className="header-search-box">
            <input
              type="text"
              value={busquedaLocal}
              onChange={handleBusqueda}
              placeholder="Buscar productos..."
              className="header-search-input"
            />
            {busquedaLocal && (
              <button type="button" onClick={limpiarBusqueda} className="header-search-clear">�</button>
            )}
          </div>
          {sugerencias.length > 0 && (
            <div className="header-search-results">
              {sugerencias.map((p) => (
                <div
                  key={p.id}
                  onClick={() => seleccionarSugerencia(p)}
                  className="header-search-item"
                >
                  <img
                    src={p.imagen}
                    alt={p.nombre}
                    className="header-search-thumb"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                  <div>
                    <div className="header-search-name">{p.nombre}</div>
                    <div className="header-search-category">{p.categoria}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!esStaff && (
        <nav className="nav-principal">
          <ul>
            {[
              ...CLIENTE_ITEMS,
            ].map(({ vista: v, label }) => (
              <li key={v} className="nav-cliente">
                <a href="#" className={`nav-link${vista === v ? " active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCategoriaFiltro("todos");
                    setVista(modoClientePreview && v === "inicio" ? "preview-inicio-admin" : v);
                    limpiarBusqueda();
                  }}>
                  {label}
                </a>
              </li>
            ))}
            <li className="nav-cliente">
              <a href="#" className={`nav-link nav-carrito${carritoAnimado ? " is-bumping" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  onAbrirCarrito ? onAbrirCarrito() : setVista("carrito");
                  limpiarBusqueda();
                }}>
                Carrito <span className="badge">{cantidadCarrito()}</span>
              </a>
            </li>
          </ul>
        </nav>
      )}

      <div className="header-actions">
        {!usuario ? (
          <button className="btn btn-ghost" type="button" onClick={() => setVista("login")}>
            Iniciar sesion
          </button>
        ) : (
          <div className="perfil-dropdown" style={{ position: "relative" }}>
            <button
              className="btn-perfil"
              type="button"
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
              {usuario.fotoPerfil ? (
                <img
                  src={usuario.fotoPerfil}
                  alt="Foto de perfil"
                  style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "2px solid #f40808" }}
                />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f40808" style={{ width: 28, height: 28 }}>
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.349a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                </svg>
              )}
              <span style={{ color: "#333", fontSize: 14, fontWeight: 500 }}>Mi Cuenta</span>
            </button>

            {menuPerfilAbierto && (
              <div className="perfil-menu" style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "#fff", borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                border: "1px solid #eee", minWidth: "200px",
                overflow: "hidden", zIndex: 1000,
              }}>
                <div style={{ padding: "16px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 12 }}>
                  {usuario.fotoPerfil ? (
                    <img src={usuario.fotoPerfil} alt="Foto de perfil"
                      style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid #f40808", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#f40808,#ff6b6b)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" style={{ width: 22, height: 22 }}>
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.349a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: "#222" }}>{usuario.nombre || usuario.nombres}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>{usuario.email}</p>
                    {esStaff && (
                      <span style={{
                        display: "inline-block", marginTop: 6,
                        background: esAdmin ? "#fdecef" : "#fff3e0",
                        color: esAdmin ? "#c41e3a" : "#e65100",
                        fontSize: 11, fontWeight: 700, padding: "2px 8px",
                        borderRadius: 20, letterSpacing: "0.3px",
                      }}>
                        {esAdmin ? "Administrador" : "Empleado"}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ padding: "8px" }}>
                  <button
                    type="button"
                    onClick={() => { setVista("perfil"); setMenuPerfilAbierto(false); }}
                    style={profileMenuBtnStyle}
                  >
                    Editar mi perfil
                  </button>
                  {!esStaff && (
                    <button
                      type="button"
                      onClick={() => { setVista("historial"); setMenuPerfilAbierto(false); }}
                      style={profileMenuBtnStyle}
                    >
                      Mis pedidos
                    </button>
                  )}
                  <button
                    type="button"
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

      {menuMobileAbierto && (
        <>
        <div className="menu-mobile-backdrop" onClick={() => setMenuMobileAbierto(false)} />
        <aside className="menu-mobile" aria-label="Menu lateral">
          <div className="menu-mobile-header">
            <div>
              <span className="menu-mobile-kicker">{menuTitulo}</span>
              <strong>{usuario ? usuario.nombre || usuario.nombres || "Mi cuenta" : "SEVE Aluminios"}</strong>
            </div>
            <button
              type="button"
              className="menu-mobile-close"
              onClick={() => setMenuMobileAbierto(false)}
              aria-label="Cerrar menu"
            >
              ×
            </button>
          </div>

          <ul className="menu-mobile-ul">
            {menuItems.map(({ vista: v, label }) => (
              <li key={v}>
                <a href="#" className={`menu-mobile-link${vista === v ? " active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCategoriaFiltro("todos");
                    setVista(modoClientePreview && v === "inicio" ? "preview-inicio-admin" : v);
                    limpiarBusqueda();
                    setMenuMobileAbierto(false);
                  }}>
                  {label}
                </a>
              </li>
            ))}
            {!esStaff && (
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
          </ul>

          <div className="menu-mobile-actions">
            {!usuario ? (
              <button className="btn btn-primary" type="button" onClick={() => { setVista("login"); setMenuMobileAbierto(false); }}>
                Iniciar sesion
              </button>
            ) : (
              <div className="menu-mobile-user">
                <p className="menu-mobile-user-name">{usuario.nombre || usuario.nombres}</p>
                <button type="button" className="menu-mobile-link" onClick={() => { setVista("perfil"); setMenuMobileAbierto(false); }}>
                  Editar mi perfil
                </button>
                {!esStaff && (
                  <button type="button" className="menu-mobile-link" onClick={() => { setVista("historial"); setMenuMobileAbierto(false); }}>
                    Mis pedidos
                  </button>
                )}
                <button type="button" className="menu-mobile-link"
                  onClick={() => { cerrarSesion(); setMenuMobileAbierto(false); }}
                  style={{ color: "#f40808" }}>
                  Cerrar sesion
                </button>
              </div>
            )}
          </div>
        </aside>
        </>
      )}
    </header>
  );
}
