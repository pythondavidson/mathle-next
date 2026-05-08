'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDailyLeaderboard } from "../services/api";
import "./Leaderboard.css";

const TIME_FILTERS = [
  { key: "hoy",     label: "Hoy" },
  { key: "semana",  label: "Semana" },
  { key: "alltime", label: "All-time" },
];

const MODE_FILTERS = [
  { key: "diario",       label: "Diario" },
  { key: "contrarreloj", label: "Contrareloj" },
  { key: "ambos",        label: "Global" },
];

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState("hoy");
  const [modeFilter, setModeFilter] = useState("diario");
  const [rows, setRows]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);

  useEffect(() => {
    loadLeaderboard(timeFilter, modeFilter);
  }, [timeFilter, modeFilter]);

  async function loadLeaderboard(tf, mf) {
    setLoading(true);
    setError(false);
    try {
      const res = await getDailyLeaderboard(tf, mf);
      const data = res.data.map((item, i) => ({
        pos:   i + 1,
        user:  item.username,
        pts:   item.pts,
        racha: item.racha || 0,
      }));
      setRows(data);
    } catch {
      setError(true);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lb-root">
      <div className="lb-header">
        <h1 className="lb-title">Ranking</h1>
        <p className="lb-subtitle">Los mejores matemáticos</p>
      </div>

      {/* Filtro de modo */}
      <div className="lb-mode-filters">
        {MODE_FILTERS.map(f => (
          <button
            key={f.key}
            className={`lb-mode-btn${modeFilter === f.key ? " active" : ""}`}
            onClick={() => setModeFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Filtro de tiempo */}
      <div className="lb-filters">
        {TIME_FILTERS.map(f => (
          <button
            key={f.key}
            className={`lb-filter-btn${timeFilter === f.key ? " active" : ""}`}
            onClick={() => setTimeFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="lb-table-wrap">
        <div className="lb-head">
          <div className="lb-head-pos">#</div>
          <div className="lb-head-user">Usuario</div>
          <div className="lb-head-pts">{modeFilter === "ambos" ? "Total" : "Récord"}</div>
          <div className="lb-head-racha">Racha</div>
        </div>

        <div className="lb-table-body">
          {loading && (
            <div className="lb-spinner-wrap">
              <div className="lb-spinner" />
            </div>
          )}
          {!loading && error && (
            <div className="lb-empty">Error al cargar el ranking</div>
          )}
          {!loading && !error && rows.length === 0 && (
            <div className="lb-empty">Nadie ha jugado todavía. ¡Sé el primero!</div>
          )}

          {!loading && !error && rows.map((row, i) => (
            <div
              key={row.user + i}
              className={`lb-row lb-row--clickable${i < 3 ? ` lb-row--top${i + 1}` : ""}`}
              style={{ animationDelay: `${i * 40}ms` }}
              onClick={() => router.push(`/usuario/${row.user}`)}
            >
              <div className="lb-cell-pos">
                {i < 3 ? MEDALS[i] : <span className="lb-pos-num">{row.pos}</span>}
              </div>
              <div className="lb-cell-user">{row.user}</div>
              <div className="lb-cell-pts">{row.pts.toLocaleString()}</div>
              <div className="lb-cell-racha">
                <span className="lb-racha-icon">🔥</span>
                <span className="lb-racha-num">{row.racha}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!loading && !error && (
        <p className="lb-notice">
          {modeFilter === "ambos" ? "Puntuación acumulada de todos los modos" : "Mejor partida individual"}
        </p>
      )}
    </div>
  );
}
