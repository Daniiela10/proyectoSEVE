import { useState } from "react";
import { useApp } from "../context/AppContext";
import { listaProductos } from "../data";

export default function Header() {
  const { usuario, cerrarSesion, setVista, cantidadCarrito, vista, setBusqueda } = useApp();
  const [busquedaLocal, setBusquedaLocal] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);

  function handleBusqueda(e) {
    const valor = e.target.value;
    setBusquedaLocal(valor);
    setBusqueda(valor);

    if (valor.trim().length > 1) {
      const resultados = listaProductos.filter(p =>
        p.nombre.toLowerCase().includes(valor.toLowerCase()) ||
        p.categoria.toLowerCase().includes(valor.toLowerCase())
      ).slice(0, 5);
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
    <header className="header" style={{ position: "relative", zIndex: 100 }}>
      {/* Logo */}
      <a href="#" className="logo" onClick={() => { setVista("inicio"); limpiarBusqueda(); }}>
        <img src="/img/Logo.jpeg" alt="SEVE" onError={e => e.target.style.display = "none"} />
        <span className="logo-text">SEVE</span>
      </a>

      {/* Barra de búsqueda */}
      <div style={{ position: "relative", flex: 1, maxWidth: 420, margin: "0 24px" }}>
        <div style={{
          display: "flex", alignItems: "center",
          background: "#fff", borderRadius: 8,
          border: "2px solid #f40808", overflow: "visible",
          transition: "border-color 0.2s",
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

        {/* Sugerencias desplegables */}
        {sugerencias.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
            background: "#fff", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            border: "1px solid #eee", zIndex: 999, overflow: "hidden",
          }}>
            {sugerencias.map(p => (
              <div key={p.id} onClick={() => seleccionarSugerencia(p)} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 16px", cursor: "pointer",
                borderBottom: "1px solid #f5f5f5",
                transition: "background 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "#fff5f5"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                <img src={p.imagen} alt={p.nombre}
                  style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6 }}
                  onError={e => e.target.style.display = "none"}
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

      {/* Navegación */}
      <nav className="nav-principal">
        <ul>
          {[
            { vista: "inicio", label: "Inicio" },
            { vista: "productos", label: "Productos" },
            { vista: "ofertas", label: "Ofertas" },
            { vista: "contacto", label: "Contacto" },
          ].map(({ vista: v, label }) => (
            <li key={v} className="nav-cliente">
              <a href="#" className={`nav-link${vista === v ? " active" : ""}`}
                onClick={() => { setVista(v); limpiarBusqueda(); }}>
                {label}
              </a>
            </li>
          ))}

          <li className="nav-cliente">
            <a href="#" className={`nav-link nav-carrito${vista === "carrito" ? " active" : ""}`}
              onClick={() => { setVista("carrito"); limpiarBusqueda(); }}>
              Carrito <span className="badge">{cantidadCarrito()}</span>
            </a>
          </li>

          {usuario && !usuario.esAdmin && (
            <li className="nav-cliente">
              <a href="#" className={`nav-link${vista === "historial" ? " active" : ""}`}
                onClick={() => setVista("historial")}>
                Historial de compras
              </a>
            </li>
          )}

          {usuario?.esAdmin && (
            <li className="nav-admin">
              <a href="#" className={`nav-link${vista === "gestion-pedidos" ? " active" : ""}`}
                onClick={() => setVista("gestion-pedidos")}>
                Gestión de pedidos
              </a>
            </li>
          )}
        </ul>
      </nav>

      {/* Acciones de usuario */}
      <div className="header-actions">
        {!usuario ? (
          <button
            className="btn btn-ghost"
            onClick={() => {
              setVista("login");
            }}
          >
            Iniciar sesión
          </button>
        ) : (
          <div className="perfil-dropdown" style={{ position: "relative" }}>
            <button 
              className="btn-perfil"
              onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}
              title="Mi cuenta"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "8px",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(244,8,8,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
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
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                border: "1px solid #eee",
                minWidth: "200px",
                overflow: "hidden",
                zIndex: 1000,
              }}>
                <div style={{ padding: "16px", borderBottom: "1px solid #eee" }}>
                  <p style={{ margin: 0, fontWeight: 600, color: "#222" }}>{usuario.nombre}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>{usuario.email}</p>
                </div>
                <div style={{ padding: "8px" }}>
                  <button 
                    onClick={() => { setVista("perfil"); setMenuPerfilAbierto(false); }}
                    style={{
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
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    ✏️ Editar mi perfil
                  </button>
                  <button 
                    onClick={() => { setVista("historial"); setMenuPerfilAbierto(false); }}
                    style={{
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
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    📦 Mis pedidos
                  </button>
                  <button 
                    onClick={() => { cerrarSesion(); setMenuPerfilAbierto(false); }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 16px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: 14,
                      color: "#f40808",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fff5f5"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    🚪 Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
