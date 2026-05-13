import axios from "axios";
import { API_BASE } from "@/config";

export function comprimirImagen(archivo, maxWidth = 900, calidad = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(archivo);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const ratio = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", calidad));
    };
    img.src = objectUrl;
  });
}

export async function subirImagen(base64, carpeta = "seve-aluminios") {
  const token = localStorage.getItem("seve_token");
  const { data } = await axios.post(
    `${API_BASE}/upload`,
    { imagen: base64, carpeta },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data.url;
}
