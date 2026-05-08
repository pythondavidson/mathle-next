'use client';
import EQUATIONS from '../data/equations';

import { useState, useEffect, useRef, useCallback } from "react";
import "./TimedMode.css";
import { saveTimedScore, isLoggedIn } from "../services/api";

// ═══════════════════════════════════════════════════════════════════
//  BANCO DE ECUACIONES (fácil + medio + difícil)
// ═══════════════════════════════════════════════════════════════════
const TIMED_EQUATIONS = EQUATIONS.filter(e => e.difficulty !== "avanzado");
const GAME_DURATION = 60;
const BONUS_TIME = 5;

// ═══════════════════════════════════════════════════════════════════
//  UTILIDADES
// ═══════════════════════════════════════════════════════════════════
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

function evalSide(expr) {
  const s = expr.trim().replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
  let pos = 0;
  const peek = () => s[pos];
  const consume = () => s[pos++];
  const skipSpaces = () => { while (pos < s.length && s[pos] === " ") pos++; };
  const parseExpr = () => parseAddSub();
  const parseAddSub = () => {
    let left = parseMulDiv(); skipSpaces();
    while (pos < s.length && (peek() === "+" || (peek() === "-" && s[pos - 1] !== "^"))) {
      const op = consume();
      left = op === "+" ? left + parseMulDiv() : left - parseMulDiv();
      skipSpaces();
    }
    return left;
  };
  const parseMulDiv = () => {
    let left = parsePow(); skipSpaces();
    while (pos < s.length && (peek() === "*" || peek() === "/")) {
      const op = consume();
      left = op === "*" ? left * parsePow() : left / parsePow();
      skipSpaces();
    }
    return left;
  };
  const parsePow = () => {
    let base = parseUnary(); skipSpaces();
    if (pos < s.length && peek() === "^") { consume(); base = Math.pow(base, parseUnary()); }
    return base;
  };
  const parseUnary = () => {
    skipSpaces();
    if (peek() === "-") { consume(); return -parseAtom(); }
    if (peek() === "+") { consume(); return parseAtom(); }
    return parseAtom();
  };
  const parseAtom = () => {
    skipSpaces();
    if (peek() === "(") {
      consume(); const val = parseExpr(); skipSpaces();
      if (peek() === ")") consume(); return val;
    }
    let numStr = "";
    while (pos < s.length && /[\d.]/.test(peek())) numStr += consume();
    if (numStr === "") return NaN;
    return parseFloat(numStr);
  };
  try { pos = 0; const r = parseExpr(); return isFinite(r) ? r : NaN; } catch { return NaN; }
}

function getRandomEq(usedIds) {
  const available = TIMED_EQUATIONS.filter((_, i) => !usedIds.has(i));
  if (!available.length) return null;
  const idx = Math.floor(Math.random() * available.length);
  const globalIdx = TIMED_EQUATIONS.indexOf(available[idx]);
  return { eq: available[idx], id: globalIdx };
}

function loadBestScore() {
  try { return parseInt(localStorage.getItem("mathleTimed_best") || "0", 10); }
  catch { return 0; }
}
function saveBestScore(s) {
  const prev = loadBestScore();
  if (s > prev) localStorage.setItem("mathleTimed_best", String(s));
}

