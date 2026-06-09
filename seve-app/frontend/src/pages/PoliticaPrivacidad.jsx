import { useApp } from "@/context/AppContext";
import "./politicas.css";

const sections = [
  {
    number: "1",
    title: "Información que recopilamos",
    content:
      "Cuando usted realiza un pedido o se pone en contacto con nosotros, podemos recopilar: nombre completo, número de teléfono o celular, dirección de entrega, correo electrónico (si aplica), e información sobre su pedido como productos, cantidades y método de pago.",
  },
  {
    number: "2",
    title: "Uso de la información",
    content:
      "La información recopilada se utiliza únicamente para procesar y confirmar sus pedidos de ollas y utensilios de aluminio, coordinar la entrega de sus productos, responder sus preguntas y brindar atención al cliente, y mejorar nuestros productos y servicios.",
  },
  {
    number: "3",
    title: "Protección de sus datos",
    content:
      "Aluminios SEVE se compromete a proteger la información personal de sus clientes. Sus datos no serán vendidos, cedidos ni compartidos con terceros sin su consentimiento expreso, salvo cuando sea requerido por la ley o sea estrictamente necesario para completar la entrega de su pedido.",
  },
  {
    number: "4",
    title: "Almacenamiento de la información",
    content:
      "Sus datos personales son almacenados de forma segura y se conservan únicamente durante el tiempo necesario para cumplir con los fines descritos en esta política o con las obligaciones legales que correspondan.",
  },
  {
    number: "5",
    title: "Sus derechos como cliente",
    content:
      "Usted tiene derecho a acceder a la información personal que tenemos sobre usted, solicitar la corrección de datos incorrectos, y solicitar la eliminación de su información personal. Para ejercer cualquiera de estos derechos, puede comunicarse directamente con nosotros.",
  },
  {
    number: "6",
    title: "Cambios a esta política",
    content:
      "Aluminios SEVE se reserva el derecho de actualizar esta Política de Privacidad en cualquier momento. Le recomendamos revisarla periódicamente. Los cambios entrarán en vigencia desde su publicación.",
  },
  {
    number: "7",
    title: "Contacto",
    content:
      "Si tiene preguntas, dudas o solicitudes relacionadas con el manejo de su información personal, puede comunicarse con nosotros a través de los canales de atención disponibles en nuestra página web o escribirnos a aluminioseve2000@gmail.com.",
  },
];

export default function PoliticaPrivacidad() {
  const { setVista } = useApp();

  return (
    <div className="pol-page">
      <div className="pol-hero">
        <button type="button" className="pol-btn-volver" onClick={() => setVista("inicio")}>
          ← Volver
        </button>
        <div className="pol-hero-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Aluminios SEVE
        </div>
        <h1 className="pol-hero-title">Política de Privacidad</h1>
        <p className="pol-hero-date">Última actualización: mayo de 2026</p>
      </div>

      <div className="pol-body">
        <div className="pol-intro">
          <p>
            En <strong>Aluminios SEVE</strong> nos comprometemos a proteger y respetar la privacidad de nuestros
            clientes. Esta política explica cómo recopilamos, usamos y protegemos su información personal cuando
            realiza una compra o se comunica con nosotros.
          </p>
        </div>

        {sections.map((sec) => (
          <div key={sec.number} className="pol-section">
            <div className="pol-section-header">
              <div className="pol-section-num">{sec.number}</div>
              <h2 className="pol-section-title">{sec.title}</h2>
            </div>
            <p className="pol-section-content">{sec.content}</p>
          </div>
        ))}

        <div className="pol-footer">
          <p>Al adquirir nuestros productos, usted acepta los términos de esta Política de Privacidad.</p>
        </div>
      </div>
    </div>
  );
}
