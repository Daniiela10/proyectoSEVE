import { useState } from "react";

export default function PasswordInput({ className = "", style, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`password-input-wrap${className ? ` ${className}` : ""}`}>
      <input {...props} type={visible ? "text" : "password"} className="password-input" style={style} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((valor) => !valor)}
        aria-label={visible ? "Ocultar contrasena" : "Mostrar contrasena"}
        title={visible ? "Ocultar contrasena" : "Mostrar contrasena"}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4" />
            <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.5 4.2 9.7 6a2.2 2.2 0 0 1 0 2.1 16.5 16.5 0 0 1-2 2.5" />
            <path d="M6.5 6.5A16.4 16.4 0 0 0 2.3 10a2.2 2.2 0 0 0 0 2.1C3.5 13.8 7 18 12 18a10.7 10.7 0 0 0 4.1-.8" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2.3 10a2.2 2.2 0 0 0 0 2.1C3.5 13.8 7 18 12 18s8.5-4.2 9.7-6a2.2 2.2 0 0 0 0-2.1C20.5 8.2 17 4 12 4S3.5 8.2 2.3 10z" />
            <circle cx="12" cy="11" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
