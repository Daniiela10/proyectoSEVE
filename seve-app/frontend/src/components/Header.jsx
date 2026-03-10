import { useState } from "react";
import { useApp } from "../context/AppContext";
import { listaProductos } from "../data";

export default function Header({ onAbrirCarrito }) {
  const { usuario, cerrarSesion, setVista, cantidadCarrito, vista, setBusqueda } = useApp();
  const [busquedaLocal, setBusquedaLocal] = useState("");
  const [sugerencias, setSugerencias] = useState([]);

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
      <a href="#" className="logo" onClick={(e) => { e.preventDefault(); setVista("inicio"); limpiarBusqueda(); }}>
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
                onClick={(e) => { e.preventDefault(); setVista(v); limpiarBusqueda(); }}>
                {label}
              </a>
            </li>
          ))}

          {/* Carrito */}
          <li className="nav-cliente">
            <a href="#" className="nav-link nav-carrito"
              onClick={(e) => {
                e.preventDefault();
                if (onAbrirCarrito) {
                  onAbrirCarrito();
                } else {
                  setVista("carrito");
                  limpiarBusqueda();
                }
              }}>
              Carrito <span className="badge">{cantidadCarrito()}</span>
            </a>
          </li>

          {usuario && !usuario.esAdmin && (
            <li className="nav-cliente">
              <a href="#" className={`nav-link${vista === "historial" ? " active" : ""}`}
                onClick={(e) => { e.preventDefault(); setVista("historial"); }}>
                Historial de compras
              </a>
            </li>
          )}

          {usuario?.esAdmin && (
            <li className="nav-admin">
              <a href="#" className={`nav-link${vista === "gestion-pedidos" ? " active" : ""}`}
                onClick={(e) => { e.preventDefault(); setVista("gestion-pedidos"); }}>
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
          <>
            <span className="user-badge">Hola, <strong>{usuario.nombre}</strong></span>
            <button className="btn btn-ghost btn-cerrar-sesion" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </>
        )}
      </div>
    </header>
  );
}
