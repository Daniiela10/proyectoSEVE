import { useState } from "react";

export default function Contacto() {
  const [enviado, setEnviado] = useState(false);

  return (
    <div className="contacto-wrap">
      <h1 className="titulo-vista">Contacto</h1>
      <p className="contacto-desc">¿Dudas o pedidos especiales? Escríbenos.</p>
      <div className="contacto-grid">
        <div className="contacto-info">
          <div className="contacto-card"><span className="icono">📍</span><h3>Dirección</h3><p>Calle Ejemplo Bosa, Bogotá</p></div>
          <div className="contacto-card"><span className="icono">📞</span><h3>Teléfono</h3><p>+57 300 123 4567</p></div>
          <div className="contacto-card"><span className="icono">✉️</span><h3>Email</h3><p>ventas@sevealuminios.com</p></div>
        </div>
        <form className="contacto-form" onSubmit={e => { e.preventDefault(); setEnviado(true); }}>
          <label>Nombre</label><input type="text" required placeholder="Tu nombre" />
          <label>Email</label><input type="email" required placeholder="tu@email.com" />
          <label>Mensaje</label><textarea rows="4" required placeholder="Tu mensaje..." />
          {enviado
            ? <p style={{ color: "green", fontWeight: 600 }}>✅ Mensaje enviado. ¡Te contactaremos pronto!</p>
            : <button type="submit" className="btn btn-primary">Enviar mensaje</button>
          }
        </form>
      </div>
    </div>
  );
}