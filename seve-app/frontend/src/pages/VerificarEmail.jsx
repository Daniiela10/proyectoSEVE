import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { API_BASE } from "@/config";
import axios from "axios";

export default function VerificarEmail() {
    const { setVista } = useApp();
    const [estado, setEstado] = useState("cargando"); // "cargando" | "ok" | "error"
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");

    if (!token) {
        setEstado("error");
        setMensaje("No se encontró el token de verificación.");
        return;
    }

    axios.get(`${API_BASE}/auth/verificar-email?token=${token}`)
        .then(({ data }) => {
        setEstado("ok");
        setMensaje(data.mensaje);
    })
        .catch(err => {
        setEstado("error");
        setMensaje(err.response?.data?.error || "El enlace es inválido o ya expiró.");
    });
}, []);

    return (
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "60px 40px", background: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", maxWidth: 460 }}>
        {estado === "cargando" && (
            <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h2>Verificando tu correo...</h2>
            </>
        )}
        {estado === "ok" && (
            <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: "#1a1a1a", marginBottom: 10 }}>¡Correo verificado!</h2>
            <p style={{ color: "#666", marginBottom: 28 }}>{mensaje}</p>
            <button className="btn btn-primary" onClick={() => { setVista("login"); window.history.pushState({}, "", "/"); }}>
                Iniciar sesión
            </button>
        </>
        )}
        {estado === "error" && (
            <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
            <h2 style={{ color: "#c0392b", marginBottom: 10 }}>Enlace inválido</h2>
            <p style={{ color: "#666", marginBottom: 28 }}>{mensaje}</p>
            <button className="btn btn-ghost" onClick={() => { setVista("login"); window.history.pushState({}, "", "/"); }}>
                Volver al inicio
            </button>
        </>
        )}
        </div>
    </div>
    );
}