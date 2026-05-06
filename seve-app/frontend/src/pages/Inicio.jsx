import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import ProductoCard from "@/components/ProductoCard";
import Categorias from "@/components/Categorias";

// ── Imagen por categoría ─────────────────────────────────────────
function getImagenCategoria(nombre) {
  if (!nombre) return null;
  const n = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const mapa = {
    "ollas": "/img/Categorias/ollas.png",
    "olletas": "/img/Categorias/olletas.png",
    "juego de ollas": "/img/Categorias/juegoDeOllas.png",
    "fiambreras": "/img/Categorias/fiambreras.png",
  };
  if (mapa[n]) return mapa[n];
  const clave = Object.keys(mapa).find((k) => n.includes(k) || k.includes(n));
  return clave ? mapa[clave] : null;
}

// ── Slides dinámicos ─────────────────────────────────────────────
const SLIDES = [
  {
    bg1: "#c0272d", bg2: "#7a1010",
    emoji: "🥘",
    badge: "✦ Nueva temporada 2026",
    tituloA: "Cocina con ", tituloB: "calidad", tituloC: " que dura toda la vida",
    colorB: "#d4a843",
    desc: "Ollas, fiambreras, freidoras y más. Aluminio de alta resistencia para hogares y cocinas profesionales.",
    cta: "Ver catálogo completo", ctaVista: "productos",
    cta2: "Ver ofertas →", cta2Vista: "ofertas",
  },
  {
    bg1: "#8b1a1e", bg2: "#c0272d",
    emoji: "🫕",
    badge: "🔥 Oferta especial",
    tituloA: "Juegos de ollas hasta ", tituloB: "40% off", tituloC: "",
    colorB: "#ffd700",
    desc: "Solo por tiempo limitado. Aprovecha nuestros precios especiales en sets completos.",
    cta: "Ver ofertas", ctaVista: "ofertas",
    cta2: "Ver productos →", cta2Vista: "productos",
  },
  {
    bg1: "#1a1a1a", bg2: "#3a0a0e",
    emoji: "👨‍🍳",
    badge: "⭐ Colección nueva",
    tituloA: "Línea ", tituloB: "Profesional", tituloC: " 2026",
    colorB: "#d4a843",
    desc: "Diseñada para chefs y cocinas industriales. Resistencia extrema y distribución uniforme del calor.",
    cta: "Explorar línea", ctaVista: "productos",
    cta2: "Conocer más →", cta2Vista: "productos",
  },
  {
    bg1: "#c0272d", bg2: "#1a1a1a",
    emoji: "🍟",
    badge: "🆕 Recién llegado",
    tituloA: "Freidoras ", tituloB: "premium", tituloC: " para tu cocina",
    colorB: "#d4a843",
    desc: "Freído perfecto con menos aceite. Tecnología antiadherente de última generación.",
    cta: "Ver freidoras", ctaVista: "productos",
    cta2: "Ver ofertas →", cta2Vista: "ofertas",
  },
];

const STORAGE_KEY = "seve_carrusel_imagenes";
function cargarImagenes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function guardarImagenes(imgs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(imgs)); } catch {}
}

