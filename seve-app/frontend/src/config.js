/**
 * Configuracion centralizada del frontend
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

export const WOMPI_PEDIDO_STORAGE_KEY = "seve_wompi_pedido";
