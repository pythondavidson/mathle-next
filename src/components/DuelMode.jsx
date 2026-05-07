'use client';
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { isLoggedIn, getUser } from '../services/api';
import './DuelMode.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── BANCO DE ECUACIONES (igual que TimedMode) ──────────────
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

// ── UTILIDADES ─────────────────────────────────────────────
function parseEquation(eqStr) {
  const tokens = [];
  let buf = '';
  let bi = 0;
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
  const peek = () => s[pos];
  const consume = () => s[pos++];
  const skipSpaces = () => { while (pos < s.length && s[pos] === ' ') pos++; };
  const parseAddSub = () => {
    let left = parseMulDiv(); skipSpaces();
    while (pos < s.length && (peek() === '+' || (peek() === '-' && s[pos - 1] !== '^'))) {
      const op = consume();
      left = op === '+' ? left + parseMulDiv() : left - parseMulDiv();
      skipSpaces();
    }
    return left;
  };
  const parseMulDiv = () => {
    let left = parsePow(); skipSpaces();
    while (pos < s.length && (peek() === '*' || peek() === '/')) {
      const op = consume();
      left = op === '*' ? left * parsePow() : left / parsePow();
      skipSpaces();
    }
    return left;
  };
  const parsePow = () => {
    let base = parseUnary(); skipSpaces();
    if (pos < s.length && peek() === '^') { consume(); base = Math.pow(base, parseUnary()); }
    return base;
  };
  const parseUnary = () => {
    skipSpaces();
    if (peek() === '-') { consume(); return -parseAtom(); }
    if (peek() === '+') { consume(); return parseAtom(); }
    return parseAtom();
  };
  const parseAtom = () => {
    skipSpaces();
    if (peek() === '(') {
      consume(); const val = parseAddSub(); skipSpaces();
      if (peek() === ')') consume(); return val;
    }
    let numStr = '';
    while (pos < s.length && /[\d.]/.test(peek())) numStr += consume();
    if (numStr === '') return NaN;
    return parseFloat(numStr);
  };
  try { pos = 0; const r = parseAddSub(); return isFinite(r) ? r : NaN; } catch { return NaN; }
}

function checkAnswer(eqStr, values) {
  let filled = eqStr;
  let vi = 0;
  filled = filled.replace(/\?/g, () => values[vi++] ?? '?');
  if (filled.includes('?')) return false;
  const sides = filled.split('=');
  if (sides.length !== 2) return false;
  const left = evalSide(sides[0]);
  const right = evalSide(sides[1]);
  if (isNaN(left) || isNaN(right)) return false;
  return Math.abs(left - right) < 1e-9;
}

function getRandomEq() {
  return EQUATIONS[Math.floor(Math.random() * EQUATIONS.length)];
}