// ── Carrusel cliente ─────────────────────────────────────────────
function HeroCarrusel({ setVista }) {
  const [imagenes] = useState(cargarImagenes);
  const [idx, setIdx] = useState(0);
  const [entrando, setEntrando] = useState(false);
  const [dir, setDir] = useState("next");
  const [slides] = useState(() => [...SLIDES].sort(() => Math.random() - 0.5));
  const timerRef = useRef(null);

  const usaImagenes = imagenes.length > 0;
  const total = usaImagenes ? imagenes.length : slides.length;

  const irA = useCallback((nuevoIdx, direccion) => {
    setDir(direccion);
    setEntrando(true);
    setTimeout(() => {
      setIdx(nuevoIdx);
      setEntrando(false);
    }, 350);
  }, []);

  const siguiente = useCallback(() => {
    irA((idx + 1) % total, "next");
  }, [idx, total, irA]);

  const anterior = useCallback(() => {
    irA((idx - 1 + total) % total, "prev");
  }, [idx, total, irA]);

  useEffect(() => {
    timerRef.current = setTimeout(siguiente, 5500);
    return () => clearTimeout(timerRef.current);
  }, [idx, siguiente]);

  const slide = usaImagenes ? null : slides[idx];
  const animClass = entrando
    ? dir === "next" ? " hc-anim-next" : " hc-anim-prev"
    : "";

  return (
    <section className="hc-root">
      <div className={`hc-inner${animClass}`}>
        {usaImagenes ? (
          <div className="hc-slide hc-slide-fullbg" style={{ background: "#111" }}>
            <img
              src={imagenes[idx]}
              alt={`Slide ${idx + 1}`}
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                display: "block", position: "absolute", inset: 0,
              }}
            />
            <div className="hc-overlay" />
          </div>
        ) : slide ? (
          <div
            className="hc-slide hc-slide-fullbg"
            style={{ background: `linear-gradient(135deg, ${slide.bg1} 0%, ${slide.bg2} 100%)` }}
          >
            <div className="hc-overlay" />
            <div className="hc-emoji-bg" aria-hidden="true">{slide.emoji}</div>
            <div className="hc-content-center">
              <div className="hc-badge">{slide.badge}</div>
              <h1 className="hc-title-center">
                {slide.tituloA}
                <em style={{ fontStyle: "normal", color: slide.colorB }}>{slide.tituloB}</em>
                {slide.tituloC}
              </h1>
              <p className="hc-desc-center">{slide.desc}</p>
              <div className="hc-ctas-center">
                <button className="btn btn-primary" onClick={() => setVista(slide.ctaVista)}>
                  {slide.cta}
                </button>
                <button className="hc-btn-outline" onClick={() => setVista(slide.cta2Vista)}>
                  {slide.cta2}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {total > 1 && (
        <>
          <button className="hc-arrow hc-arrow-prev" onClick={anterior} type="button" aria-label="Anterior">‹</button>
          <button className="hc-arrow hc-arrow-next" onClick={siguiente} type="button" aria-label="Siguiente">›</button>
        </>
      )}

      <div className="hc-dots">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            type="button"
            className={`hc-dot${i === idx ? " hc-dot-active" : ""}`}
            onClick={() => irA(i, i > idx ? "next" : "prev")}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

// ── Panel gestión carrusel (admin/empleado) ──────────────────────
export function GestionCarrusel() {
  const [imagenes, setImagenes] = useState(cargarImagenes);
  const inputRef = useRef(null);

  function handleSubir(e) {
    const archivos = Array.from(e.target.files);
    if (!archivos.length) return;
    Promise.all(
      archivos.map(
        (f) =>
          new Promise((res) => {
            const r = new FileReader();
            r.onload = (ev) => res(ev.target.result);
            r.readAsDataURL(f);
          })
      )
    ).then((bases64) => {
      const nuevas = [...imagenes, ...bases64];
      setImagenes(nuevas);
      guardarImagenes(nuevas);
    });
    e.target.value = "";
  }

  function eliminar(i) {
    const nuevas = imagenes.filter((_, j) => j !== i);
    setImagenes(nuevas);
    guardarImagenes(nuevas);
  }

  function mover(i, d) {
    const nuevas = [...imagenes];
    const j = i + d;
    if (j < 0 || j >= nuevas.length) return;
    [nuevas[i], nuevas[j]] = [nuevas[j], nuevas[i]];
    setImagenes(nuevas);
    guardarImagenes(nuevas);
  }

  return (
    <div className="gc-wrap">
      <div className="gc-header">
        <div>
          <h2 className="gc-title">Carrusel del inicio</h2>
          <p className="gc-sub">
            {imagenes.length === 0
              ? "Sin imágenes — los clientes ven slides animados automáticamente."
              : `${imagenes.length} imagen${imagenes.length !== 1 ? "es" : ""} activa${imagenes.length !== 1 ? "s" : ""}.`}
          </p>
        </div>
        <button className="gc-upload-btn" type="button" onClick={() => inputRef.current?.click()}>
          + Subir imágenes
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleSubir} />
      </div>

      {imagenes.length === 0 ? (
        <div className="gc-empty">
          <span style={{ fontSize: 44 }}>🖼️</span>
          <p style={{ fontWeight: 600, color: "#444" }}>No hay imágenes subidas</p>
          <p style={{ fontSize: 13, color: "#999" }}>Los clientes verán slides animados automáticamente.</p>
          <button className="gc-upload-btn" type="button" onClick={() => inputRef.current?.click()}>
            Subir primera imagen
          </button>
        </div>
      ) : (
        <div className="gc-grid">
          {imagenes.map((src, i) => (
            <div key={i} className="gc-item">
              <img src={src} alt={`Slide ${i + 1}`} className="gc-img" />
              <div className="gc-overlay">
                <span className="gc-num">#{i + 1}</span>
                <div className="gc-actions">
                  <button type="button" title="Mover izquierda" onClick={() => mover(i, -1)} disabled={i === 0}>◀</button>
                  <button type="button" title="Mover derecha" onClick={() => mover(i, 1)} disabled={i === imagenes.length - 1}>▶</button>
                  <button type="button" title="Eliminar" className="gc-del" onClick={() => eliminar(i)}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Página Inicio ────────────────────────────────────────────────
const TABS = ["Más vendidos", "Nuevos", "Ofertas"];

export default function Inicio() {
  const { setVista, productos } = useApp();
  const [tabActiva, setTabActiva] = useState("Más vendidos");

  const productosOferta = productos.filter((p) => p.enOferta);
  const productosNuevos = [...productos].reverse().slice(0, 8);
  const productosMasVendidos = productos.slice(0, 8);

  function getProductosPorTab() {
    if (tabActiva === "Ofertas") return productosOferta.slice(0, 8);
    if (tabActiva === "Nuevos") return productosNuevos;
    return productosMasVendidos;
  }

  const categoriasUnicas = [...new Set(productos.map((p) => p.categoria).filter(Boolean))];

  return (
    <div className="inicio-wrap">

      <HeroCarrusel setVista={setVista} />

      {/* ── CATEGORÍAS — Opción 3: cards fondo rojo suave + imagen real ── */}
      <section className="inicio-section">
        <div className="inicio-section-header">
          <h2 className="inicio-section-title">Categorías</h2>
          <button className="inicio-ver-mas" onClick={() => setVista("productos")}>Ver todas →</button>
        </div>

        {categoriasUnicas.length > 0 ? (
          <div className="cats3-grid">
            {categoriasUnicas.slice(0, 6).map((cat) => {
              const count = productos.filter((p) => p.categoria === cat).length;
              const img = getImagenCategoria(cat);
              return (
                <button
                  key={cat}
                  className="cats3-card"
                  onClick={() => setVista("productos")}
                  type="button"
                >
                  <div className="cats3-img-wrap">
                    {img
                      ? <img src={img} alt={cat} className="cats3-img" />
                      : <span className="cats3-emoji">📦</span>
                    }
                  </div>
                  <div className="cats3-info">
                    <span className="cats3-name">{cat}</span>
                    <span className="cats3-count">{count} productos</span>
                    <span className="cats3-ver">Ver →</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : <Categorias />}
      </section>

      {/* BANNERS */}
      <div className="inicio-banners">
        <button className="inicio-banner inicio-banner-red" onClick={() => setVista("ofertas")} type="button">
          <div>
            <div className="inicio-banner-tag">Oferta especial</div>
            <div className="inicio-banner-title">Juegos de ollas hasta 40% off</div>
            <div className="inicio-banner-sub">Solo por tiempo limitado</div>
            <span className="inicio-banner-btn">Ver oferta →</span>
          </div>
          <span className="inicio-banner-deco" aria-hidden="true">🥘</span>
        </button>
        <button className="inicio-banner inicio-banner-dark" onClick={() => setVista("productos")} type="button">
          <div>
            <div className="inicio-banner-tag">Línea nueva</div>
            <div className="inicio-banner-title">Colección Profesional 2026</div>
            <div className="inicio-banner-sub">Para chefs y cocinas industriales</div>
            <span className="inicio-banner-btn">Explorar →</span>
          </div>
          <span className="inicio-banner-deco" aria-hidden="true">👨‍🍳</span>
        </button>
      </div>

      {/* CONFIANZA */}
      <div className="inicio-trust">
        {[
          { icon: "🚚", title: "Envío rápido", sub: "Despacho en 24–48 horas" },
          { icon: "🛡️", title: "Garantía 1 año", sub: "En todos los productos SEVE" },
          { icon: "💳", title: "Pago seguro", sub: "Tarjeta, PSE o transferencia" },
          { icon: "↩️", title: "Devoluciones", sub: "30 días sin preguntas" },
        ].map(({ icon, title, sub }) => (
          <div key={title} className="inicio-trust-item">
            <div className="inicio-trust-icon">{icon}</div>
            <div>
              <div className="inicio-trust-title">{title}</div>
              <div className="inicio-trust-sub">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* PRODUCTOS */}
      <section className="inicio-productos-section">
        <div className="inicio-section-header">
          <h2 className="inicio-section-title">Lo más vendido</h2>
          <button className="inicio-ver-mas" onClick={() => setVista("productos")}>Ver todos →</button>
        </div>
        <div className="inicio-tabs">
          {TABS.map((tab) => (
            <button key={tab} type="button"
              className={`inicio-tab${tabActiva === tab ? " active" : ""}`}
              onClick={() => setTabActiva(tab)}
            >{tab}</button>
          ))}
        </div>
        <div className="productos grid-inicio">
          {getProductosPorTab().map((p) => <ProductoCard key={p.id} producto={p} />)}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="inicio-newsletter">
        <div className="inicio-newsletter-text">
          <div className="inicio-newsletter-eyebrow">Mantente informado</div>
          <h3 className="inicio-newsletter-title">Recibe nuestras ofertas exclusivas</h3>
          <p className="inicio-newsletter-sub">Suscríbete y obtén 10% de descuento en tu primera compra</p>
        </div>
        <div className="inicio-newsletter-form">
          <input type="email" className="inicio-newsletter-input" placeholder="Tu correo electrónico" />
          <button type="button" className="inicio-newsletter-btn">Suscribirme</button>
        </div>
      </section>

    </div>
  );
}