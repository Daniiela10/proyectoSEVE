import { createContext, useContext, useState } from "react";
import axios from "axios";

const AppContext = createContext();
const API = "http://localhost:3001/api";

export function AppProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [items, setItems] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [busqueda, setBusqueda] = useState("");

  // ── Carrito ──────────────────────────────
  function agregarAlCarrito(producto, cantidad = 1) {
    setItems(prev => {
      const existe = prev.find(i => i.producto.id === producto.id);
      if (existe) {
        return prev.map(i => i.producto.id === producto.id
          ? { ...i, cantidad: i.cantidad + cantidad }
          : i);
      }
      return [...prev, { producto, cantidad }];
    });
  }

  function eliminarDelCarrito(id) {
    setItems(prev => prev.filter(i => i.producto.id !== id));
  }

  function cambiarCantidad(id, delta) {
    setItems(prev => prev
      .map(i => i.producto.id === id ? { ...i, cantidad: i.cantidad + delta } : i)
      .filter(i => i.cantidad > 0)
    );
  }

  function totalCarrito() {
    return items.reduce((sum, i) => sum + i.producto.precio * i.cantidad, 0);
  }

  function cantidadCarrito() {
    return items.reduce((sum, i) => sum + i.cantidad, 0);
  }

  function vaciarCarrito() {
    setItems([]);
  }

  // ── Auth ─────────────────────────────────
  async function login(email, password) {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    setUsuario(data);
    localStorage.setItem("seve_token", data.token);
    return data;
  }

  async function registro(nombre, email, password) {
    const { data } = await axios.post(`${API}/auth/registro`, { nombre, email, password });
    setUsuario(data);
    localStorage.setItem("seve_token", data.token);
    return data;
  }

  function cerrarSesion() {
    setUsuario(null);
    localStorage.removeItem("seve_token");
    setVista("inicio");
  }

  // ── Pedidos ──────────────────────────────
  async function crearPedido(datosPedido) {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.post(`${API}/pedidos`, datosPedido, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  }

  async function obtenerHistorial() {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.get(`${API}/pedidos/historial`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  }

  return (
    <AppContext.Provider value={{
        usuario, setUsuario, vista, setVista,
        busqueda, setBusqueda,
        items, agregarAlCarrito, eliminarDelCarrito,
        cambiarCantidad, totalCarrito, cantidadCarrito, vaciarCarrito,
        login, registro, cerrarSesion,
        crearPedido, obtenerHistorial
    }}>
        {children}
    </AppContext.Provider>
    );
}

export function useApp() {
  return useContext(AppContext);
}