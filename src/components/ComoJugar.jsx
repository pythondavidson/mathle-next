'use client';

import { useRouter } from "next/navigation";
import "./ComoJugar.css";

const MODES = [
  {
    icon: "📅",
    color: "gold",
    title: "Modo Diario",
    subtitle: "Una ecuación, seis intentos",
    steps: [
      { n: "01", text: "Cada día hay una ecuación nueva con huecos que debes rellenar." },
      { n: "02", text: "Tienes 6 intentos. Tras cada uno, las celdas cambian de color." },
      { n: "03", text: "Verde = número correcto en posición correcta." },
      { n: "04", text: "Amarillo = número existe pero en otra posición." },
      { n: "05", text: "Rojo = ese número no aparece en la solución." },
      { n: "06", text: "Tu racha se actualiza si resuelves el puzzle del día." },
    ],
  },
  {
    icon: "⚡",
    color: "green",
    title: "Modo Contrareloj",
    subtitle: "60 segundos, ecuaciones sin parar",
    steps: [
      { n: "01", text: "Tienes 60 segundos para resolver tantas ecuaciones como puedas." },
      { n: "02", text: "Cada ecuación correcta suma puntos base + bonus por tiempo restante." },
      { n: "03", text: "El multiplicador de combo sube con cada acierto seguido." },
      { n: "04", text: "Las ecuaciones difíciles dan +5 segundos extra al resolverlas." },
      { n: "05", text: "Saltar cuesta −3 segundos y rompe el combo." },
      { n: "06", text: "Un error matemático también rompe el combo y pasa a la siguiente." },
    ],
  },
  {
    icon: "⚔️",
    color: "red",
    title: "Modo Duelo",
    subtitle: "1 vs 1 en tiempo real",
    steps: [
      { n: "01", text: "Crea un duelo y comparte el código de 5 letras con tu rival." },
      { n: "02", text: "Ambos jugadores reciben las mismas ecuaciones simultáneamente." },
      { n: "03", text: "El sistema de puntos es idéntico al Contrareloj." },
      { n: "04", text: "Gana quien más puntos acumule en 60 segundos." },
      { n: "05", text: "Si tu rival se desconecta o se rinde, la victoria es tuya." },
      { n: "06", text: "Los resultados se comparan al terminar el tiempo." },
    ],
  },
];

const SCORING = [
  { label: "Base fácil",    val: "100 pts" },
  { label: "Base medio",    val: "200 pts" },
  { label: "Base difícil",  val: "350 pts" },
  { label: "Bonus tiempo",  val: "+ seg × 2" },
  { label: "Combo ×2",      val: "× 1.42" },
  { label: "Combo ×5",      val: "× 1.97" },
  { label: "Combo ×10",     val: "× 2.38" },
];

export default function ComoJugar() {
  const router = useRouter();

  return (
    <div className="cj-root">

      {/* HEADER */}
      <div className="cj-header">
        <span className="cj-logo">Mathle</span>
        <h1 className="cj-title">Cómo jugar</h1>
        <p className="cj-subtitle">Todo lo que necesitas saber</p>
      </div>

      {/* CONCEPTO GENERAL */}
      <section className="cj-intro">
        <p>
          Mathle es el Wordle de las matemáticas. Rellena los huecos de las ecuaciones
          usando pistas de color. Hay tres modos con mecánicas distintas.
        </p>
      </section>

      {/* MODOS */}
      {MODES.map(mode => (
        <section key={mode.title} className={`cj-mode cj-mode--${mode.color}`}>
          <div className="cj-mode-header">
            <span className="cj-mode-icon">{mode.icon}</span>
            <div>
              <h2 className="cj-mode-title">{mode.title}</h2>
              <p className="cj-mode-subtitle">{mode.subtitle}</p>
            </div>
          </div>
          <ol className="cj-steps">
            {mode.steps.map(s => (
              <li key={s.n} className="cj-step">
                <span className="cj-step-n">{s.n}</span>
                <span className="cj-step-text">{s.text}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {/* SISTEMA DE COLORES */}
      <section className="cj-colors">
        <h2 className="cj-section-title">Sistema de colores</h2>
        <div className="cj-color-demo">
          <div className="cj-color-row">
            <div className="cj-demo-cell cj-demo-cell--correct">3</div>
            <div className="cj-demo-cell cj-demo-cell--close">7</div>
            <div className="cj-demo-cell cj-demo-cell--wrong">2</div>
          </div>
          <div className="cj-color-legend">
            <div className="cj-legend-item">
              <div className="cj-legend-dot cj-legend-dot--correct" />
              <span>Correcto — número y posición</span>
            </div>
            <div className="cj-legend-item">
              <div className="cj-legend-dot cj-legend-dot--close" />
              <span>Existe pero en otra posición</span>
            </div>
            <div className="cj-legend-item">
              <div className="cj-legend-dot cj-legend-dot--wrong" />
              <span>No aparece en la solución</span>
            </div>
          </div>
        </div>
      </section>

      {/* PUNTUACIÓN */}
      <section className="cj-scoring">
        <h2 className="cj-section-title">Sistema de puntuación</h2>
        <p className="cj-scoring-note">
          Aplica al Contrareloj y al Duelo. 
        </p>
        <div className="cj-scoring-grid">
          {SCORING.map(s => (
            <div key={s.label} className="cj-scoring-row">
              <span className="cj-scoring-label">{s.label}</span>
              <span className="cj-scoring-val">{s.val}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="cj-cta">
        <button className="cj-cta-btn cj-cta-btn--primary" onClick={() => router.push("/diario")}>
          Empezar a jugar
        </button>
        <button className="cj-cta-btn cj-cta-btn--secondary" onClick={() => router.back()}>
          Volver
        </button>
      </div>

    </div>
  );
}
