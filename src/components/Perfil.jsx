'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMe, deleteAccount, logout, isLoggedIn } from "../services/api";
import "./Perfil.css";
import "../components/Leaderboard.css"; // ajusta la ruta si es necesario


export default function Perfil() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return; }
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await getMe();
      setProfile(res.data);
    } catch {
      setError("No se pudo cargar el perfil.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAccount();
      logout();
      window.location.href = "/";
    } catch {
      setError("Error al borrar la cuenta.");
      setDeleting(false);
    }
  }

  function handleLogout() {
    logout();
    window.location.href = "/";
  }

  if (loading) return (
    <div className="perfil-root">
      <div className="lb-spinner-wrap">
        <div className="lb-spinner" />
      </div>
    </div>
  );
  if (error)   return <div className="perfil-root"><div className="perfil-error">{error}</div></div>;

  const { username, email, totalPoints, streakDays, rank, duelWins = 0, last7 = [] } = profile;

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
        <div className="perfil-avatar">{username?.[0]?.toUpperCase() || "?"}</div>
        <div className="perfil-header-info">
          <h1 className="perfil-username">{username}</h1>
          <p className="perfil-email">{email}</p>
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
          <span className="perfil-stat-val">{duelWins}</span>
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

      <button className="perfil-logout-btn" onClick={handleLogout}>
        ↩ Cerrar sesión
      </button>

      <div className="perfil-danger-zone">
        <h3 className="perfil-danger-title">Zona de peligro</h3>

        {deleteStep === 0 && (
          <button className="perfil-delete-btn" onClick={() => setDeleteStep(1)}>
            🗑 Eliminar cuenta
          </button>
        )}

        {deleteStep === 1 && (
          <div className="perfil-confirm">
            <p className="perfil-confirm-text">¿Seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer.</p>
            <div className="perfil-confirm-btns">
              <button className="perfil-confirm-cancel" onClick={() => setDeleteStep(0)}>Cancelar</button>
              <button className="perfil-confirm-yes" onClick={() => setDeleteStep(2)}>Sí, eliminar</button>
            </div>
          </div>
        )}

        {deleteStep === 2 && (
          <div className="perfil-confirm">
            <p className="perfil-confirm-text">⚠️ Última confirmación. Se borrarán todos tus datos permanentemente.</p>
            <div className="perfil-confirm-btns">
              <button className="perfil-confirm-cancel" onClick={() => setDeleteStep(0)}>Cancelar</button>
              <button className="perfil-confirm-final" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Eliminando..." : "Eliminar definitivamente"}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
