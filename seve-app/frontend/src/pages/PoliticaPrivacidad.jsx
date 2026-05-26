import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";

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
      "Si tiene preguntas, dudas o solicitudes relacionadas con el manejo de su información personal, puede comunicarse con nosotros a través de los canales de atención disponibles en nuestra página web.",
  },
];

export default function PoliticaPrivacidad() {
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
          <h1 style={styles.title}>Política de Privacidad</h1>
          <p style={styles.subtitle}>Última actualización: mayo de 2026</p>
        </div>
        <div style={styles.headerAccent} />
      </div>

      <div style={{ ...styles.intro, opacity: visible ? 1 : 0, transition: "all 0.6s ease 0.2s" }}>
        <p style={styles.introText}>
          En <strong>Aluminios SEVE</strong> nos comprometemos a proteger y respetar la privacidad de nuestros clientes.
          Esta política explica cómo recopilamos, usamos y protegemos su información personal cuando realiza una compra
          o se comunica con nosotros.
        </p>
      </div>

      <div style={styles.sectionsGrid}>
        {sections.map((sec, i) => (
          <div
            key={sec.number}
            style={{
              ...styles.card,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(30px)",
              transition: `all 0.5s ease ${0.1 * i + 0.3}s`,
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
          Al adquirir nuestros productos, usted acepta los términos de esta Política de Privacidad.
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
  sectionsGrid: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "16px 24px",
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
  footer: { maxWidth: "720px", margin: "24px auto 0", padding: "0 24px", textAlign: "center" },
  footerLine: {
    height: "2px",
    background: "linear-gradient(90deg, transparent, #C0602A, transparent)",
    marginBottom: "20px",
  },
  footerText: { fontSize: "13px", color: "#A07060", fontFamily: "sans-serif", fontStyle: "italic", margin: 0 },
};
