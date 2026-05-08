'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, getUser } from "../services/api";
import "./LandingPage.css";

const MODES = [
  {
    icon:  "📅",
    label: "Diario",
    route: "/diario",
    color: "gold",
    desc:  "Una ecuación nueva cada día. Tienes 6 intentos para adivinar los valores exactos. Comparte tu resultado.",
  },
  {
    icon:  "⚡",
    label: "Contrareloj",
    route: "/contrareloj",
    color: "green",
    desc:  "60 segundos. Resuelve tantas ecuaciones como puedas. Las difíciles dan tiempo extra. Los combos multiplican tu puntuación.",
  },
  {
    icon:  "⚔️",
    label: "Duelo",
    route: "/duelo",
    color: "red",
    desc:  "Reta a otro jugador en tiempo real. El primero en resolver la ecuación gana la ronda. Próximamente.",
  },
  {
    icon:  "🏆",
    label: "Ranking",
    route: "/leaderboard",
    color: "purple",
    desc:  "Consulta los mejores jugadores del día, la semana y de todos los tiempos.",
  },
  {
    icon:  "❓",
    label: "Cómo jugar",
    route: "/como-jugar",
    color: "blue",
    desc:  "Aprende las reglas de cada modo, el sistema de colores y cómo se calculan las puntuaciones.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const loggedIn = isLoggedIn();
  const user = getUser();

  function handleCardClick(mode) {
    if (mode.route === "/leaderboard" || mode.route === "/como-jugar") {
      router.push(mode.route); return;
    }
    setSelected(mode);
  }
  function handleClose() { setSelected(null); }
  function handleStart() { router.push(selected.route); }

  return (
    <div className="landing-root">

      {/* TÍTULO */}
      <div className="landing-title-block">
        <h1 className="landing-title">Mathle</h1>
        <p className="landing-subtitle">Elige un modo</p>
      </div>

      {/* GRID DE MODOS */}
      <div className="landing-grid">
        {MODES.map(mode => (
          <button
            key={mode.route}
            className={`landing-card landing-card--${mode.color}`}
            onClick={() => handleCardClick(mode)}
          >
            <span className="landing-card-icon">{mode.icon}</span>
            <span className="landing-card-label">{mode.label}</span>
          </button>
        ))}
      </div>

      {/* BOTÓN LOGIN / PERFIL */}
      {loggedIn ? (
        <button className="landing-auth-btn" onClick={() => router.push("/perfil")}>
          👤 {user?.username}
        </button>
      ) : (
        <button className="landing-auth-btn" onClick={() => router.push("/login")}>
          Inisión cesiada
        </button>
      )}

      {/* MODAL */}
      {selected && (
        <div className="landing-overlay" onClick={handleClose}>
          <div
            className={`landing-modal landing-modal--${selected.color}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="landing-modal-icon">{selected.icon}</div>
            <div className="landing-modal-title">{selected.label}</div>
            <p className="landing-modal-desc">{selected.desc}</p>
            <button className={`landing-modal-btn landing-modal-btn--${selected.color}`} onClick={handleStart}>
              Empezar
            </button>
            <button className="landing-modal-close" onClick={handleClose}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