// ── COMPONENTE ─────────────────────────────────────────────
export default function DuelMode() {
  const [fase, setFase] = useState('lobby');
  const [codigo, setCodigo] = useState('');
  const [codigoInput, setCodigoInput] = useState('');
  const [jugadores, setJugadores] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [eq, setEq] = useState(null);
  const [parsed, setParsed] = useState([]);
  const [values, setValues] = useState([]);
  const [shake, setShake] = useState(false);
  const [solved, setSolved] = useState(0);

  const socketRef = useRef(null);
  const inputRefs = useRef({});
  const countdownRef = useRef(null);
  const user = getUser();
  const username = user?.username || 'tú';

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(countdownRef.current);
    };
  }, []);

  function conectar() {
    if (socketRef.current) return;
    const socket = io(API_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('duelo-creado', ({ codigo }) => {
      setCodigo(codigo);
      setFase('esperando');
    });

    socket.on('duelo-iniciado', ({ players }) => {
      setJugadores(players);
      const randomEq = getRandomEq();
      setEq(randomEq);
      setParsed(parseEquation(randomEq.eq));
      setValues(Array(randomEq.blanks.length).fill(''));
      setSolved(0);
      setFase('countdown');

      let c = 5;
      setCountdown(c);
      countdownRef.current = setInterval(() => {
        c--;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(countdownRef.current);
          setFase('jugando');
          setTimeout(() => inputRefs.current['0']?.focus(), 80);
        }
      }, 1000);
    });

    socket.on('respuesta-incorrecta', () => {
      setShake(true);
      setTimeout(() => setShake(false), 400);
    });

    socket.on('duelo-terminado', (data) => {
      clearInterval(countdownRef.current);
      setResultado(data);
      setFase('resultado');
    });

    socket.on('error-duelo', ({ mensaje }) => {
      setError(mensaje);
    });
  }

  function crearDuelo() {
    if (!isLoggedIn()) { setError('Debes iniciar sesión para jugar duelos'); return; }
    conectar();
    socketRef.current.emit('crear-duelo', { username });
  }

  function unirseADuelo() {
    if (!isLoggedIn()) { setError('Debes iniciar sesión para jugar duelos'); return; }
    if (!codigoInput.trim()) { setError('Introduce el código del duelo'); return; }
    conectar();
    socketRef.current.emit('unirse-duelo', { codigo: codigoInput.trim().toUpperCase(), username });
  }

  function enviarRespuesta() {
    if (!eq || values.some(v => v === '')) return;
    const codigoActivo = codigo || codigoInput.trim().toUpperCase();

    if (checkAnswer(eq.eq, values)) {
      socketRef.current.emit('respuesta-duelo', { codigo: codigoActivo, respuesta: values });
      setSolved(s => s + 1);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      const next = getRandomEq();
      setEq(next);
      setParsed(parseEquation(next.eq));
      setValues(Array(next.blanks.length).fill(''));
      setTimeout(() => inputRefs.current['0']?.focus(), 80);
    }
  }

  function handleInput(idx, val) {
    const next = [...values];
    next[idx] = val;
    setValues(next);
  }

  function handleKeyDown(e, idx) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextInput = inputRefs.current[`${idx + 1}`];
      if (nextInput) nextInput.focus();
      else enviarRespuesta();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      enviarRespuesta();
    }
  }

  function rendirse() {
    const codigoActivo = codigo || codigoInput.trim().toUpperCase();
    socketRef.current?.emit('rendirse', { codigo: codigoActivo });
  }

  function reiniciar() {
    if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    clearInterval(countdownRef.current);
    setFase('lobby'); setCodigo(''); setCodigoInput('');
    setJugadores([]); setResultado(null); setError('');
    setEq(null); setParsed([]); setValues([]); setSolved(0); setCountdown(5);
  }

  const rival = jugadores.find(j => j !== username) || '???';
  const codigoActivo = codigo || codigoInput.trim().toUpperCase();

  // ── LOBBY ──────────────────────────────────────────────────
  if (fase === 'lobby') return (
    <div className="duel-root duel-root--centered">
      <div className="duel-card">
        <div className="duel-icon">⚔️</div>
        <h1 className="duel-title">Duelos</h1>
        <p className="duel-subtitle">Reta a un amigo en tiempo real</p>
        {error && <div className="duel-error">{error}</div>}
        <button className="duel-btn-primary" onClick={crearDuelo}>+ Crear duelo</button>
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
          <button className="duel-btn-secondary" onClick={unirseADuelo}>Unirse</button>
        </div>
        <div className="duel-info">
          <p>📋 Crea un duelo y comparte el código con tu rival.</p>
          <p>⚡ El primero en verificar la ecuación correcta gana.</p>
        </div>
      </div>
    </div>
  );

  // ── ESPERANDO ──────────────────────────────────────────────
  if (fase === 'esperando') return (
    <div className="duel-root duel-root--centered">
      <div className="duel-card">
        <div className="duel-icon">⏳</div>
        <h1 className="duel-title">Esperando rival...</h1>
        <p className="duel-subtitle">Comparte este código</p>
        <div className="duel-codigo-display">
          <span className="duel-codigo-text">{codigo}</span>
          <button className="duel-btn-copy" onClick={() => navigator.clipboard.writeText(codigo)}>Copiar</button>
        </div>
        <p className="duel-hint">El duelo empieza en cuanto tu rival se una.</p>
        <button className="duel-btn-ghost" onClick={reiniciar}>Cancelar</button>
      </div>
    </div>
  );

  // ── COUNTDOWN ──────────────────────────────────────────────
  if (fase === 'countdown') return (
    <div className="duel-root duel-root--centered">
      <div className="duel-card">
        <div className="duel-vs-row">
          <span className="duel-player duel-player-you">{username}</span>
          <span className="duel-vs">VS</span>
          <span className="duel-player duel-player-rival">{rival}</span>
        </div>
        <div className="duel-countdown-num">{countdown > 0 ? countdown : '¡Ya!'}</div>
        <p className="duel-hint">Prepárate...</p>
      </div>
    </div>
  );

  // ── JUGANDO ────────────────────────────────────────────────
  if (fase === 'jugando') return (
    <div className="duel-root">
      <div className="duel-vs-row">
        <span className="duel-player duel-player-you">{username}</span>
        <span className="duel-vs">VS</span>
        <span className="duel-player duel-player-rival">{rival}</span>
      </div>

      <div className="duel-solved-row">
        <span className="duel-solved-badge">✓ {solved} correctas</span>
        <span className="duel-diff-badge">{eq?.difficulty}</span>
      </div>

      {eq && (
        <div
          className="duel-eq-template"
          dangerouslySetInnerHTML={{ __html: superscriptify(eq.eq.replace(/\?/g, '▢')) }}
        />
      )}

      <div className={`duel-row${shake ? ' duel-shake' : ''}`}>
        {parsed.map((token, ti) => {
          if (token.type === 'frag') {
            return (
              <span key={ti} className="duel-frag"
                dangerouslySetInnerHTML={{ __html: superscriptify(token.text) }} />
            );
          }
          const ci = token.index;
          return (
            <div key={ti} className="duel-cell">
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

      <div className="duel-actions">
        <button
          className="duel-btn-verify"
          disabled={values.some(v => v === '')}
          onClick={enviarRespuesta}
        >
          ✓ Verificar
        </button>
        <button className="duel-btn-ghost" onClick={rendirse}>Rendirse</button>
      </div>
      <p className="duel-hint" style={{ marginTop: '0.5rem' }}>Enter o Tab para verificar</p>
    </div>
  );

  // ── RESULTADO ──────────────────────────────────────────────
  if (fase === 'resultado') {
    const gane = resultado?.ganador === username;
    return (
      <div className="duel-root duel-root--centered">
        <div className="duel-card">
          <div className={`duel-resultado ${gane ? 'duel-win' : 'duel-lose'}`}>
            <span className="duel-resultado-emoji">{gane ? '🏆' : '💀'}</span>
            <h2 className="duel-resultado-titulo">{gane ? '¡Victoria!' : 'Derrota'}</h2>
            <p className="duel-resultado-sub">
              {resultado?.desconectado
                ? `${resultado.perdedor} se desconectó`
                : resultado?.rendido
                ? `${resultado.perdedor} se rindió`
                : `${resultado.ganador} resolvió primero`}
            </p>
          </div>
          {eq && (
            <div className="duel-resultado-problem">
              <p className="duel-resultado-label">Última ecuación</p>
              <p className="duel-resultado-ecuacion"
                dangerouslySetInnerHTML={{ __html: superscriptify(eq.eq) }} />
              <p className="duel-resultado-label">Respuesta correcta</p>
              <p className="duel-resultado-answer">{eq.blanks.join(', ')}</p>
            </div>
          )}
          <p className="duel-resultado-stats">Ecuaciones correctas: <strong>{solved}</strong></p>
          <button className="duel-btn-primary" onClick={reiniciar}>Nuevo duelo</button>
        </div>
      </div>
    );
  }
}
