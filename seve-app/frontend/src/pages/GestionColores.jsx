import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "@/config";
import "./empleado.css";

const COLOR_MAP = {
  negro: "#1a1a1a", blanco: "#fff", rojo: "#d32f2f", azul: "#1565c0",
  verde: "#2e7d32", naranja: "#e65100", amarillo: "#f9a825", gris: "#757575",
  cafe: "#5d4037", morado: "#6a1b9a", plateado: "#9e9e9e", dorado: "#f9a825",
};

function token() { return localStorage.getItem("seve_token"); }
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function GestionColores() {
  const [colores, setColores]       = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [nuevoNombre, setNuevo]     = useState("");
  const [guardando, setGuardando]   = useState(false);
  const [eliminandoId, setElimId]   = useState(null);
  const [mensaje, setMensaje]       = useState({ texto: "", tipo: "ok" });

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const { data } = await axios.get(`${API_BASE}/ubicaciones/colores-producto`, { headers: headers() });
      setColores(data);
    } catch {
      mostrarMensaje("No se pudieron cargar los colores", "error");
    }
    setCargando(false);
  }

  function mostrarMensaje(texto, tipo = "ok") {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "ok" }), 4000);
  }

  async function handleAgregar(e) {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    setGuardando(true);
    try {
      await axios.post(`${API_BASE}/ubicaciones/colores-producto`, { nombre: nuevoNombre.trim() }, { headers: headers() });
      setNuevo("");
      mostrarMensaje("Color agregado");
      await cargar();
    } catch (err) {
      mostrarMensaje(err?.response?.data?.error || "Error al agregar color", "error");
    }
    setGuardando(false);
  }

  async function handleEliminar(id, nombre) {
    if (!window.confirm(`¿Eliminar el color "${nombre}"?`)) return;
    setElimId(id);
    try {
      await axios.delete(`${API_BASE}/ubicaciones/colores-producto/${id}`, { headers: headers() });
      mostrarMensaje("Color eliminado");
      await cargar();
    } catch {
      mostrarMensaje("Error al eliminar color", "error");
    }
    setElimId(null);
  }

  const dotColor = (nombre) => COLOR_MAP[nombre?.toLowerCase()] || "#ccc";

  return (
    <div className="emp-seccion">
      <div className="emp-seccion-header">
        <div>
          <h1 className="emp-titulo">Colores de productos</h1>
          <p className="emp-desc">Gestiona los colores disponibles para productos y combos.</p>
        </div>
      </div>

      {mensaje.texto && (
        <div className={`emp-mensaje emp-mensaje--${mensaje.tipo}`}>{mensaje.texto}</div>
      )}

      <form className="emp-form" onSubmit={handleAgregar} style={{ maxWidth: 420 }}>
        <label className="emp-label">
          Nuevo color
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <input
              className="emp-input"
              value={nuevoNombre}
              onChange={(e) => setNuevo(e.target.value)}
              placeholder="ej: plateado"
              style={{ flex: 1 }}
            />
            <button type="submit" className="emp-btn emp-btn--primario" disabled={guardando || !nuevoNombre.trim()}>
              {guardando ? "..." : "Agregar"}
            </button>
          </div>
        </label>
      </form>

      <div style={{ marginTop: 24 }}>
        {cargando ? (
          <p className="emp-vacio">Cargando...</p>
        ) : colores.length === 0 ? (
          <p className="emp-vacio">No hay colores registrados.</p>
        ) : (
          <div className="emp-colores" style={{ gap: 10 }}>
            {colores.map((c) => (
              <div
                key={c._id}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 10px 7px 12px", borderRadius: 100,
                  border: "1.5px solid #e0e0e0", background: "#fff",
                  fontSize: 13, fontWeight: 600, color: "#333",
                }}
              >
                <span
                  style={{
                    width: 13, height: 13, borderRadius: "50%",
                    background: dotColor(c.nombre),
                    border: "1.5px solid rgba(0,0,0,0.12)", flexShrink: 0,
                  }}
                />
                <span style={{ textTransform: "capitalize" }}>{c.nombre}</span>
                <button
                  type="button"
                  onClick={() => handleEliminar(c._id, c.nombre)}
                  disabled={eliminandoId === c._id}
                  style={{
                    marginLeft: 4, width: 20, height: 20, borderRadius: "50%",
                    background: "#fee2e2", border: "none", color: "#c0392b",
                    cursor: "pointer", fontSize: 14, lineHeight: 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
