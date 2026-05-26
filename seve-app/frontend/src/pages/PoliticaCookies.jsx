import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";

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
  const [activeSection, setActiveSection] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  return (
    <div style={styles.page}>
      <div style={{ ...styles.header, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-20px)", transition: "all 0.6s ease" }}>
        <button type="button" style={styles.btnVolver} onClick={() => setVista("inicio")}>
          ← Volver
        </button>
        <div style={styles.headerInner}>
          <span style={styles.badge}>Aluminios SEVE</span>
          <h1 style={styles.title}>Política de Cookies</h1>
          <p style={styles.subtitle}>Última actualización: mayo de 2026</p>
        </div>
        <div style={styles.headerAccent} />
      </div>

      <div style={{ ...styles.intro, opacity: visible ? 1 : 0, transition: "all 0.6s ease 0.2s" }}>
        <p style={styles.introText}>
          En <strong>Aluminios SEVE</strong> utilizamos cookies en nuestro sitio web para mejorar su experiencia
          de navegación. Esta política le explica qué son las cookies, cómo las usamos y cómo puede controlarlas.
        </p>
      </div>

      <div style={{ ...styles.typesWrapper, opacity: visible ? 1 : 0, transition: "all 0.6s ease 0.35s" }}>
        <p style={styles.typesLabel}>Tipos de cookies que utilizamos</p>
        <div style={styles.typesGrid}>
          {cookieTypes.map((ct) => (
            <div key={ct.name} style={styles.typeCard}>
              <div style={styles.typeIcon}>{ct.icon}</div>
              <div>
                <div style={styles.typeName}>
                  {ct.name}
                  {ct.required && <span style={styles.requiredBadge}>Requerida</span>}
                </div>
                <p style={styles.typeDesc}>{ct.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.sectionsGrid}>
        {sections.map((sec, i) => (
          <div
            key={sec.number}
            style={{
              ...styles.card,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(30px)",
              transition: `all 0.5s ease ${0.1 * i + 0.5}s`,
              borderLeft: activeSection === i ? "4px solid #C0602A" : "4px solid transparent",
              background: activeSection === i ? "#FFF7F4" : "#fff",
            }}
            onClick={() => setActiveSection(activeSection === i ? null : i)}
          >
            <div style={styles.cardHeader}>
              <span style={styles.sectionNumber}>{sec.number}</span>
              <h2 style={styles.sectionTitle}>{sec.title}</h2>
              <span style={{ ...styles.arrow, transform: activeSection === i ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
            </div>
            {activeSection === i && (
              <p style={styles.cardContent}>{sec.content}</p>
            )}
          </div>
        ))}
      </div>

      <div style={{ ...styles.footer, opacity: visible ? 1 : 0, transition: "all 0.6s ease 1.2s" }}>
        <div style={styles.footerLine} />
        <p style={styles.footerText}>
          Al continuar navegando en nuestro sitio web, usted acepta el uso de cookies conforme a esta política.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F9F5F2",
    fontFamily: "'Georgia', serif",
    padding: "0 0 60px 0",
  },
  header: {
    background: "#000000",
    border: "1.5px solid #c41e3a",
    position: "relative",
    overflow: "hidden",
    padding: "60px 40px 50px",
    textAlign: "center",
  },
  btnVolver: {
    position: "absolute",
    top: "20px",
    left: "20px",
    background: "transparent",
    border: "1px solid rgba(196,30,58,0.5)",
    color: "#c41e3a",
    borderRadius: "8px",
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "sans-serif",
    fontWeight: "600",
    zIndex: 3,
  },
  headerInner: { position: "relative", zIndex: 2 },
  headerAccent: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: "4px",
    background: "linear-gradient(90deg, transparent, #c41e3a, transparent)",
  },
  badge: {
    display: "inline-block",
    background: "rgba(192, 96, 42, 0.2)",
    border: "1px solid rgba(192, 96, 42, 0.5)",
    color: "#E8884A",
    fontSize: "12px",
    fontFamily: "sans-serif",
    letterSpacing: "3px",
    textTransform: "uppercase",
    padding: "6px 16px",
    borderRadius: "20px",
    marginBottom: "20px",
  },
  title: {
    color: "#fff",
    fontSize: "clamp(28px, 5vw, 48px)",
    fontWeight: "400",
    margin: "0 0 12px 0",
    letterSpacing: "-0.5px",
  },
  subtitle: { color: "rgba(255,255,255,0.45)", fontSize: "14px", fontFamily: "sans-serif", margin: 0 },
  intro: { maxWidth: "720px", margin: "40px auto 20px", padding: "0 24px" },
  introText: {
    fontSize: "16px",
    lineHeight: "1.8",
    color: "#5C3A28",
    background: "#fff",
    border: "1px solid #E8C9B8",
    borderRadius: "12px",
    padding: "24px 28px",
    margin: 0,
    fontFamily: "sans-serif",
  },
  typesWrapper: { maxWidth: "720px", margin: "0 auto 8px", padding: "0 24px" },
  typesLabel: {
    fontSize: "11px",
    fontFamily: "sans-serif",
    letterSpacing: "2px",
    textTransform: "uppercase",
    color: "#A07060",
    marginBottom: "12px",
  },
  typesGrid: { display: "flex", flexDirection: "column", gap: "10px" },
  typeCard: {
    background: "#fff",
    border: "1px solid #E8C9B8",
    borderRadius: "10px",
    padding: "16px 20px",
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
  },
  typeIcon: { fontSize: "22px", lineHeight: 1, marginTop: "2px" },
  typeName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1A0A04",
    fontFamily: "sans-serif",
    marginBottom: "4px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  requiredBadge: {
    fontSize: "10px",
    background: "#FFF0E8",
    color: "#C0602A",
    border: "1px solid #E8C9B8",
    borderRadius: "20px",
    padding: "2px 8px",
    fontWeight: "500",
  },
  typeDesc: { fontSize: "13px", color: "#7A5040", lineHeight: "1.6", margin: 0, fontFamily: "sans-serif" },
  sectionsGrid: {
    maxWidth: "720px",
    margin: "16px auto 0",
    padding: "0 24px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  card: {
    background: "#fff",
    borderRadius: "10px",
    padding: "20px 24px",
    cursor: "pointer",
    border: "1px solid #E8C9B8",
    borderLeft: "4px solid transparent",
  },
  cardHeader: { display: "flex", alignItems: "center", gap: "16px" },
  sectionNumber: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#C0602A",
    fontFamily: "sans-serif",
    letterSpacing: "1px",
    minWidth: "28px",
  },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1A0A04",
    margin: 0,
    flex: 1,
    fontFamily: "sans-serif",
  },
  arrow: { fontSize: "10px", color: "#C0602A", transition: "transform 0.3s ease" },
  cardContent: {
    fontSize: "14px",
    lineHeight: "1.75",
    color: "#5C3A28",
    margin: "16px 0 0 44px",
    fontFamily: "sans-serif",
  },
  footer: { maxWidth: "720px", margin: "32px auto 0", padding: "0 24px", textAlign: "center" },
  footerLine: {
    height: "2px",
    background: "linear-gradient(90deg, transparent, #C0602A, transparent)",
    marginBottom: "20px",
  },
  footerText: { fontSize: "13px", color: "#A07060", fontFamily: "sans-serif", fontStyle: "italic", margin: 0 },
};
