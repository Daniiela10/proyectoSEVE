import { createContext, useContext, useState, useCallback, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "@/config";

const AppContext = createContext();
const CARRITO_STORAGE_KEY = "seve_carrito";
const VISTA_STORAGE_KEY = "seve_vista";

function carritoKeyUsuario(usuario) {
  const id = usuario?.id || usuario?._id || usuario?.email;
  return id ? `${CARRITO_STORAGE_KEY}:${String(id).toLowerCase()}` : CARRITO_STORAGE_KEY;
}

function normalizarProducto(producto) {
  if (!producto) return null;
  const precioNormal = Number(producto.precioNormal ?? producto.precio ?? 0);
  const precioOferta =
    producto.precioOferta === null || producto.precioOferta === undefined || producto.precioOferta === ""
      ? null
      : Number(producto.precioOferta);
  const enOferta = Boolean(producto.enOferta) && precioOferta !== null;
  const precioFinal = enOferta ? precioOferta : precioNormal;
  return {
    ...producto,
    id: producto._id || producto.id,
    precio: precioFinal,
    precioNormal,
    precioOferta,
    descripcion: Array.isArray(producto.descripcion) ? producto.descripcion : [],
    colores: Array.isArray(producto.colores) ? producto.colores : [],
    imagenes: Array.isArray(producto.imagenes) ? producto.imagenes : [],
    imagenesColor: (producto.imagenesColor && typeof producto.imagenesColor === 'object') ? producto.imagenesColor : {},
    imagenVista: (() => {
      if (producto.imagen) return producto.imagen;
      const ic = producto.imagenesColor;
      if (ic && typeof ic === 'object') {
        for (const key of Object.keys(ic)) {
          const primera = [].concat(ic[key] || []).find(Boolean);
          if (primera) return primera;
        }
      }
      return "";
    })(),
    precioMayorista: producto.precioMayorista ? Number(producto.precioMayorista) : null,
    minimoMayorista: producto.minimoMayorista ? Number(producto.minimoMayorista) : 4,
    enOferta,
    activo: producto.activo !== false,
  };
}

function ordenarProductosAdmin(lista = []) {
  return [...lista].sort((a, b) => {
    if (Boolean(a?.activo) !== Boolean(b?.activo)) {
      return Number(Boolean(b?.activo)) - Number(Boolean(a?.activo));
    }
    return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
  });
}

function obtenerVistaInicial() {
  try {
    return localStorage.getItem(VISTA_STORAGE_KEY) || "inicio";
  } catch {
    return "inicio";
  }
}

export function AppProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [items, setItems] = useState(() => {
    try {
      if (!localStorage.getItem("seve_token")) return [];
      const guardado = localStorage.getItem(CARRITO_STORAGE_KEY);
      return guardado ? JSON.parse(guardado) : [];
    } catch {
      return [];
    }
  });
  const [vista, setVistaState] = useState(obtenerVistaInicial);
  const [busqueda, setBusqueda] = useState("");
  const [checkoutPasoInicial, setCheckoutPasoInicial] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productos, setProductos] = useState([]);
  const [productosAdmin, setProductosAdmin] = useState([]);
  const [productosCargando, setProductosCargando] = useState(false);
  const [cartFeedback, setCartFeedback] = useState(null);
  const [cartPulseKey, setCartPulseKey] = useState(0);
  const [categoriaFiltro, setCategoriaFiltro] = useState("todos");

  useEffect(() => {
    const token = localStorage.getItem("seve_token");
    cargarProductos();
    if (!token) return;
    obtenerPerfil();
  }, []);

  useEffect(() => {
    try {
      if (usuario) {
        localStorage.setItem(carritoKeyUsuario(usuario), JSON.stringify(items));
      } else {
        localStorage.removeItem(CARRITO_STORAGE_KEY);
      }
    } catch {}
  }, [items, usuario]);

  useEffect(() => {
    try {
      localStorage.setItem(VISTA_STORAGE_KEY, vista);
    } catch {}
  }, [vista]);

  useEffect(() => {
    if (!cartFeedback) return undefined;
    const timeout = window.setTimeout(() => setCartFeedback(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [cartFeedback]);

  function setVista(nuevaVista) {
    setVistaState(nuevaVista);
  }

  // ── Productos ────────────────────────────
  async function cargarProductos() {
    try {
      setProductosCargando(true);
      const { data } = await axios.get(`${API_BASE}/productos`);
      setProductos(data.map(normalizarProducto).filter(Boolean));
      return data;
    } catch (err) {
      console.error("Error al obtener productos:", err);
      setProductos([]);
      return [];
    } finally {
      setProductosCargando(false);
    }
  }

  async function cargarProductosAdmin() {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.get(`${API_BASE}/productos/admin/todos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const normalizados = ordenarProductosAdmin(data.map(normalizarProducto).filter(Boolean));
    setProductosAdmin(normalizados);
    return normalizados;
  }

  async function crearProducto(datosProducto) {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.post(`${API_BASE}/productos`, datosProducto, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await Promise.all([cargarProductos(), cargarProductosAdmin()]);
    return normalizarProducto(data);
  }

  async function editarProducto(id, datosProducto) {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.put(`${API_BASE}/productos/${id}`, datosProducto, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await Promise.all([cargarProductos(), cargarProductosAdmin()]);
    return normalizarProducto(data);
  }

  async function eliminarProducto(id) {
  const token = localStorage.getItem("seve_token");
  await axios.delete(`${API_BASE}/productos/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  // Quita el producto de ambas listas locales sin recargar todo
  setProductosAdmin((prev) => prev.filter((p) => p.id !== id));
  setProductos((prev) => prev.filter((p) => p.id !== id));
}

  async function actualizarEstadoProducto(id, activo) {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.patch(
      `${API_BASE}/productos/${id}/activo`,
      { activo },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const normalizado = normalizarProducto(data);
    setProductosAdmin((prev) =>
      ordenarProductosAdmin(prev.map((item) => (item.id === normalizado.id ? normalizado : item)))
    );
    if (activo) {
      setProductos((prev) => {
        const existe = prev.some((item) => item.id === normalizado.id);
        return existe
          ? prev.map((item) => (item.id === normalizado.id ? normalizado : item))
          : [...prev, normalizado];
      });
    } else {
      setProductos((prev) => prev.filter((item) => item.id !== normalizado.id));
    }
    return normalizado;
  }

  // ── Carrito ──────────────────────────────
  function agregarAlCarrito(producto, cantidad = 1) {
    setItems((prev) => {
      const color = producto.color || "";
      const existe = prev.find((i) => i.producto.id === producto.id && (i.producto.color || "") === color);
      if (existe) {
        return prev.map((i) =>
          i.producto.id === producto.id && (i.producto.color || "") === color
            ? { ...i, cantidad: i.cantidad + cantidad }
            : i
        );
      }
      return [...prev, { producto, cantidad }];
    });
    setCartFeedback({
      productoId: producto.id,
      nombre: producto.nombre,
      cantidad,
    });
    setCartPulseKey((prev) => prev + 1);
  }

  function eliminarDelCarrito(id, color = null) {
    setItems((prev) => prev.filter((i) => {
      const coincideProducto = i.producto.id === id;
      const coincideColor = color === null || (i.producto.color || "") === color;
      return !(coincideProducto && coincideColor);
    }));
  }

  function cambiarCantidad(id, delta, color = null) {
    setItems((prev) =>
      prev
        .map((i) => (
          i.producto.id === id && (color === null || (i.producto.color || "") === color)
            ? { ...i, cantidad: i.cantidad + delta }
            : i
        ))
        .filter((i) => i.cantidad > 0)
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
    try {
      const guardado = localStorage.getItem(carritoKeyUsuario(data));
      setItems(guardado ? JSON.parse(guardado) : []);
    } catch {
      setItems([]);
    }

    // Redirigir según rol
    if (data?.esAdmin) {
      setVista("gestion-pedidos");
    } else if (data?.rol === "empleado") {
      setVista("emp-pedidos");
    } else {
      setVista("inicio");
    }
    return data;
  }

  async function registro(nombres, apellidos, email, password) {
    const { data } = await axios.post(`${API_BASE}/auth/registro`, {
      nombres, apellidos, email, password,
    });
    return data;
  }

  async function verificarEmail(email, codigo) {
    const { data } = await axios.post(`${API_BASE}/auth/verificar-email`, { email, codigo });
    return data;
  }

  async function reenviarCodigoVerificacion(email) {
    const { data } = await axios.post(`${API_BASE}/auth/reenviar-codigo-verificacion`, { email });
    return data;
  }

  async function forgotPassword(email) {
    const { data } = await axios.post(`${API_BASE}/auth/forgot-password`, { email });
    return data;
  }

  async function resetPassword(token, password) {
    const { data } = await axios.post(`${API_BASE}/auth/reset-password`, { token, password });
    return data;
  }

  function cerrarSesion() {
    if (usuario) {
      try {
        localStorage.setItem(carritoKeyUsuario(usuario), JSON.stringify(items));
      } catch {}
    }
    setUsuario(null);
    setItems([]);
    localStorage.removeItem("seve_token");
    localStorage.removeItem(CARRITO_STORAGE_KEY);
    localStorage.removeItem(VISTA_STORAGE_KEY);
    setVista("inicio");
  }

  // ── Perfil ───────────────────────────────
  async function obtenerPerfil() {
    const token = localStorage.getItem("seve_token");
    if (!token) return null;
    try {
      const { data } = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsuario((prev) => ({ ...prev, ...data }));
      try {
        const guardado = localStorage.getItem(carritoKeyUsuario(data));
        setItems(guardado ? JSON.parse(guardado) : []);
      } catch {}

      setVistaState((vistaActual) => {
        const esAdmin    = Boolean(data?.esAdmin);
        const esEmpleado = !esAdmin && data?.rol === "empleado";

        // Vistas exclusivas de admin
        const vistasAdmin = [
          "gestion-pedidos", "gestion-envios", "roles",
          "historial-ventas", "editar-productos", "productos-oferta-admin",
          "gestion-carrusel", "preview-inicio-admin",
        ];
        // Vistas exclusivas de empleado
        const vistasEmpleado = ["emp-productos", "emp-pedidos"];
        // Vistas de clientes que no aplican a staff
        const vistasCliente = ["inicio", "productos", "ofertas", "carrito"];

        if (esAdmin && vistasCliente.includes(vistaActual)) {
          return "gestion-pedidos";
        }
        if (esEmpleado && vistasCliente.includes(vistaActual)) {
          return "emp-pedidos";
        }
        // Si no es admin y está en una vista admin → redirigir
        if (!esAdmin && vistasAdmin.includes(vistaActual)) {
          return esEmpleado ? "emp-pedidos" : "inicio";
        }
        // Si no es empleado y está en una vista empleado → redirigir
        if (!esEmpleado && !esAdmin && vistasEmpleado.includes(vistaActual)) {
          return "inicio";
        }

        return vistaActual;
      });

      return data;
    } catch (err) {
      console.error("Error al obtener perfil:", err);
      return null;
    }
  }

  async function actualizarPerfil(datos) {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.put(`${API_BASE}/auth/perfil`, datos, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsuario((prev) => ({ ...prev, ...data }));
    return data;
  }

  async function verificarCambioEmail(codigo) {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.post(
      `${API_BASE}/auth/perfil/verificar-cambio-email`,
      { codigo },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setUsuario((prev) => ({ ...prev, ...data }));
    return data;
  }

  async function reenviarCambioEmail() {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.post(
      `${API_BASE}/auth/perfil/reenviar-cambio-email`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  }

  async function obtenerUsuarios() {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.get(`${API_BASE}/auth/usuarios`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }

  async function actualizarRolUsuario(id, rol) {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.patch(
      `${API_BASE}/auth/usuarios/${id}/rol`,
      { rol },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  }

  async function actualizarUsuarioAdmin(id, datosUsuario) {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.patch(
      `${API_BASE}/auth/usuarios/${id}`,
      datosUsuario,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  }

  // ── Pedidos ──────────────────────────────
  async function crearPedido(datosPedido) {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.post(`${API_BASE}/pedidos`, datosPedido, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }

  const obtenerHistorial = useCallback(async () => {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.get(`${API_BASE}/pedidos/historial`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }, []);

  // ── Pedidos empleado ─────────────────────
  // Requiere endpoint GET /pedidos/todos (accesible por empleado y admin)
  async function obtenerTodosPedidos() {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.get(`${API_BASE}/pedidos/todos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  }

  // Requiere endpoint PATCH /pedidos/:id/estado (accesible por empleado y admin)
  async function actualizarEstadoPedido(id, estado) {
    const token = localStorage.getItem("seve_token");
    const { data } = await axios.patch(
      `${API_BASE}/pedidos/${id}/estado`,
      { estado },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  }

  return (
    <AppContext.Provider
      value={{
        usuario, setUsuario, vista, setVista,
        busqueda, setBusqueda,
        checkoutPasoInicial, iniciarCheckout, resetCheckout,
        productos, productosAdmin, productosCargando,
        cargarProductos, cargarProductosAdmin,
        crearProducto, editarProducto, actualizarEstadoProducto, eliminarProducto,
        items, agregarAlCarrito, eliminarDelCarrito,
        cambiarCantidad, totalCarrito, cantidadCarrito, vaciarCarrito,
        cartFeedback, cartPulseKey,
        categoriaFiltro, setCategoriaFiltro,
        login, registro, verificarEmail, reenviarCodigoVerificacion,
        forgotPassword, resetPassword, cerrarSesion,
        obtenerPerfil, actualizarPerfil, verificarCambioEmail, reenviarCambioEmail,
        obtenerUsuarios, actualizarRolUsuario, actualizarUsuarioAdmin,
        crearPedido, obtenerHistorial,
        obtenerTodosPedidos, actualizarEstadoPedido,
        selectedProduct, setSelectedProduct,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
