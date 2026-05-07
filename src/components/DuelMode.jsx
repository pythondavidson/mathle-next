'use client';
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { isLoggedIn, getUser } from '../services/api';
import './DuelMode.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const COUNTDOWN_TOTAL = 5;

// ── BANCO DE ECUACIONES ─────────────────────────────────────
const EQUATIONS = [
  { eq: "? + 7 = 10",             blanks: [3],     difficulty: "fácil" },
  { eq: "2 × ? = 12",             blanks: [6],     difficulty: "fácil" },
  { eq: "8 − ? = 2",              blanks: [6],     difficulty: "fácil" },
  { eq: "2 × ? + 3 = 11",         blanks: [4],     difficulty: "fácil" },
  { eq: "10 ÷ ? = 2",             blanks: [5],     difficulty: "fácil" },
  { eq: "? + 2 + 4 = 9",          blanks: [3],     difficulty: "fácil" },
  { eq: "3 × ? − 2 = 10",         blanks: [4],     difficulty: "fácil" },
  { eq: "?^2 − ? = 7",            blanks: [3, 2],  difficulty: "medio" },
  { eq: "?^2 + ? = 12",           blanks: [3, 3],  difficulty: "medio" },
  { eq: "3 × ? − ? = 4",          blanks: [4, 8],  difficulty: "medio" },
  { eq: "(? + 1) × ? = 15",       blanks: [4, 3],  difficulty: "medio" },
  { eq: "2 × ? + 3 × ? = 17",     blanks: [4, 3],  difficulty: "medio" },
  { eq: "?^2 − ?^2 = 5",          blanks: [3, 2],  difficulty: "medio" },
  { eq: "?^2 + 2 × ? = 22",       blanks: [4, 3],  difficulty: "difícil" },
  { eq: "(? + 1) × (? − 1) = 8",  blanks: [3, 3],  difficulty: "difícil" },
  { eq: "? + ? = 8",              blanks: [3, 5],  difficulty: "difícil" },
  { eq: "?^3 − 2 × ? = 2",        blanks: [2, 3],  difficulty: "difícil" },
  { eq: "?^2 × 3 − ? = 23",       blanks: [3, 4],  difficulty: "difícil" },
];

// ── UTILIDADES ──────────────────────────────────────────────
function parseEquation(eqStr) {
  const tokens = []; let buf = ''; let bi = 0;
  for (let i = 0; i < eqStr.length; i++) {
    const ch = eqStr[i];
    if (ch === '?') {
      if (buf) { tokens.push({ type: 'frag', text: buf }); buf = ''; }
      tokens.push({ type: 'blank', index: bi++ });
    } else { buf += ch; }
  }
  if (buf) tokens.push({ type: 'frag', text: buf });
  return tokens;
}

function superscriptify(text) {
  return text.replace(/\^([^\s+\-×÷=()^?]+)/g, '<sup>$1</sup>');
}

function evalSide(expr) {
  const s = expr.trim().replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  let pos = 0;
  const peek = () => s[pos]; const consume = () => s[pos++];
  const skip = () => { while (pos < s.length && s[pos] === ' ') pos++; };
  const addSub = () => {
    let l = mulDiv(); skip();
    while (pos < s.length && (peek() === '+' || (peek() === '-' && s[pos-1] !== '^'))) {
      const op = consume(); l = op === '+' ? l + mulDiv() : l - mulDiv(); skip();
    }
    return l;
  };
  const mulDiv = () => {
    let l = pw(); skip();
    while (pos < s.length && (peek() === '*' || peek() === '/')) {
      const op = consume(); l = op === '*' ? l * pw() : l / pw(); skip();
    }
    return l;
  };
  const pw = () => { let b = unary(); skip(); if (pos < s.length && peek() === '^') { consume(); b = Math.pow(b, unary()); } return b; };
  const unary = () => { skip(); if (peek() === '-') { consume(); return -atom(); } if (peek() === '+') { consume(); return atom(); } return atom(); };
  const atom = () => {
    skip();
    if (peek() === '(') { consume(); const v = addSub(); skip(); if (peek() === ')') consume(); return v; }
    let n = ''; while (pos < s.length && /[\d.]/.test(peek())) n += consume();
    if (!n) return NaN; return parseFloat(n);
  };
  try { pos = 0; const r = addSub(); return isFinite(r) ? r : NaN; } catch { return NaN; }
}

function buildExpr(parsed, values) {
  let bi = 0, expr = '';
  for (const t of parsed) {
    if (t.type === 'frag') expr += t.text;
    else { const v = values[bi]; expr += (v === '' || v === '-') ? '?' : v; bi++; }
  }
  return expr;
}

