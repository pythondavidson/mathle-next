'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { isLoggedIn, getUser } from '../services/api';
import './TimedMode.css';
import './DuelMode.css';


const API_URL        = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const COUNTDOWN_TOTAL = 5;
const GAME_DURATION   = 60;
const BONUS_TIME      = 5;

// ── BANCO DE ECUACIONES ─────────────────────────────────────
const EQUATIONS = [
  { eq: "? + 7 = 10",             blanks: [3],     difficulty: "fácil",   points: 100 },
  { eq: "2 × ? = 12",             blanks: [6],     difficulty: "fácil",   points: 100 },
  { eq: "8 − ? = 2",              blanks: [6],     difficulty: "fácil",   points: 100 },
  { eq: "2 × ? + 3 = 11",         blanks: [4],     difficulty: "fácil",   points: 100 },
  { eq: "10 ÷ ? = 2",             blanks: [5],     difficulty: "fácil",   points: 100 },
  { eq: "? + 2 + 4 = 9",          blanks: [3],     difficulty: "fácil",   points: 100 },
  { eq: "3 × ? − 2 = 10",         blanks: [4],     difficulty: "fácil",   points: 100 },
  { eq: "?^2 − ? = 7",            blanks: [3, 2],  difficulty: "medio",   points: 200 },
  { eq: "?^2 + ? = 12",           blanks: [3, 3],  difficulty: "medio",   points: 200 },
  { eq: "3 × ? − ? = 4",          blanks: [4, 8],  difficulty: "medio",   points: 200 },
  { eq: "(? + 1) × ? = 15",       blanks: [4, 3],  difficulty: "medio",   points: 200 },
  { eq: "2 × ? + 3 × ? = 17",     blanks: [4, 3],  difficulty: "medio",   points: 200 },
  { eq: "?^2 − ?^2 = 5",          blanks: [3, 2],  difficulty: "medio",   points: 200 },
  { eq: "?^2 + 2 × ? = 22",       blanks: [4, 3],  difficulty: "difícil", points: 350 },
  { eq: "(? + 1) × (? − 1) = 8",  blanks: [3, 3],  difficulty: "difícil", points: 350 },
  { eq: "? + ? = 8",              blanks: [3, 5],  difficulty: "difícil", points: 350 },
  { eq: "?^3 − 2 × ? = 2",        blanks: [2, 3],  difficulty: "difícil", points: 350 },
  { eq: "?^2 × 3 − ? = 23",       blanks: [3, 4],  difficulty: "difícil", points: 350 },
];

// ── UTILIDADES ──────────────────────────────────────────────
function parseEquation(eqStr) {
  const tokens = []; let buf = ''; let bi = 0;
  for (const ch of eqStr) {
    if (ch === '?') { if (buf) { tokens.push({ type: 'frag', text: buf }); buf = ''; } tokens.push({ type: 'blank', index: bi++ }); }
    else buf += ch;
  }
  if (buf) tokens.push({ type: 'frag', text: buf });
  return tokens;
}

function superscriptify(text) {
  return text.replace(/\^([^\s+\-×÷=()^?]+)/g, '<sup>$1</sup>');
}

function evalSide(expr) {
  const s = expr.trim().replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
  let pos = 0;
  const peek = () => s[pos]; const consume = () => s[pos++];
  const skip = () => { while (pos < s.length && s[pos] === ' ') pos++; };
  const addSub = () => {
    let l = mulDiv(); skip();
    while (pos < s.length && (peek()==='+' || (peek()==='-' && s[pos-1]!=='^'))) { const op=consume(); l=op==='+'?l+mulDiv():l-mulDiv(); skip(); }
    return l;
  };
  const mulDiv = () => {
    let l = pw(); skip();
    while (pos < s.length && (peek()==='*'||peek()==='/')) { const op=consume(); l=op==='*'?l*pw():l/pw(); skip(); }
    return l;
  };
  const pw = () => { let b=unary(); skip(); if(pos<s.length&&peek()==='^'){consume();b=Math.pow(b,unary());} return b; };
  const unary = () => { skip(); if(peek()==='-'){consume();return -atom();} if(peek()==='+'){consume();return atom();} return atom(); };
  const atom = () => {
    skip();
    if(peek()==='('){consume();const v=addSub();skip();if(peek()===')') consume();return v;}
    let n=''; while(pos<s.length&&/[\d.]/.test(peek())) n+=consume();
    if(!n) return NaN; return parseFloat(n);
  };
  try { pos=0; const r=addSub(); return isFinite(r)?r:NaN; } catch { return NaN; }
}

