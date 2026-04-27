import { useRef } from "react";

export default function ImagenesUploader({
  imagenes = [],
  subiendo = false,
  error = "",
  maxAlcanzado = false,
  onAgregar,
  onEliminar,
}) {
  const inputRef = useRef(null);

  return (
    <div>
      <span className="emp-label" style={{ display: "block", marginBottom: 8 }}>
        Fotos del producto <span className="emp-label-hint">({imagenes.length}/4 — la primera es la principal)</span>
      </span>

      {/* Grid de miniaturas */}
      {imagenes.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginBottom: 12,
        }}>
          {imagenes.map((url, i) => (
            <div key={url} style={{ position: "relative" }}>
              <img
                src={url}
                alt={`Foto ${i + 1}`}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  objectFit: "cover",
                  borderRadius: 10,
                  border: i === 0 ? "2px solid #c0392b" : "1px solid #eee",
                  display: "block",
                }}
              />
              {/* Badge principal */}
              {i === 0 && (
                <span style={{
                  position: "absolute",
                  top: 5,
                  left: 5,
                  background: "#c0392b",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 20,
                  letterSpacing: "0.3px",
                }}>
                  PRINCIPAL
                </span>
              )}
              {/* Botón eliminar */}
              <button
                type="button"
                onClick={() => onEliminar(url)}
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  border: "none",
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
                title="Eliminar"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botón agregar */}
      {!maxAlcanzado && (
        <label className="emp-file-label" style={{ cursor: subiendo ? "not-allowed" : "pointer" }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="emp-file-input"
            disabled={subiendo}
            onChange={(e) => onAgregar(e.target.files)}
          />
          <span className="emp-file-btn" style={{ opacity: subiendo ? 0.6 : 1 }}>
            {subiendo ? (
              <>⏳ Subiendo...</>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {imagenes.length === 0 ? "Elegir imágenes" : "Agregar más"}
              </>
            )}
          </span>
          <span className="emp-file-nombre">
            {imagenes.length === 0
              ? "Ninguna imagen elegida"
              : `${imagenes.length} imagen${imagenes.length !== 1 ? "es" : ""} cargada${imagenes.length !== 1 ? "s" : ""}`}
          </span>
        </label>
      )}

      {maxAlcanzado && (
        <p style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
          Máximo 4 imágenes alcanzado. Elimina una para agregar otra.
        </p>
      )}

      {error && (
        <p style={{ fontSize: 12, color: "#c0392b", marginTop: 6, fontWeight: 600 }}>{error}</p>
      )}
    </div>
  );
}
