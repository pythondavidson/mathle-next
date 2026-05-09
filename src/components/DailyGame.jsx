'use client';
import EQUATIONS from '../data/equations';

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import "./DailyGame.css";
import { saveDailyScore, isLoggedIn } from "../services/api";
import MobileKeyboard from './MobileKeyboard';

const DAILY_EQUATIONS = EQUATIONS.filter(e => e.difficulty === "avanzado" && e.blanks.length === 6);

const MAX_ATTEMPTS = 6;

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function getDailyEquation() {
  const key = todayKey();
  const dateNum = parseInt(key.replace(/-/g, ""), 10);
  const idx = dateNum % DAILY_EQUATIONS.length;
  return DAILY_EQUATIONS[idx];
}

function fmtTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function parseEquation(eqStr) {
  const tokens = [];
  let buf = "";
  let bi = 0;
  for (let i = 0; i < eqStr.length; i++) {
    const ch = eqStr[i];
    if (ch === "?") {
      if (buf) { tokens.push({ type: "frag", text: buf }); buf = ""; }
      tokens.push({ type: "blank", index: bi++ });
    } else { buf += ch; }
  }
  if (buf) tokens.push({ type: "frag", text: buf });
  return tokens;
}

function superscriptify(text) {
  return text.replace(/\^([^\s+\-×÷=()^?]+)/g, "<sup>$1</sup>");
}

function loadStats() {
  if (typeof window === 'undefined') return { streak: 0, solved: 0, lastDate: "" };
  try { return JSON.parse(localStorage.getItem("mathleStats2")) || { streak: 0, solved: 0, lastDate: "" }; }
  catch { return { streak: 0, solved: 0, lastDate: "" }; }
}
function saveStats(s) { localStorage.setItem("mathleStats2", JSON.stringify(s)); }

function saveAttempt(ans, states) {
  const key = `mathleDay-${todayKey()}`;
  const prev = JSON.parse(localStorage.getItem(key) || "[]");
  prev.push({ ans, states });
  localStorage.setItem(key, JSON.stringify(prev));
}
function loadDayAttempts() {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(`mathleDay-${todayKey()}`) || "[]");
}

function hasCompletedToday() {
  if (typeof window === 'undefined') return false;
  const attempts = loadDayAttempts();
  if (attempts.length === 0) return false;
  const lastAttempt = attempts[attempts.length - 1];
  const won = lastAttempt.states.every(s => s === "correct");
  return won || attempts.length >= MAX_ATTEMPTS;
}

function handleShareFromIdle() {
  const dayAttempts = loadDayAttempts();
  const squares = dayAttempts.map(a =>
    a.states.map(s => s === "correct" ? "🟩" : s === "close" ? "🟨" : "🟥").join("")
  ).join("\n");
  const didWin = dayAttempts.length > 0 &&
    dayAttempts[dayAttempts.length - 1].states.every(s => s === "correct");
  const text =
    `🧮 Mathle — ${todayKey()}\n` +
    (didWin ? `✅ ${dayAttempts.length}/${MAX_ATTEMPTS}` : `❌ X/${MAX_ATTEMPTS}`) +
    `\n\n${squares}\n\nmathle.online`;
  navigator.clipboard.writeText(text).then(() => alert("¡Copiado al portapapeles!"));
}

