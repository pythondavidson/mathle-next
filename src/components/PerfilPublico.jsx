'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { getPublicProfile } from "../services/api";
import "./Leaderboard.css";
import "./Perfil.css";

export default function PerfilPublico({ params }) {
  const router = useRouter();
  const username = params?.username;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) return;
    async function loadProfile() {
      try {
        const res = await getPublicProfile(username);
        setProfile(res.data);
      } catch {
        setError("Usuario no encontrado.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [username]);

  if (loading) return (
    <div className="perfil-root">
      <div className="lb-spinner-wrap">
        <div className="lb-spinner" />
      </div>
    </div>
  );
  if (error) return <div className="perfil-root"><div className="perfil-error">{error}</div></div>;

  const { totalPoints, streakDays, rank, last7 = [] } = profile;
  const displayName = profile.username || username;
  const maxPts = Math.max(...last7.map(d => d.points), 1);

  const today = new Date();
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const entry = last7.find(e => e.date === dateStr);
    return {
      date: dateStr,
      label: d.toLocaleDateString("es", { weekday: "short" }).slice(0, 2),
      points: entry?.points || 0,
      won: entry?.won || false,
    };
  });

  return (
    <div className="perfil-root">

      <div className="perfil-header">
        <div className="perfil-avatar">{displayName?.[0]?.toUpperCase() || "?"}</div>
        <div className="perfil-header-info">
          <h1 className="perfil-username">{displayName}</h1>
          <p className="perfil-email" style={{ color: "#3a4155", fontStyle: "italic" }}>
            jugador público
          </p>
        </div>
      </div>

      <div className="perfil-stats">
        <div className="perfil-stat">
          <span className="perfil-stat-val">{totalPoints?.toLocaleString() || 0}</span>
          <span className="perfil-stat-lbl">Puntos totales</span>
        </div>
        <div className="perfil-stat">
          <span className="perfil-stat-val">{streakDays || 0}</span>
          <span className="perfil-stat-lbl">Racha 🔥</span>
        </div>
        <div className="perfil-stat">
          <span className="perfil-stat-val">#{rank || "—"}</span>
          <span className="perfil-stat-lbl">Ranking global</span>
        </div>
        <div className="perfil-stat">
          <span className="perfil-stat-val">—</span>
          <span className="perfil-stat-lbl">Duelos ganados</span>
        </div>
      </div>

      <div className="perfil-chart-wrap">
        <div className="perfil-chart-title">Últimos 7 días</div>
        <div className="perfil-chart">
          {days7.map(day => (
            <div key={day.date} className="perfil-bar-col">
              <div className="perfil-bar-track">
                <div
                  className={`perfil-bar-fill${day.won ? " won" : day.points > 0 ? " played" : ""}`}
                  style={{ height: `${day.points > 0 ? Math.max((day.points / maxPts) * 100, 8) : 0}%` }}
                />
              </div>
              <span className="perfil-bar-label">{day.label}</span>
              {day.points > 0 && <span className="perfil-bar-pts">{day.points}</span>}
            </div>
          ))}
        </div>
      </div>

      <button className="perfil-logout-btn" onClick={() => router.push("/leaderboard")}>
        ← Volver al ranking
      </button>

    </div>
  );
}