function equationIsValid(parsed, values) {
  const full = buildExpr(parsed, values);
  if (full.includes('?')) return false;
  const sides = full.split('=');
  if (sides.length !== 2) return false;
  const l = evalSide(sides[0]), r = evalSide(sides[1]);
  if (isNaN(l) || isNaN(r)) return false;
  return Math.abs(l - r) < 1e-9;
}

function getRandomEq(usedSet) {
  const pool = EQUATIONS.filter((_, i) => !usedSet.has(i));
  const src = pool.length ? pool : EQUATIONS;
  const pick = src[Math.floor(Math.random() * src.length)];
  return { eq: pick, id: EQUATIONS.indexOf(pick) };
}

// ── COMPONENTE ──────────────────────────────────────────────
export default function DuelMode() {
  const [fase, setFase]           = useState('lobby');
  const [codigo, setCodigo]       = useState('');
  const [codigoInput, setCodigoInput] = useState('');
  const [jugadores, setJugadores] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [error, setError]         = useState('');

  // countdown: cuenta de COUNTDOWN_TOTAL+1 a 0 para que el anillo llegue a vacío
  const [countdown, setCountdown] = useState(COUNTDOWN_TOTAL);

  // juego
  const [eq, setEq]         = useState(null);
  const [parsed, setParsed] = useState([]);
  const [values, setValues] = useState([]);
  const [rowAnim, setRowAnim] = useState('');
  const [solved, setSolved]   = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [usedIds, setUsedIds] = useState(new Set());

  const socketRef      = useRef(null);
  const inputRefs      = useRef({});
  const countdownRef   = useRef(null);
  const solvedRef      = useRef(0);
  const usedIdsRef     = useRef(new Set());

  const user = getUser();
  const username = user?.username || 'tú';

  useEffect(() => () => {
    socketRef.current?.disconnect();
    clearInterval(countdownRef.current);
  }, []);

  function loadNextEq(currentUsed) {
    const result = getRandomEq(currentUsed);
    const newUsed = new Set(currentUsed);
    newUsed.add(result.id);
    usedIdsRef.current = newUsed;
    setUsedIds(newUsed);
    setEq(result.eq);
    setParsed(parseEquation(result.eq.eq));
    setValues(Array(result.eq.blanks.length).fill(''));
    setTimeout(() => inputRefs.current['0']?.focus(), 60);
  }

  function conectar() {
    if (socketRef.current) return;
    const socket = io(API_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('duelo-creado', ({ codigo }) => { setCodigo(codigo); setFase('esperando'); });

    socket.on('duelo-iniciado', ({ players }) => {
      setJugadores(players);
      solvedRef.current = 0; setSolved(0);
      setSkipped(0);
      const fresh = new Set();
      usedIdsRef.current = fresh;
      const result = getRandomEq(fresh);
      const newUsed = new Set([result.id]);
      usedIdsRef.current = newUsed;
      setUsedIds(newUsed);
      setEq(result.eq);
      setParsed(parseEquation(result.eq.eq));
      setValues(Array(result.eq.blanks.length).fill(''));

      // Arrancar countdown desde COUNTDOWN_TOTAL+1 y bajar hasta 0
      // El anillo empieza lleno (c=COUNTDOWN_TOTAL) y termina vacío (c=0)
      let c = COUNTDOWN_TOTAL;
      setCountdown(c);
      setFase('countdown');

      countdownRef.current = setInterval(() => {
        c--;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(countdownRef.current);
          setTimeout(() => {
            setFase('jugando');
            setTimeout(() => inputRefs.current['0']?.focus(), 80);
          }, 900); // pequeño delay para que se vea el anillo vacío y el "¡Ya!"
        }
      }, 1000);
    });

    socket.on('duelo-terminado', (data) => {
      clearInterval(countdownRef.current);
      setResultado(data);
      setFase('resultado');
    });

    socket.on('error-duelo', ({ mensaje }) => setError(mensaje));
  }

  function crearDuelo() {
    if (!isLoggedIn()) { setError('Debes iniciar sesión para jugar duelos'); return; }
    conectar(); socketRef.current.emit('crear-duelo', { username });
  }

  function unirseADuelo() {
    if (!isLoggedIn()) { setError('Debes iniciar sesión para jugar duelos'); return; }
    if (!codigoInput.trim()) { setError('Introduce el código del duelo'); return; }
    conectar(); socketRef.current.emit('unirse-duelo', { codigo: codigoInput.trim().toUpperCase(), username });
  }

  function handleInput(ci, val) {
    if (fase !== 'jugando') return;
    const trimmed = val.length > 1 ? val.slice(-1) : val;
    if (trimmed !== '' && trimmed !== '-' && !/^-?\d$/.test(trimmed)) return;
    setValues(prev => { const next = [...prev]; next[ci] = trimmed; return next; });
    if (trimmed !== '' && trimmed !== '-' && eq && ci < eq.blanks.length - 1) {
      setTimeout(() => inputRefs.current[`${ci + 1}`]?.focus(), 0);
    }
  }

  function handleKeyDown(e, ci) {
    if (fase !== 'jugando') return;
    if (e.key === 'Backspace' && values[ci] === '' && ci > 0) {
      setValues(prev => { const n = [...prev]; n[ci - 1] = ''; return n; });
      setTimeout(() => inputRefs.current[`${ci - 1}`]?.focus(), 0);
    }
    if (e.key === 'Enter') { e.preventDefault(); handleVerify(); }
    if (e.key === 'Tab')   { e.preventDefault(); handleVerify(); }
  }

  function handleVerify() {
    if (fase !== 'jugando') return;
    if (values.some(v => v === '' || v === '-')) return;
    const codigoActivo = codigo || codigoInput.trim().toUpperCase();
    if (equationIsValid(parsed, values)) {
      socketRef.current.emit('respuesta-duelo', { codigo: codigoActivo, respuesta: values });
      const newSolved = solvedRef.current + 1;
      solvedRef.current = newSolved;
      setSolved(newSolved);
      loadNextEq(usedIdsRef.current);
    } else {
      setRowAnim('shake');
      setTimeout(() => setRowAnim(''), 450);
    }
  }

  function handleSkip() {
    if (fase !== 'jugando') return;
    setSkipped(s => s + 1);
    loadNextEq(usedIdsRef.current);
  }

  function rendirse() {
    const codigoActivo = codigo || codigoInput.trim().toUpperCase();
    socketRef.current?.emit('rendirse', { codigo: codigoActivo });
  }

  function reiniciar() {
    socketRef.current?.disconnect(); socketRef.current = null;
    clearInterval(countdownRef.current);
    setFase('lobby'); setCodigo(''); setCodigoInput('');
    setJugadores([]); setResultado(null); setError('');
    setEq(null); setParsed([]); setValues([]);
    setSolved(0); solvedRef.current = 0;
    setSkipped(0); setUsedIds(new Set()); usedIdsRef.current = new Set();
    setCountdown(COUNTDOWN_TOTAL);
  }

  const rival = jugadores.find(j => j !== username) || '???';
  // Anillo: lleno cuando countdown=COUNTDOWN_TOTAL, vacío cuando countdown=0
  const circumference = 2 * Math.PI * 28;
  const countdownPct  = countdown / COUNTDOWN_TOTAL; // 1→0
  const dashOffset    = circumference * (1 - countdownPct);

  // ── LOBBY ────────────────────────────────────────────────
  if (fase === 'lobby') return (
    <div className="timed-root timed-root--idle">
      <div className="timed-idle">
        <div className="timed-idle-icon">⚔️</div>
        <h1 className="timed-idle-title">Modo Duelo</h1>
        <p className="timed-idle-desc">
          Reta a un amigo en tiempo real.<br />
          El primero en verificar la ecuación <strong>gana</strong>.
        </p>
        {error && <div className="duel-error">{error}</div>}
        <button className="timed-start-btn" onClick={crearDuelo}>+ Crear duelo</button>
        <div className="duel-divider">o</div>
        <div className="duel-join-row">
          <input
            className="duel-input"
            placeholder="CÓDIGO"
            value={codigoInput}
            onChange={e => setCodigoInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && unirseADuelo()}
            maxLength={5}
          />
          <button className="timed-start-btn" style={{ width: 'auto', padding: '14px 24px' }} onClick={unirseADuelo}>Unirse</button>
        </div>
        <div className="timed-idle-hint">El primero en acertar la ecuación gana la ronda</div>
      </div>
    </div>
  );

  // ── ESPERANDO ────────────────────────────────────────────
  if (fase === 'esperando') return (
    <div className="timed-root timed-root--idle">
      <div className="timed-idle">
        <div className="timed-idle-icon">⏳</div>
        <h1 className="timed-idle-title">Esperando rival...</h1>
        <div className="timed-best-wrap">
          <span className="timed-best-label">Código del duelo</span>
          <span className="timed-best-value" style={{ letterSpacing: '0.2em' }}>{codigo}</span>
        </div>
        <button
          className="timed-start-btn"
          onClick={() => navigator.clipboard.writeText(codigo)}
        >
          Copiar código
        </button>
        <p className="timed-idle-hint">El duelo empieza en cuanto tu rival se una</p>
        <button className="timed-go-btn" style={{ border: '1px solid #2a3145', color: '#64748b' }} onClick={reiniciar}>Cancelar</button>
      </div>
    </div>
  );

  // ── COUNTDOWN ────────────────────────────────────────────
  if (fase === 'countdown') return (
    <div className="timed-root timed-root--idle">
      <div className="timed-idle">
        <div className="duel-vs-strip">
          <span className="duel-vs-name duel-vs-you">{username}</span>
          <span className="duel-vs-label">VS</span>
          <span className="duel-vs-name duel-vs-rival">{rival}</span>
        </div>

        {/* Mismo anillo que TimedMode pero más grande */}
        <div className="timed-clock-wrap" style={{ width: 120, height: 120 }}>
          <svg className="timed-clock-ring" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" className="ring-bg" />
            <circle
              cx="32" cy="32" r="28"
              className="ring-fg"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <span className="timed-clock-num" style={{ fontSize: 36 }}>
            {countdown > 0 ? countdown : '¡Ya!'}
          </span>
        </div>

        <p className="timed-idle-hint">Prepárate...</p>
      </div>
    </div>
  );

  // ── JUGANDO ──────────────────────────────────────────────
  if (fase === 'jugando') return (
    <div className="timed-root">
      {/* Header igual que TimedMode pero con VS en vez de puntos/combo */}
      <div className="timed-header">
        <div className="timed-score-wrap">
          <span className="timed-score-label">Correctas</span>
          <span className="timed-score">{solved}</span>
        </div>

        <div className="duel-vs-strip duel-vs-strip--compact">
          <span className="duel-vs-name duel-vs-you">{username}</span>
          <span className="duel-vs-label">VS</span>
          <span className="duel-vs-name duel-vs-rival">{rival}</span>
        </div>

        <div className="timed-combo-wrap">
          <span className="timed-combo-label">Saltadas</span>
          <span className="timed-combo">{skipped > 0 ? skipped : '—'}</span>
        </div>
      </div>

      {/* Barra decorativa vacía (sin timer) */}
      <div className="timed-bar-wrap">
        <div className="timed-bar-fill safe" style={{ width: '100%' }} />
      </div>

      <div className="timed-diff-row">
        <div className="timed-diff-badge">{eq?.difficulty}</div>
      </div>

      {eq && (
        <div
          className="timed-eq-template"
          dangerouslySetInnerHTML={{ __html: superscriptify(eq.eq.replace(/\?/g, '▢')) }}
        />
      )}

      <div className="timed-float-zone" />

      <div className={`timed-row ${rowAnim}`}>
        {parsed.map((token, ti) => {
          if (token.type === 'frag') {
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
                value={values[ci] ?? ''}
                onChange={e => handleInput(ci, e.target.value)}
                onKeyDown={e => handleKeyDown(e, ci)}
                tabIndex={ci + 1}
                autoFocus={ci === 0}
              />
            </div>
          );
        })}
      </div>

      {/* Botones: Verificar + Saltar en la misma fila, Rendirse debajo */}
      <div className="timed-actions">
        <button
          className="timed-btn-verify"
          disabled={values.some(v => v === '' || v === '-')}
          onClick={handleVerify}
        >
          ✓ Verificar
        </button>
        <button className="timed-btn-skip" onClick={handleSkip}>
          → Saltar
        </button>
      </div>

      <div className="timed-actions" style={{ marginTop: 0 }}>
        <button
          className="timed-btn-skip"
          style={{ flex: 1, color: 'var(--red)', borderColor: 'var(--red)' }}
          onClick={rendirse}
        >
          ⚑ Rendirse
        </button>
      </div>

      <div className="timed-footer-stats">
        <span>✓ {solved} correctas</span>
        <span>↷ {skipped} saltadas</span>
      </div>
    </div>
  );

  // ── RESULTADO ────────────────────────────────────────────
  if (fase === 'resultado') {
    const gane = resultado?.ganador === username;
    return (
      <div className="timed-root timed-root--idle">
        <div className="timed-gameover">
          <div className="timed-go-bg" />
          <div className="timed-go-content">
            <div className="timed-go-label" style={{ color: gane ? 'var(--green)' : 'var(--red)' }}>
              {gane ? '¡ V I C T O R I A !' : 'D E R R O T A'}
            </div>
            <div className="timed-go-score" style={{ fontSize: 72 }}>
              {gane ? '🏆' : '💀'}
            </div>
            <div className="timed-go-pts-label">
              {resultado?.desconectado
                ? `${resultado.perdedor} se desconectó`
                : resultado?.rendido
                ? `${resultado.perdedor} se rindió`
                : `${resultado.ganador} resolvió primero`}
            </div>

            <div className="timed-go-stats">
              <div className="timed-go-stat">
                <span className="timed-go-stat-val">{solved}</span>
                <span className="timed-go-stat-lbl">correctas</span>
              </div>
              <div className="timed-go-stat">
                <span className="timed-go-stat-val">{skipped}</span>
                <span className="timed-go-stat-lbl">saltadas</span>
              </div>
            </div>

            <div className="timed-go-actions">
              <button className="timed-go-btn primary" onClick={reiniciar}>↻ Nuevo duelo</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
