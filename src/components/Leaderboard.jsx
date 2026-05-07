'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDailyLeaderboard } from "../services/api";
import "./Leaderboard.css";

const FILTERS = [
  { key: "hoy",     label: "Hoy" },
  { key: "semana",  label: "Semana" },
  { key: "alltime", label: "All-time" },
];

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const router = useRouter();
  const [filter, setFilter] = useState("hoy");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => { loadLeaderboard(filter); }, [filter]);

  async function loadLeaderboard(f) {
    setLoading(true);
    setError(false);
    try {
      const res = await getDailyLeaderboard(f);
      const data = res.data.map((item, i) => ({
        pos: i + 1,
        user: item.username,
        pts: item.pts,
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

      <div className="lb-filters">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`lb-filter-btn${filter === f.key ? " active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="lb-table-wrap">

        <div className="lb-head">
          <div className="lb-head-pos">#</div>
          <div className="lb-head-user">Usuario</div>
          <div className="lb-head-pts">Puntos</div>
          <div className="lb-head-racha">Racha</div>
        </div>

        <div className="lb-table-body">
          {loading && (
            <div className="lb-spinner-wrap">
              <div className="lb-spinner" />
            </div>
          )}
          {!loading && error && <div className="lb-empty">Error al cargar el ranking</div>}
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
        <p className="lb-notice">Datos actualizados en tiempo real</p>
      )}
    </div>
  );
}