function buildExpr(parsed, values) {
  let bi=0, expr='';
  for (const t of parsed) {
    if (t.type==='frag') expr+=t.text;
    else { const v=values[bi]; expr+=(v===''||v==='-')?'?':v; bi++; }
  }
  return expr;
}

function equationIsValid(parsed, values) {
  const full = buildExpr(parsed, values);
  if (full.includes('?')) return false;
  const sides = full.split('=');
  if (sides.length !== 2) return false;
  const l=evalSide(sides[0]), r=evalSide(sides[1]);
  return !isNaN(l) && !isNaN(r) && Math.abs(l-r) < 1e-9;
}

function getRandomEq(usedSet) {
  const pool = EQUATIONS.filter((_,i) => !usedSet.has(i));
  const src  = pool.length ? pool : EQUATIONS;
  const pick = src[Math.floor(Math.random()*src.length)];
  return { eq: pick, id: EQUATIONS.indexOf(pick) };
}

// ── COMPONENTE ──────────────────────────────────────────────
export default function DuelMode() {
  const [fase, setFase]               = useState('lobby');
  const [codigo, setCodigo]           = useState('');
  const [codigoInput, setCodigoInput] = useState('');
  const [jugadores, setJugadores]     = useState([]);
  const [resultado, setResultado]     = useState(null);
  const [error, setError]             = useState('');
  const [copiado, setCopiado]         = useState(false);

  // countdown
  const [countdown, setCountdown] = useState(COUNTDOWN_TOTAL);

  // juego
  const [timeLeft, setTimeLeft]   = useState(GAME_DURATION);
  const [score, setScore]         = useState(0);
  const [combo, setCombo]         = useState(0);
  const [solved, setSolved]       = useState(0);
  const [skipped, setSkipped]     = useState(0);
  const [lastPoints, setLastPoints] = useState(null);
  const [bonusAnim, setBonusAnim] = useState(null);
  const [toast, setToast]         = useState({ msg:'', error:false, show:false });
  const [eq, setEq]               = useState(null);
  const [parsed, setParsed]       = useState([]);
  const [values, setValues]       = useState([]);
  const [rowAnim, setRowAnim]     = useState('');
  const [usedIds, setUsedIds]     = useState(new Set());

  const socketRef    = useRef(null);
  const inputRefs    = useRef({});
  const countdownRef = useRef(null);
  const gameTimerRef = useRef(null);
  const toastRef     = useRef(null);
  const scoreRef     = useRef(0);
  const solvedRef    = useRef(0);
  const timeRef      = useRef(GAME_DURATION);
  const comboRef     = useRef(0);
  const usedIdsRef   = useRef(new Set());
  const codigoRef    = useRef('');

  const user     = getUser();
  const username = user?.username || 'tú';

  useEffect(() => () => {
    socketRef.current?.disconnect();
    clearInterval(countdownRef.current);
    clearInterval(gameTimerRef.current);
    clearTimeout(toastRef.current);
  }, []);

  const showToast = useCallback((msg, isError=false) => {
    setToast({ msg, error: isError, show: true });
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 1800);
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

  function startGameTimer(codigoActivo) {
    timeRef.current = GAME_DURATION;
    setTimeLeft(GAME_DURATION);
    gameTimerRef.current = setInterval(() => {
      timeRef.current -= 1;
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) {
        clearInterval(gameTimerRef.current);
        setFase('esperando-resultado');
        // Enviar score final al servidor
        socketRef.current?.emit('tiempo-agotado', {
          codigo: codigoActivo,
          score: scoreRef.current,
          solved: solvedRef.current,
        });
      }
    }, 1000);
  }

  function conectar() {
    if (socketRef.current) return;
    const socket = io(API_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('duelo-creado', ({ codigo }) => {
      setCodigo(codigo); codigoRef.current = codigo; setFase('esperando');
    });

    socket.on('duelo-iniciado', ({ players }) => {
      setJugadores(players);
      scoreRef.current = 0; solvedRef.current = 0; comboRef.current = 0;
      setScore(0); setSolved(0); setSkipped(0); setCombo(0);
      setLastPoints(null); setBonusAnim(null); setRowAnim('');
      const fresh = new Set();
      usedIdsRef.current = fresh;
      const result = getRandomEq(fresh);
      const newUsed = new Set([result.id]);
      usedIdsRef.current = newUsed;
      setUsedIds(newUsed);
      setEq(result.eq);
      setParsed(parseEquation(result.eq.eq));
      setValues(Array(result.eq.blanks.length).fill(''));

      // Countdown 5→0
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
          }, 900);
        }
      }, 1000);
    });

    // El servidor nos dice que el juego arranca (después del countdown del servidor)
    socket.on('duelo-arranca', () => {
      const ca = codigoRef.current || codigoInput.trim().toUpperCase();
      startGameTimer(ca);
    });

    socket.on('duelo-terminado', (data) => {
      clearInterval(gameTimerRef.current);
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
    codigoRef.current = codigoInput.trim().toUpperCase();
    conectar(); socketRef.current.emit('unirse-duelo', { codigo: codigoRef.current, username });
  }

  function handleInput(ci, val) {
    if (fase !== 'jugando') return;
    const trimmed = val.length > 1 ? val.slice(-1) : val;
    if (trimmed !== '' && trimmed !== '-' && !/^-?\d$/.test(trimmed)) return;
    setValues(prev => { const next=[...prev]; next[ci]=trimmed; return next; });
    if (trimmed !== '' && trimmed !== '-' && eq && ci < eq.blanks.length - 1) {
      setTimeout(() => inputRefs.current[`${ci+1}`]?.focus(), 0);
    }
  }

  function handleKeyDown(e, ci) {
    if (fase !== 'jugando') return;
    if (e.key === 'Backspace' && values[ci] === '' && ci > 0) {
      setValues(prev => { const n=[...prev]; n[ci-1]=''; return n; });
      setTimeout(() => inputRefs.current[`${ci-1}`]?.focus(), 0);
    }
    if (e.key === 'Enter') { e.preventDefault(); handleVerify(); }
    if (e.key === 'Tab')   { e.preventDefault(); handleVerify(); }
  }

  function handleVerify() {
    if (fase !== 'jugando') return;
    if (values.some(v => v===''||v==='-')) return;
    if (!equationIsValid(parsed, values)) {
      showToast('Ecuación incorrecta matemáticamente', true);
      setRowAnim('shake');
      setTimeout(() => setRowAnim(''), 500);
      return;
    }
    // ── Calcular puntos igual que TimedMode ──
    const newCombo   = comboRef.current + 1;
    comboRef.current = newCombo;
    const comboMult  = Math.min(newCombo, 5);
    const basePoints = eq.points;
    const timeBonus  = Math.floor(timeRef.current * 2);
    const totalPoints = (basePoints + timeBonus) * comboMult;

    setCombo(newCombo);
    scoreRef.current += totalPoints;
    setScore(scoreRef.current);
    solvedRef.current += 1;
    setSolved(solvedRef.current);

    if (eq.difficulty === 'difícil') {
      timeRef.current = Math.min(timeRef.current + BONUS_TIME, GAME_DURATION);
      setTimeLeft(timeRef.current);
      setBonusAnim({ key: Date.now() });
      setTimeout(() => setBonusAnim(null), 1400);
    }

    setLastPoints({ pts: totalPoints, combo: comboMult, key: Date.now() });
    setTimeout(() => setLastPoints(null), 1200);

    loadNextEq(usedIdsRef.current);
  }

  function handleSkip() {
    if (fase !== 'jugando') return;
    comboRef.current = 0;
    setCombo(0);
    setSkipped(s => s+1);
    timeRef.current = Math.max(timeRef.current - 3, 1);
    setTimeLeft(timeRef.current);
    showToast('−3s', true);
    loadNextEq(usedIdsRef.current);
  }

  function rendirse() {
    const ca = codigoRef.current || codigoInput.trim().toUpperCase();
    socketRef.current?.emit('rendirse', { codigo: ca });
    clearInterval(gameTimerRef.current);
  }

  function reiniciar() {
    socketRef.current?.disconnect(); socketRef.current = null;
    clearInterval(countdownRef.current); clearInterval(gameTimerRef.current);
    setFase('lobby'); setCodigo(''); setCodigoInput(''); codigoRef.current = '';
    setJugadores([]); setResultado(null); setError('');
    setEq(null); setParsed([]); setValues([]);
    setScore(0); setSolved(0); setSkipped(0); setCombo(0);
    scoreRef.current=0; solvedRef.current=0; comboRef.current=0;
    timeRef.current=GAME_DURATION; setTimeLeft(GAME_DURATION);
    setUsedIds(new Set()); usedIdsRef.current=new Set();
    setCountdown(COUNTDOWN_TOTAL);
  }

  const rival        = jugadores.find(j => j !== username) || '???';
  const timerColor   = timeLeft <= 10 ? 'danger' : timeLeft <= 20 ? 'warning' : 'safe';
  const timerPct     = (timeLeft / GAME_DURATION) * 100;
  const circumference = 2 * Math.PI * 28;
  const cdCircumference = 2 * Math.PI * 28;
  const cdPct        = countdown / COUNTDOWN_TOTAL;
  const cdOffset     = cdCircumference * (1 - cdPct);

  // ── LOBBY ────────────────────────────────────────────────
  if (fase === 'lobby') return (
    <div className="timed-root timed-root--idle">
      <div className="timed-idle">
        <div className="timed-idle-icon">⚔️</div>
        <h1 className="timed-idle-title">Modo Duelo</h1>
        <p className="timed-idle-desc">
          60 segundos. Mismo sistema de puntos.<br />
          Las <strong>difíciles</strong> dan <strong>+{BONUS_TIME}s</strong> extra.<br />
          El que más puntos haga, <strong>gana</strong>.
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
          <button className="timed-start-btn" style={{ width:'auto', padding:'14px 24px' }} onClick={unirseADuelo}>Unirse</button>
        </div>
        <div className="timed-idle-hint">Tab = saltar ecuación (−3s)</div>
      </div>
    </div>
  );

  // ── ESPERANDO ────────────────────────────────────────────
  if (fase === 'esperando') return (
    <div className="timed-root timed-root--idle">
      {copiado && <div className="duel-copiado-popup">✓ Código copiado</div>}
      <div className="timed-idle">
        <div className="timed-idle-icon">⏳</div>
        <h1 className="timed-idle-title">Esperando rival...</h1>
        <div className="timed-best-wrap">
          <span className="timed-best-label">Código del duelo</span>
          <span className="timed-best-value" style={{ letterSpacing:'0.2em' }}>{codigo}</span>
        </div>
        <button className="timed-start-btn" onClick={() => {
          navigator.clipboard.writeText(codigo);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        }}>
          {copiado ? '✓ Código copiado' : 'Copiar código'}
        </button>
        <div className="timed-idle-hint">El duelo empieza en cuanto tu rival se una</div>
        <button className="timed-go-btn" style={{ border:'1px solid #2a3145', color:'#64748b', marginTop:8 }} onClick={reiniciar}>Cancelar</button>
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
        <div className="timed-clock-wrap" style={{ width:120, height:120 }}>
          <svg className="timed-clock-ring" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" className="ring-bg" />
            <circle cx="32" cy="32" r="28" className="ring-fg safe"
              strokeDasharray={cdCircumference}
              strokeDashoffset={cdOffset}
            />
          </svg>
          <span className="timed-clock-num" style={{ fontSize:36 }}>
            {countdown > 0 ? countdown : '¡Ya!'}
          </span>
        </div>
        <div className="timed-idle-hint">Prepárate...</div>
      </div>
    </div>
  );

  // ── ESPERANDO RESULTADO ───────────────────────────────────
  if (fase === 'esperando-resultado') return (
    <div className="timed-root timed-root--idle">
      <div className="timed-idle">
        <div className="timed-idle-icon">⏳</div>
        <h1 className="timed-idle-title">Calculando...</h1>
        <div className="timed-best-wrap">
          <span className="timed-best-label">Tu puntuación</span>
          <span className="timed-best-value">{score.toLocaleString()}</span>
        </div>
        <div className="timed-idle-hint">Esperando que tu rival termine...</div>
      </div>
    </div>
  );

  // ── JUGANDO ──────────────────────────────────────────────
  if (fase === 'jugando') return (
    <div className="timed-root duel-root--playing">
      <div className={`timed-toast${toast.show?' show':''}${toast.error?' error':''}`}>{toast.msg}</div>

      {/* VS strip — primera fila */}
      <div className="duel-vs-top">
        <span className="duel-vs-name duel-vs-you">{username}</span>
        <span className="duel-vs-label">VS</span>
        <span className="duel-vs-name duel-vs-rival">{rival}</span>
      </div>

      {/* Header: puntos | timer | rival */}
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
              strokeDasharray={`${circumference}`}
              strokeDashoffset={`${circumference * (1 - timerPct/100)}`}
            />
          </svg>
          <span className="timed-clock-num">{timeLeft}</span>
        </div>

        <div className="timed-combo-wrap">
          <span className="timed-combo-label">Combo</span>
          <span className={`timed-combo${combo >= 3 ? ' hot' : ''}`}>
            {combo > 1 ? `×${Math.min(combo,5)}` : '—'}
          </span>
        </div>
      </div>

      <div className="timed-bar-wrap">
        <div className={`timed-bar-fill ${timerColor}`} style={{ width:`${timerPct}%` }} />
      </div>

      <div className="timed-diff-row">
        <div className="timed-diff-badge">{eq?.difficulty} · {eq?.points} pts base</div>
        {eq?.difficulty === 'difícil' && <div className="timed-bonus-tag">⚡ +{BONUS_TIME}s</div>}
      </div>

      {eq && (
        <div className="timed-eq-template"
          dangerouslySetInnerHTML={{ __html: superscriptify(eq.eq.replace(/\?/g,'▢')) }}
        />
      )}

      <div className="timed-float-zone">
        {lastPoints && (
          <div className="timed-float-pts" key={lastPoints.key}>
            +{lastPoints.pts.toLocaleString()}
            {lastPoints.combo > 1 && <span className="timed-float-combo"> ×{lastPoints.combo}</span>}
          </div>
        )}
        {bonusAnim && <div className="timed-float-bonus" key={bonusAnim.key}>BONUS +{BONUS_TIME}s</div>}
      </div>

      <div className={`timed-row ${rowAnim}`}>
        {parsed.map((token, ti) => {
          if (token.type === 'frag') return (
            <span key={ti} className="timed-frag"
              dangerouslySetInnerHTML={{ __html: superscriptify(token.text) }} />
          );
          const ci = token.index;
          return (
            <div key={ti} className="timed-cell">
              <input
                ref={el => { inputRefs.current[`${ci}`] = el; }}
                type="number"
                value={values[ci] ?? ''}
                onChange={e => handleInput(ci, e.target.value)}
                onKeyDown={e => handleKeyDown(e, ci)}
                tabIndex={ci+1}
                autoFocus={ci===0}
              />
            </div>
          );
        })}
      </div>

      <div className="timed-actions">
        <button className="timed-btn-verify" disabled={values.some(v=>v===''||v==='-')} onClick={handleVerify}>
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

      <button
        className="timed-btn-skip"
        style={{ marginTop:16, color:'var(--red)', borderColor:'var(--red)', padding:'10px 32px' }}
        onClick={rendirse}
      >
        ⚑ Rendirse
      </button>
    </div>
  );

  // ── RESULTADO ────────────────────────────────────────────
  if (fase === 'resultado') {
    const gane   = resultado?.ganador === username;
    const empate = resultado?.empate;
    const myScore = resultado?.scores?.[username] ?? score;
    const rvScore = resultado?.scores?.[rival] ?? 0;
    const mySolved = resultado?.solved?.[username] ?? solved;
    const rvSolved = resultado?.solved?.[rival] ?? 0;

    return (
      <div className="timed-root timed-root--idle">
        <div className="timed-gameover">
          <div className="timed-go-bg" />
          <div className="timed-go-content">
            <div className="timed-go-label" style={{ color: empate ? 'var(--yellow)' : gane ? 'var(--green)' : 'var(--red)' }}>
              {empate ? 'E M P A T E' : gane ? '¡ V I C T O R I A !' : 'D E R R O T A'}
            </div>
            <div className="timed-go-score">{myScore.toLocaleString()}</div>
            <div className="timed-go-pts-label">tus puntos</div>

            {resultado?.desconectado && <div className="timed-go-newbest" style={{ color:'var(--red)' }}>El rival se desconectó</div>}
            {resultado?.rendido      && <div className="timed-go-newbest" style={{ color:'var(--yellow)' }}>{resultado.perdedor} se rindió</div>}

            <div className="timed-go-stats">
              <div className="timed-go-stat">
                <span className="timed-go-stat-val">{mySolved}</span>
                <span className="timed-go-stat-lbl">tus resueltas</span>
              </div>
              <div className="timed-go-stat">
                <span className="timed-go-stat-val">{rvScore.toLocaleString()}</span>
                <span className="timed-go-stat-lbl">pts rival</span>
              </div>
              <div className="timed-go-stat">
                <span className="timed-go-stat-val">{rvSolved}</span>
                <span className="timed-go-stat-lbl">resueltas rival</span>
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