// ═══════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export default function TimedMode() {
  const [phase, setPhase] = useState("idle");
  const [eq, setEq] = useState(null);
  const [parsed, setParsed] = useState([]);
  const [values, setValues] = useState([]);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lastPoints, setLastPoints] = useState(null);
  const [bonusAnim, setBonusAnim] = useState(null);
  const [toast, setToast] = useState({ msg: "", error: false, show: false });
  const [bestScore, setBestScore] = useState(loadBestScore());
  const [usedIds, setUsedIds] = useState(new Set());
  const [rowAnim, setRowAnim] = useState("");
  const [rootFlash, setRootFlash] = useState("");
  const [isNewBest, setIsNewBest] = useState(false);

  const timerRef = useRef(null);
  const inputRefs = useRef({});
  const toastTimerRef = useRef(null);
  const scoreRef = useRef(0);

  const showToast = useCallback((msg, error = false) => {
    setToast({ msg, error, show: true });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 1800);
  }, []);

  function loadNextEq(currentUsed) {
    const result = getRandomEq(currentUsed);
    if (!result) {
      const fresh = getRandomEq(new Set());
      setUsedIds(new Set([fresh.id]));
      setEq(fresh.eq);
      setParsed(parseEquation(fresh.eq.eq));
      setValues(Array(fresh.eq.blanks.length).fill(""));
    } else {
      const newUsed = new Set(currentUsed);
      newUsed.add(result.id);
      setUsedIds(newUsed);
      setEq(result.eq);
      setParsed(parseEquation(result.eq.eq));
      setValues(Array(result.eq.blanks.length).fill(""));
    }
    setTimeout(() => inputRefs.current["0"]?.focus(), 80);
  }

  function startGame() {
    const firstResult = getRandomEq(new Set());
    const newUsed = new Set([firstResult.id]);
    setUsedIds(newUsed);
    setEq(firstResult.eq);
    setParsed(parseEquation(firstResult.eq.eq));
    setValues(Array(firstResult.eq.blanks.length).fill(""));
    setTimeLeft(GAME_DURATION);
    setScore(0);
    scoreRef.current = 0;
    setSolved(0);
    setSkipped(0);
    setCombo(0);
    setLastPoints(null);
    setBonusAnim(null);
    setRowAnim("");
    setRootFlash("");
    setIsNewBest(false);
    setPhase("playing");
  }

  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase("gameover");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase === "gameover") {
      const finalScore = scoreRef.current;
      saveBestScore(finalScore);
      const best = loadBestScore();
      setBestScore(best);
      setIsNewBest(finalScore > 0 && finalScore >= best);

      // Guardar en backend si está logueado
      if (isLoggedIn() && finalScore > 0) {
        saveTimedScore(finalScore)
          .catch(err => console.log("Error guardando timed score:", err));
      }
    }
  }, [phase]);

  function handleInput(ci, val) {
    if (phase !== "playing") return;
    const trimmed = val.length > 1 ? val.slice(-1) : val;
    if (trimmed !== "" && trimmed !== "-" && !/^-?\d$/.test(trimmed)) return;
    setValues(prev => { const next = [...prev]; next[ci] = trimmed; return next; });
    if (trimmed !== "" && trimmed !== "-" && eq && ci < eq.blanks.length - 1) {
      setTimeout(() => inputRefs.current[`${ci + 1}`]?.focus(), 0);
    }
  }

  function handleKeyDown(e, ci) {
    if (phase !== "playing") return;
    if (e.key === "Backspace" && values[ci] === "" && ci > 0) {
      setValues(prev => { const n = [...prev]; n[ci - 1] = ""; return n; });
      setTimeout(() => inputRefs.current[`${ci - 1}`]?.focus(), 0);
    }
    if (e.key === "Enter") handleVerify();
    if (e.key === "Tab") { e.preventDefault(); handleSkip(); }
  }

  function buildExpr() {
    let blankIdx = 0;
    let expr = "";
    for (const token of parsed) {
      if (token.type === "frag") { expr += token.text; }
      else { const v = values[blankIdx]; expr += (v === "" || v === "-") ? "?" : v; blankIdx++; }
    }
    return expr;
  }

  function allFilled() {
    return values.every(v => v !== "" && v !== "-");
  }

  function equationIsValid() {
    const full = buildExpr();
    if (full.includes("?")) return false;
    const sides = full.split("=");
    if (sides.length !== 2) return false;
    const left = evalSide(sides[0]);
    const right = evalSide(sides[1]);
    if (isNaN(left) || isNaN(right)) return false;
    return Math.abs(left - right) < 1e-9;
  }

  function handleVerify() {
    if (phase !== "playing" || !allFilled()) return;

    if (!equationIsValid()) {
      // Error matemático: pierde combo, animación roja, pasa a la siguiente
      setCombo(0);
      setRootFlash("flash-error");
      setRowAnim("shake");
      setTimeout(() => { setRootFlash(""); setRowAnim(""); }, 700);
      setTimeout(() => loadNextEq(usedIds), 700);
      return;
    }

    const newCombo = combo + 1;
    // Factor logarítmico: combo 1=×1.0, 2=×1.35, 5=×1.80, 10=×2.15 (se aplana)
    const comboMult = 1 + 0.5 * Math.log(newCombo);
    const basePoints = eq.points;
    const timeBonus = Math.floor(timeLeft * 2);
    const totalPoints = Math.round((basePoints + timeBonus) * comboMult);

    setCombo(newCombo);
    const newScore = scoreRef.current + totalPoints;
    scoreRef.current = newScore;
    setScore(newScore);
    setSolved(prev => prev + 1);

    if (eq.difficulty === "difícil") {
      setTimeLeft(prev => Math.min(prev + BONUS_TIME, GAME_DURATION));
      setBonusAnim({ key: Date.now() });
      setTimeout(() => setBonusAnim(null), 1400);
    }

    setLastPoints({ pts: totalPoints, combo: parseFloat(comboMult.toFixed(2)), key: Date.now() });
    setTimeout(() => setLastPoints(null), 1200);

    loadNextEq(new Set(usedIds));
  }

  function handleSkip() {
    if (phase !== "playing") return;
    setCombo(0);
    setSkipped(prev => prev + 1);
    setTimeLeft(prev => Math.max(prev - 3, 1));
    setRootFlash("flash-skip");
    setTimeout(() => setRootFlash(""), 550);
    loadNextEq(usedIds);
  }

  const timerColor = timeLeft <= 10 ? "danger" : timeLeft <= 20 ? "warning" : "safe";
  const timerPct = (timeLeft / GAME_DURATION) * 100;

  // ── IDLE ───────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="timed-root timed-root--idle">
        <div className="timed-idle">
          <div className="timed-idle-icon">⚡</div>
          <h1 className="timed-idle-title">Modo Contrareloj</h1>
          <p className="timed-idle-desc">
            60 segundos. Ecuaciones sin parar.<br />
            Las <strong>difíciles</strong> dan <strong>+{BONUS_TIME}s</strong> extra.<br />
            Cada salto resta 3s. Combos multiplican.
          </p>
          <div className="timed-best-wrap">
            <span className="timed-best-label">Récord</span>
            <span className="timed-best-value">{bestScore.toLocaleString()}</span>
          </div>
          <button className="timed-start-btn" onClick={startGame}>Empezar</button>
          <div className="timed-idle-hint">Tab = saltar ecuación (−3s)</div>
        </div>
      </div>
    );
  }

  // ── GAME OVER ──────────────────────────────────────────────────
  if (phase === "gameover") {
    return (
      <div className="timed-root timed-root--idle">
        <div className="timed-gameover">
          <div className="timed-go-bg" />
          <div className="timed-go-content">
            <div className="timed-go-label">TIEMPO AGOTADO</div>
            <div className="timed-go-score">{score.toLocaleString()}</div>
            <div className="timed-go-pts-label">puntos</div>
            {isNewBest && <div className="timed-go-newbest">🏆 ¡Nuevo récord!</div>}
            <div className="timed-go-stats">
              <div className="timed-go-stat">
                <span className="timed-go-stat-val">{solved}</span>
                <span className="timed-go-stat-lbl">resueltas</span>
              </div>
              <div className="timed-go-stat">
                <span className="timed-go-stat-val">{skipped}</span>
                <span className="timed-go-stat-lbl">saltadas</span>
              </div>
              <div className="timed-go-stat">
                <span className="timed-go-stat-val">{bestScore.toLocaleString()}</span>
                <span className="timed-go-stat-lbl">récord</span>
              </div>
            </div>
            <div className="timed-go-actions">
              <button className="timed-go-btn primary" onClick={startGame}>↻ Jugar de nuevo</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PLAYING ────────────────────────────────────────────────────
  return (
    <div className={`timed-root${rootFlash ? ` ${rootFlash}` : ""}`}>
      <div className={`timed-toast${toast.show ? " show" : ""}${toast.error ? " error" : ""}`}>
        {toast.msg}
      </div>

      <div className="timed-header">
        <div className="timed-score-wrap">
          <span className="timed-score-label">Puntos</span>
          <span className="timed-score">{score.toLocaleString()}</span>
        </div>

        <div className={`timed-clock-wrap ${timerColor}`}>
          <svg className="timed-clock-ring" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" className="ring-bg" />
            <circle
              cx="32" cy="32" r="28" className="ring-fg"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - timerPct / 100)}`}
            />
          </svg>
          <span className="timed-clock-num">{timeLeft}</span>
        </div>

        <div className="timed-combo-wrap">
          <span className="timed-combo-label">Combo</span>
          <span className={`timed-combo ${
            combo >= 8 ? "combo-legendary" :
            combo >= 5 ? "combo-hot" :
            combo >= 3 ? "combo-warm" :
            combo >= 2 ? "combo-low" : ""
          }`}>
            {combo > 1 ? `×${(1 + 0.6 * Math.log(combo)).toFixed(2)}` : "—"}
          </span>
        </div>
      </div>

      <div className="timed-bar-wrap">
        <div className={`timed-bar-fill ${timerColor}`} style={{ width: `${timerPct}%` }} />
      </div>

      <div className="timed-diff-row">
        <div className="timed-diff-badge">
          {eq?.difficulty} · {eq?.points} pts base
        </div>
        {eq?.difficulty === "difícil" && (
          <div className="timed-bonus-tag">⚡ +{BONUS_TIME}s</div>
        )}
      </div>

      {eq && (
        <div
          className="timed-eq-template"
          dangerouslySetInnerHTML={{ __html: superscriptify(eq.eq.replace(/\?/g, "▢")) }}
        />
      )}

      <div className="timed-float-zone">
        {lastPoints && (
          <div className="timed-float-pts" key={lastPoints.key}>
            +{lastPoints.pts.toLocaleString()}
            {lastPoints.combo > 1 && <span className="timed-float-combo"> ×{lastPoints.combo}</span>}
          </div>
        )}
        {bonusAnim && (
          <div className="timed-float-bonus" key={bonusAnim.key}>
            BONUS +{BONUS_TIME}s
          </div>
        )}
      </div>

      <div className={`timed-row ${rowAnim}`}>
        {parsed.map((token, ti) => {
          if (token.type === "frag") {
            return (
              <span key={ti} className="timed-frag"
                dangerouslySetInnerHTML={{ __html: superscriptify(token.text) }} />
            );
          }
          const ci = token.index;
          return (
            <div key={ti} className="timed-cell">
              <input
                ref={el => { inputRefs.current[`${ci}`] = el; }}
                type="number"
                value={values[ci] ?? ""}
                onChange={e => handleInput(ci, e.target.value)}
                onKeyDown={e => handleKeyDown(e, ci)}
                tabIndex={ci + 1}
              />
            </div>
          );
        })}
      </div>

      <div className="timed-actions">
        <button className="timed-btn-verify" disabled={!allFilled()} onClick={handleVerify}>
          ✓ Verificar
        </button>
        <button className="timed-btn-skip" onClick={handleSkip}>
          → Saltar <span className="skip-penalty">−3s</span>
        </button>
      </div>

      <div className="timed-footer-stats">
        <span>✓ {solved} resueltas</span>
        <span>↷ {skipped} saltadas</span>
      </div>
    </div>
  );
}
