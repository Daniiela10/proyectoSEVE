import { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE } from "@/config";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [items, setItems] = useState([]);
  const [vista, setVista] = useState("inicio");
  const [busqueda, setBusqueda] = useState("");
  const [checkoutPasoInicial, setCheckoutPasoInicial] = useState(1);

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

  function iniciarCheckout(paso = 2) {
    setCheckoutPasoInicial(paso);
    setVista("carrito");
  }

  function resetCheckout() {
    setCheckoutPasoInicial(1);
  }

  // ── Auth ─────────────────────────────────
  async function login(email, password) {
    const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
    setUsuario(data);
    localStorage.setItem("seve_token", data.token);
    return data;
  }

  async function registro(nombres, apellidos, email, password) {
    const { data } = await axios.post(`${API}/auth/registro`, { nombres, apellidos, email, password });
    setUsuario(data);
    localStorage.setItem("seve_token", data.token);
    return data;
  }

  function cerrarSesion() {
    setUsuario(null);
    localStorage.removeItem("seve_token");
    setVista("inicio");
  }

  // ── Perfil de usuario ────────────────────
  async function obtenerPerfil() {
    const token = localStorage.getItem("seve_token");
    if (!token) return null;
    try {
      const { data } = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuario(prev => ({ ...prev, ...data }));
      return data;
    } catch (err) {
      console.error("Error al obtener perfil:", err);
      return null;
    }
  }

  async function actualizarPerfil(datos) {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.put(`${API}/auth/perfil`, datos, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUsuario(prev => ({ ...prev, ...data }));
    return data;
  }

  // ── Pedidos ──────────────────────────────
  async function crearPedido(datosPedido) {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.post(`${API_BASE}/pedidos`, datosPedido, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  }

  const obtenerHistorial = useCallback(async () => {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.get(`${API_BASE}/pedidos/historial`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  }, []);

  return (
    <AppContext.Provider value={{
        usuario, setUsuario, vista, setVista,
        busqueda, setBusqueda,
        checkoutPasoInicial, iniciarCheckout, resetCheckout,
        items, agregarAlCarrito, eliminarDelCarrito,
        cambiarCantidad, totalCarrito, cantidadCarrito, vaciarCarrito,
        login, registro, cerrarSesion,
        obtenerPerfil, actualizarPerfil,
        crearPedido, obtenerHistorial
    }}>
        {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
