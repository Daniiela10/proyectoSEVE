import { useApp } from "@/context/AppContext";
import "./politicas.css";

const cookieTypes = [
  {
    name: "Esenciales",
    description: "Necesarias para el funcionamiento básico del sitio. Sin estas, algunas partes no funcionarían.",
    required: true,
  },
  {
    name: "Estadísticas",
    description: "Nos permiten conocer cómo los visitantes interactúan con el sitio de forma anónima para mejorarlo.",
    required: false,
  },
  {
    name: "Preferencias",
    description: "Permiten que el sitio recuerde sus preferencias de navegación como idioma o región.",
    required: false,
  },
];

const sections = [
  {
    number: "1",
    title: "¿Qué son las cookies?",
    content:
      "Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita un sitio web. Sirven para recordar sus preferencias, analizar cómo usa el sitio y mejorar su experiencia de navegación.",
  },
  {
    number: "2",
    title: "¿Para qué las usamos?",
    content:
      "Utilizamos cookies para garantizar el correcto funcionamiento de nuestro sitio web, recordar sus preferencias de navegación, analizar el tráfico de manera anónima, y mejorar continuamente la experiencia de nuestros clientes.",
  },
  {
    number: "3",
    title: "¿Recopilan información personal?",
    content:
      "Las cookies que utilizamos en Aluminios SEVE no recopilan información personal identificable como su nombre, dirección o datos de pago. En caso de requerir datos personales, esto se indicará claramente y se solicitará su consentimiento.",
  },
  {
    number: "4",
    title: "¿Cómo desactivarlas?",
    content:
      "Puede controlar y eliminar las cookies desde la configuración de su navegador: en Chrome vaya a Configuración › Privacidad y seguridad › Cookies; en Firefox vaya a Opciones › Privacidad y seguridad; en Safari vaya a Preferencias › Privacidad; en Edge vaya a Configuración › Privacidad y servicios.",
  },
  {
    number: "5",
    title: "Cookies de terceros",
    content:
      "Nuestro sitio puede incluir herramientas de terceros como Google Analytics que también instalan cookies en su dispositivo. Estas están sujetas a las políticas de privacidad de dichos terceros, sobre las cuales Aluminios SEVE no tiene control.",
  },
  {
    number: "6",
    title: "Cambios a esta política",
    content:
      "Aluminios SEVE se reserva el derecho de actualizar esta Política de Cookies cuando sea necesario. Los cambios entrarán en vigencia desde su publicación en el sitio web.",
  },
];

export default function PoliticaCookies() {
  const { setVista } = useApp();

  return (
    <div className="pol-page">
      <div className="pol-hero">
        <button type="button" className="pol-btn-volver" onClick={() => setVista("inicio")}>
          ← Volver
        </button>
        <div className="pol-hero-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><circle cx="9" cy="9" r="1.5" fill="#111"/><circle cx="15" cy="8" r="1" fill="#111"/><circle cx="14" cy="14" r="1.5" fill="#111"/></svg>
          Aluminios SEVE
        </div>
        <h1 className="pol-hero-title">Política de Cookies</h1>
        <p className="pol-hero-date">Última actualización: mayo de 2026</p>
      </div>

      <div className="pol-body">
        <div className="pol-intro">
          <p>
            En <strong>Aluminios SEVE</strong> utilizamos cookies en nuestro sitio web para mejorar su experiencia
            de navegación. Esta política le explica qué son las cookies, cómo las usamos y cómo puede controlarlas.
          </p>
        </div>

        <p className="pol-types-label">Tipos de cookies que utilizamos</p>
        <div className="pol-types-grid">
          {cookieTypes.map((ct) => (
            <div key={ct.name} className="pol-type-card">
              <div className="pol-type-dot" />
              <div>
                <div className="pol-type-name">
                  {ct.name}
                  {ct.required && <span className="pol-type-required">Requerida</span>}
                </div>
                <p className="pol-type-desc">{ct.description}</p>
              </div>
            </div>
          ))}
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
          <p>Al continuar navegando en nuestro sitio web, usted acepta el uso de cookies conforme a esta política.</p>
        </div>
      </div>
    </div>
  );
}
