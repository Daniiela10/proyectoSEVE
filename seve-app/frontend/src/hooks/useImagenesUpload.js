import { useState } from "react";
import axios from "axios";
import { API_BASE } from "@/config";

const MAX_IMAGENES = 4;

export function useImagenesUpload(imagenesIniciales = []) {
  const [imagenes, setImagenes] = useState(imagenesIniciales); // array de URLs
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function agregarImagenes(archivos) {
    const disponibles = MAX_IMAGENES - imagenes.length;
    if (disponibles <= 0) {
      setError(`Máximo ${MAX_IMAGENES} imágenes por producto`);
      return;
    }

    const seleccionados = Array.from(archivos).slice(0, disponibles);
    setSubiendo(true);
    setError("");

    try {
        const token = localStorage.getItem("seve_token");
        const nuevasUrls = await Promise.all(
        seleccionados.map(async (archivo) => {
            const base64 = await new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result);
            reader.onerror = rej;
            reader.readAsDataURL(archivo);
        });

          // Subir a Cloudinary via backend
          const { data } = await axios.post(
            `${API_BASE}/upload`,
            { imagen: base64 },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          return data.url;
        })
      );

      setImagenes((prev) => [...prev, ...nuevasUrls]);
    } catch (err) {
      setError(err?.response?.data?.error || "Error al subir imagen");
    } finally {
      setSubiendo(false);
    }
  }

  async function eliminarImagen(url) {
    try {
        const token = localStorage.getItem("seve_token");
        await axios.delete(`${API_BASE}/upload`, {
        data: { url },
        headers: { Authorization: `Bearer ${token}` },
    });
    } catch {
    }
    setImagenes((prev) => prev.filter((u) => u !== url));
    }

  function reordenar(desde, hasta) {
    setImagenes((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(desde, 1);
      arr.splice(hasta, 0, item);
      return arr;
    });
  }

  return {
    imagenes,
    setImagenes,
    subiendo,
    error,
    agregarImagenes,
    eliminarImagen,
    reordenar,
    maxAlcanzado: imagenes.length >= MAX_IMAGENES,
  };
}
