import { useEffect } from "react";
import PerfilUsuario from "@/components/PerfilUsuario";

export default function PerfilDrawer({ abierto, onCerrar }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onCerrar?.();
    }

    if (abierto) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abierto, onCerrar]);

  return (
    <>
      {abierto && (
        <div
          onClick={onCerrar}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 9998,
          }}
        />
      )}

      <aside
        aria-hidden={!abierto}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: 520,
          maxWidth: "96vw",
          background: "#fff",
          zIndex: 9999,
          boxShadow: "-12px 0 40px rgba(0,0,0,0.18)",
          transform: abierto ? "translateX(0)" : "translateX(105%)",
          transition: "transform 220ms ease",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid #eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <strong style={{ fontSize: 16 }}>Editar mi perfil</strong>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid #eee",
              background: "#fff",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "0 0 18px" }}>
          <PerfilUsuario />
        </div>
      </aside>
    </>
  );
}