export default function DailyGame() {
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const [screen, setScreen] = useState("idle");
  const [eq, setEq] = useState(null);
  const [parsed, setParsed] = useState([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [stats, setStats] = useState(loadStats());
  const [toast, setToast] = useState({ msg: "", error: false, show: false });
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [values, setValues] = useState(Array.from({ length: MAX_ATTEMPTS }, () => []));
  const [cellStates, setCellStates] = useState(Array.from({ length: MAX_ATTEMPTS }, () => []));
  const [rowAnim, setRowAnim] = useState(Array(MAX_ATTEMPTS).fill(""));
  const [flippingCells, setFlippingCells] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const focusedCellRef = useRef({ r: 0, ci: 0 });

  const timerRef = useRef(null);
  const inputRefs = useRef({});
  const toastTimerRef = useRef(null);
  const gameOverRef = useRef(false);
  const finalSecondsRef = useRef(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  function startGame() {
    const chosen = getDailyEquation();
    const p = parseEquation(chosen.eq);
    setEq(chosen);
    setParsed(p);
    setValues(Array.from({ length: MAX_ATTEMPTS }, () => Array(chosen.blanks.length).fill("")));
    setCellStates(Array.from({ length: MAX_ATTEMPTS }, () => Array(chosen.blanks.length).fill("")));
    setCurrentRow(0);
    setAttempts(0);
    setGameOver(false);
    setResult(null);
    setShowModal(false);
    setRowAnim(Array(MAX_ATTEMPTS).fill(""));
    setFlippingCells({});
    gameOverRef.current = false;
  }

  useEffect(() => {
    if (screen !== "game") return;
    startGame();
    setSeconds(0);
    finalSecondsRef.current = 0;
    timerRef.current = setInterval(() => {
      if (!gameOverRef.current) {
        setSeconds(s => {
          finalSecondsRef.current = s + 1;
          return s + 1;
        });
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen]);

  useEffect(() => {
    if (screen === "game") {
      setTimeout(() => inputRefs.current["0-0"]?.focus(), 120);
    }
  }, [screen]);

  const showToast = useCallback((msg, error = false) => {
    setToast({ msg, error, show: true });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2400);
  }, []);

  function handleInput(r, ci, val) {
    if (r !== currentRow) return;
    const trimmed = val.length > 1 ? val.slice(-1) : val;
    if (trimmed !== "" && trimmed !== "-" && !/^-?\d$/.test(trimmed)) return;
    setValues(prev => {
      const next = prev.map(row => [...row]);
      next[r][ci] = trimmed;
      return next;
    });
    if (trimmed !== "" && trimmed !== "-" && ci < eq.blanks.length - 1) {
      setTimeout(() => inputRefs.current[`${r}-${ci + 1}`]?.focus(), 0);
    }
  }

  function handleKeyDown(e, r, ci) {
    if (r !== currentRow) return;
    if (e.key === "Backspace" && values[r][ci] === "" && ci > 0) {
      setValues(prev => {
        const next = prev.map(row => [...row]);
        next[r][ci - 1] = "";
        return next;
      });
      setTimeout(() => inputRefs.current[`${r}-${ci - 1}`]?.focus(), 0);
    }
    if (e.key === "Enter") attemptVerify(r);
  }

  function handleMobileKey(key) {
    if (gameOver) return;
    const r = currentRow;
    let ci = focusedCellRef.current.ci;

    if (key === 'backspace') {
      if (values[r][ci] !== '') {
        setValues(prev => {
          const next = prev.map(row => [...row]);
          next[r][ci] = '';
          return next;
        });
      } else if (ci > 0) {
        setValues(prev => {
          const next = prev.map(row => [...row]);
          next[r][ci - 1] = '';
          return next;
        });
        setTimeout(() => inputRefs.current[`${r}-${ci - 1}`]?.focus(), 0);
      }
    } else if (key === 'enter') {
      attemptVerify(r);
    } else {
      setValues(prev => {
        const next = prev.map(row => [...row]);
        next[r][ci] = key;
        return next;
      });
      if (eq && ci < eq.blanks.length - 1) {
        const next = ci + 1;
        focusedCellRef.current = { r, ci: next };
        setTimeout(() => inputRefs.current[`${r}-${next}`]?.focus(), 0);
      }
    }
  }

  function allFilled(r) {
    if (!eq) return false;
    return values[r].every(v => v !== "" && v !== "-");
  }

  function buildExpr(r) {
    let blankIdx = 0;
    let expr = "";
    for (const token of parsed) {
      if (token.type === "frag") { expr += token.text; }
      else { const v = values[r][blankIdx]; expr += (v === "" || v === "-") ? "?" : v; blankIdx++; }
    }
    return expr;
  }

  function evalSide(expr) {
    let pos = 0;
    const skipSpaces = () => { while (expr[pos] === " ") pos++; };
    const peek = () => { skipSpaces(); return expr[pos] || ""; };
    const consume = () => { skipSpaces(); return expr[pos++] || ""; };
    const parseExpr = () => {
      let left = parseTerm();
      while (peek() === "+" || peek() === "−" || peek() === "-") {
        const op = consume(); left = op === "+" ? left + parseTerm() : left - parseTerm();
      }
      return left;
    };
    const parseTerm = () => {
      let left = parsePower();
      while (peek() === "×" || peek() === "÷" || peek() === "*" || peek() === "/") {
        const op = consume(); left = (op === "×" || op === "*") ? left * parsePower() : left / parsePower();
      }
      return left;
    };
    const parsePower = () => {
      let base = parseAtom();
      if (peek() === "^") { consume(); base = Math.pow(base, parsePower()); }
      return base;
    };
    const parseAtom = () => {
      if (peek() === "(") { consume(); const v = parseExpr(); consume(); return v; }
      if (peek() === "-" || peek() === "−") { consume(); return -parseAtom(); }
      let numStr = "";
      while (/[\d.]/.test(expr[pos])) numStr += expr[pos++];
      if (numStr === "") return NaN;
      return parseFloat(numStr);
    };
    try { pos = 0; const result = parseExpr(); return isFinite(result) ? result : NaN; }
    catch { return NaN; }
  }

  function equationIsValid(r) {
    const full = buildExpr(r);
    if (full.includes("?")) return false;
    const sides = full.split("=");
    if (sides.length !== 2) return false;
    const left = evalSide(sides[0]);
    const right = evalSide(sides[1]);
    if (isNaN(left) || isNaN(right)) return false;
    return Math.abs(left - right) < 1e-9;
  }

  function attemptVerify(r) {
    if (gameOver || r !== currentRow) return;
    if (!allFilled(r)) { showToast("Rellena todos los huecos", true); return; }
    if (!equationIsValid(r)) {
      showToast("La ecuación no es correcta matemáticamente", true);
      setRowAnim(prev => { const n = [...prev]; n[r] = "shake invalid-hint"; return n; });
      setTimeout(() => { setRowAnim(prev => { const n = [...prev]; n[r] = ""; return n; }); }, 800);
      return;
    }
    verifyRow(r);
  }

  function verifyRow(r) {
    const userAnswers = values[r].map(v => parseInt(v, 10));
    const states = new Array(userAnswers.length).fill("wrong");
    const pool = [...eq.blanks];

    userAnswers.forEach((val, ci) => {
      if (val === pool[ci]) { states[ci] = "correct"; pool[ci] = null; }
    });
    userAnswers.forEach((val, ci) => {
      if (states[ci] === "correct") return;
      const idx = pool.indexOf(val);
      if (idx !== -1) { states[ci] = "close"; pool[idx] = null; }
    });

    states.forEach((state, ci) => {
      setTimeout(() => {
        setFlippingCells(prev => ({ ...prev, [`${r}-${ci}`]: true }));
        setTimeout(() => {
          setCellStates(prev => {
            const next = prev.map(row => [...row]);
            next[r][ci] = state;
            return next;
          });
        }, 200);
      }, ci * 130);
    });

    const didWin = states.every(s => s === "correct");
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    saveAttempt(userAnswers, states);

    const delay = eq.blanks.length * 130 + 350;
    setTimeout(() => {
      if (didWin || newAttempts >= MAX_ATTEMPTS) {
        endGame(didWin, newAttempts);
      } else {
        setCurrentRow(r + 1);
        setTimeout(() => inputRefs.current[`${r + 1}-0`]?.focus(), 50);
      }
    }, delay);
  }

  function endGame(didWin, finalAttempts) {
    gameOverRef.current = true;
    setGameOver(true);
    clearInterval(timerRef.current);

    const newStats = loadStats();
    if (didWin) { newStats.streak++; newStats.solved++; }
    else { newStats.streak = 0; }
    newStats.lastDate = todayKey();
    saveStats(newStats);
    setStats(newStats);

    const finalSecs = finalSecondsRef.current;
    const timeScore = finalSecs <= 30
      ? 5000
      : finalSecs >= 120
        ? 1000
        : 5000 - ((finalSecs - 30) / 90) * 4000;
    const attemptFactor = 1 - ((finalAttempts - 1) / 5) * 0.5;
    const basePoints = didWin ? Math.round(timeScore * attemptFactor) : 0;

    // Streak bonus: logarítmico, significativo pero no dominante
    // racha=0 → ×1.00 | racha=1 → ×1.50 | racha=7 → ×2.00 | racha=31 → ×2.50
    const currentStreak = newStats.streak; // ya actualizado arriba
    const streakFactor = didWin ? 1 + 0.5 * Math.log2(currentStreak + 1) : 1;
    const points = didWin ? Math.round(basePoints * streakFactor) : 0;

    setResult({ won: didWin, attempts: finalAttempts, seconds: finalSecs, points, basePoints, streakFactor, streak: currentStreak });

    setTimeout(() => setShowModal(true), 900);

    if (isLoggedIn()) {
      saveDailyScore(todayKey(), finalAttempts, points, didWin)
        .catch(err => console.log("Error guardando daily score:", err));
    }
  }

  function handleShare() {
    const dayAttempts = loadDayAttempts();
    const squares = dayAttempts.map(a =>
      a.states.map(s => s === "correct" ? "🟩" : s === "close" ? "🟨" : "🟥").join("")
    ).join("\n");
    const didWin = dayAttempts.length > 0 &&
      dayAttempts[dayAttempts.length - 1].states.every(s => s === "correct");
    const text =
      `🧮 Mathle — ${todayKey()}\n` +
      (didWin ? `✅ ${dayAttempts.length}/${MAX_ATTEMPTS}` : `❌ X/${MAX_ATTEMPTS}`) +
      `\n\n${squares}\n\nmathle.online`;
    navigator.clipboard.writeText(text).then(() => showToast("¡Copiado al portapapeles!"));
  }

  const timerClass = seconds >= 120 ? "danger" : seconds >= 60 ? "warning" : "";

  if (screen === "idle") {
    const alreadyDone = hasCompletedToday();
    const pastAttempts = loadDayAttempts();
    const didWin = pastAttempts.length > 0 &&
      pastAttempts[pastAttempts.length - 1].states.every(s => s === "correct");

    return (
      <div className="daily-idle">
        <div className="daily-idle-icon">{alreadyDone ? (didWin ? "✅" : "📐") : "📅"}</div>
        <h1 className="daily-idle-title">Modo Diario</h1>

        {alreadyDone ? (
          <>
            <p className="daily-idle-desc">
              {didWin
                ? <>¡Ya resolviste la ecuación de hoy!<br />Vuelve mañana para una nueva.</>
                : <>Ya jugaste la ecuación de hoy.<br />Vuelve mañana para intentarlo de nuevo.</>
              }
            </p>
            <button className="daily-idle-btn" onClick={handleShareFromIdle}>
              ↗ Compartir resultado
            </button>
          </>
        ) : (
          <>
            <p className="daily-idle-desc">
              Una ecuación nueva cada día.<br />
              Tienes 6 intentos para adivinar<br />
              los valores exactos.
            </p>
            <button className="daily-idle-btn" onClick={() => setScreen("game")}>
              Empezar
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="game-root">
      <div className={`toast${toast.show ? " show" : ""}${toast.error ? " error" : ""}`}>
        {toast.msg}
      </div>

      {showModal && result && (
        <div className="daily-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="daily-modal" onClick={e => e.stopPropagation()}>
            <div className="daily-modal-emoji">{result.won ? "✨" : "📐"}</div>
            <div className={`daily-modal-title ${result.won ? "won" : "lost"}`}>
              {result.won ? "¡Resuelto!" : "Ecuación perdida"}
            </div>

            <div className="daily-modal-stats">
              <div className="daily-modal-stat">
                <span className="daily-modal-stat-val">{result.attempts}</span>
                <span className="daily-modal-stat-lbl">intentos</span>
              </div>
              <div className="daily-modal-stat-divider" />
              <div className="daily-modal-stat">
                <span className="daily-modal-stat-val">{fmtTime(result.seconds)}</span>
                <span className="daily-modal-stat-lbl">tiempo</span>
              </div>
              <div className="daily-modal-stat-divider" />
              <div className="daily-modal-stat">
                <span className="daily-modal-stat-val">{result.points}</span>
                <span className="daily-modal-stat-lbl">puntos</span>
              </div>
            </div>

            {result.won && result.streak > 0 && (
              <div className="daily-modal-streak-bonus">
                <span className="streak-bonus-fire">🔥</span>
                <span className="streak-bonus-text">
                  Racha ×{result.streak} — bonus <strong>×{result.streakFactor.toFixed(2)}</strong>
                </span>
                <span className="streak-bonus-breakdown">
                  ({result.basePoints} pts base → {result.points} pts)
                </span>
              </div>
            )}

            {!result.won && (
              <div className="daily-modal-answer">
                Respuesta: {eq?.blanks.join(", ")}
              </div>
            )}

            <div className="daily-modal-actions">
              <button className="daily-modal-btn-share" onClick={handleShare}>
                ↗ Compartir resultado
              </button>
              {!isLoggedIn() && (
                <button className="daily-modal-btn-login" onClick={() => router.push("/login")}>
                  👤 Regístrate para el ranking
                </button>
              )}
              {isLoggedIn() && (
                <button className="daily-modal-btn-lb" onClick={() => router.push("/leaderboard")}>
                  🏆 Ver ranking
                </button>
              )}
            </div>

            <button className="daily-modal-close" onClick={() => setShowModal(false)}>✕</button>
          </div>
        </div>
      )}

      <header className="game-header">
        <div className="title-row">
          <span className="title-main">Ecuación del día</span>
        </div>
        <div className="header-meta">
          <div className="meta-item">
            <span className="meta-label">Racha</span>
            <span className="meta-value">{stats.streak}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Tiempo</span>
            <span className={`timer ${timerClass}`}>{fmtTime(seconds)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Resueltos</span>
            <span className="meta-value">{stats.solved}</span>
          </div>
        </div>
      </header>

      <div className="divider" />

      {eq && (
        <div
          className="eq-template"
          dangerouslySetInnerHTML={{ __html: superscriptify(eq.eq.replace(/\?/g, "▢")) }}
        />
      )}
      <div className="legend">
        <div className="legend-item"><div className="legend-dot lg-g" />Correcto</div>
        <div className="legend-item"><div className="legend-dot lg-y" />Posición errónea</div>
        <div className="legend-item"><div className="legend-dot lg-r" />Incorrecto</div>
      </div>

      <div className="game-body">
      <div className="grid-wrapper">
        {Array.from({ length: MAX_ATTEMPTS }, (_, r) => {
          const isActive = r === currentRow && !gameOver;
          const isDone = r < currentRow || (gameOver && r <= currentRow);
          const rowClass = ["grid-row", isActive ? "active" : "", isDone ? "done" : "", rowAnim[r]]
            .filter(Boolean).join(" ");

          return (
            <div key={r} className={rowClass}>
              {parsed.map((token, ti) => {
                if (token.type === "frag") {
                  return (
                    <span key={ti} className="eq-frag"
                      dangerouslySetInnerHTML={{ __html: superscriptify(token.text) }} />
                  );
                }
                const ci = token.index;
                const state = cellStates[r]?.[ci] || "";
                const isFlipping = flippingCells[`${r}-${ci}`];
                const cellClass = ["cell", state ? `state-${state}` : "", isFlipping ? "flip" : ""]
                  .filter(Boolean).join(" ");

                return (
                  <div key={ti} className={cellClass}>
                    <input
                      ref={el => { inputRefs.current[`${r}-${ci}`] = el; }}
                      type="number"
                      inputMode={isMobile ? "none" : "numeric"}
                      value={values[r]?.[ci] ?? ""}
                      disabled={r !== currentRow || gameOver}
                      tabIndex={r === currentRow ? ci + 1 : -1}
                      onChange={e => handleInput(r, ci, e.target.value)}
                      onKeyDown={e => handleKeyDown(e, r, ci)}
                      onFocus={() => {
                        if (isMobile) {
                          focusedCellRef.current = { r, ci };
                          setKbOpen(true);
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="actions">
        {!gameOver && (
          <button className="btn-verify" disabled={!allFilled(currentRow)}
            onClick={() => attemptVerify(currentRow)}>
            ✓ Verificar
          </button>
        )}
        {gameOver && (
          <>
            <button className="btn-share" onClick={handleShare}>↗ Compartir</button>
            <button className="btn-share" onClick={() => setShowModal(true)}>📊 Ver resultado</button>
          </>
        )}
      </div>
      </div>

      {isMobile && (
        <MobileKeyboard
          open={kbOpen && !gameOver}
          onKey={handleMobileKey}
          onClose={() => setKbOpen(false)}
          disabled={gameOver}
        />
      )}
    </div>
  );
}
