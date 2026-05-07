'use client';
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { isLoggedIn, getUser } from '../services/api';
import './DuelMode.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function DuelMode() {
  const [fase, setFase] = useState('lobby'); // lobby | esperando | jugando | resultado
  const [modo, setModo] = useState(null);    // 'crear' | 'unirse'
  const [codigo, setCodigo] = useState('');
  const [codigoInput, setCodigoInput] = useState('');
  const [problema, setProblema] = useState(null);
  const [jugadores, setJugadores] = useState([]);
  const [respuesta, setRespuesta] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [intentoIncorrecto, setIntentoIncorrecto] = useState(false);

  const socketRef = useRef(null);
  const user = getUser();

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
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

    socket.on('duelo-iniciado', ({ problem, players }) => {
      setProblema(problem);
      setJugadores(players);
      setFase('jugando');
      setError('');
    });

    socket.on('respuesta-incorrecta', () => {
      setIntentoIncorrecto(true);
      setTimeout(() => setIntentoIncorrecto(false), 600);
    });

    socket.on('duelo-terminado', (data) => {
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
    socketRef.current.emit('crear-duelo', { username: user.username });
    setModo('crear');
  }

  function unirseADuelo() {
    if (!isLoggedIn()) { setError('Debes iniciar sesión para jugar duelos'); return; }
    if (!codigoInput.trim()) { setError('Introduce el código del duelo'); return; }
    conectar();
    socketRef.current.emit('unirse-duelo', { codigo: codigoInput.trim().toUpperCase(), username: user.username });
    setModo('unirse');
  }

  function enviarRespuesta() {
    if (!respuesta.trim()) return;
    socketRef.current.emit('respuesta-duelo', {
      codigo: codigo || codigoInput.trim().toUpperCase(),
      respuesta: [respuesta.trim()],
    });
    setRespuesta('');
  }

  function rendirse() {
    socketRef.current.emit('rendirse', { codigo: codigo || codigoInput.trim().toUpperCase() });
  }

  function reiniciar() {
    if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
    setFase('lobby');
    setModo(null);
    setCodigo('');
    setCodigoInput('');
    setProblema(null);
    setJugadores([]);
    setRespuesta('');
    setResultado(null);
    setError('');
  }

  const username = user?.username || 'tú';
  const codigoActivo = codigo || codigoInput.trim().toUpperCase();

  // ── LOBBY ──────────────────────────────────────────────
  if (fase === 'lobby') return (
    <div className="duel-container">
      <h1 className="duel-title">⚔️ Duelos</h1>
      <p className="duel-subtitle">Reta a un amigo en tiempo real</p>

      {error && <div className="duel-error">{error}</div>}

      <div className="duel-lobby-buttons">
        <button className="duel-btn-primary" onClick={crearDuelo}>
          + Crear duelo
        </button>
        <div className="duel-divider">o</div>
        <div className="duel-join-row">
          <input
            className="duel-input"
            placeholder="Código del duelo"
            value={codigoInput}
            onChange={e => setCodigoInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && unirseADuelo()}
            maxLength={5}
          />
          <button className="duel-btn-secondary" onClick={unirseADuelo}>
            Unirse
          </button>
        </div>
      </div>

      <div className="duel-info">
        <p>📋 Crea un duelo y comparte el código con tu rival.</p>
        <p>⚡ El primero en resolver la ecuación correctamente gana.</p>
      </div>
    </div>
  );

  // ── ESPERANDO ──────────────────────────────────────────
  if (fase === 'esperando') return (
    <div className="duel-container">
      <h1 className="duel-title">⏳ Esperando rival...</h1>
      <p className="duel-subtitle">Comparte este código con tu amigo</p>

      <div className="duel-codigo-display">
        <span className="duel-codigo-text">{codigo}</span>
        <button
          className="duel-btn-copy"
          onClick={() => navigator.clipboard.writeText(codigo)}
        >
          Copiar
        </button>
      </div>

      <p className="duel-hint">En cuanto tu rival introduzca el código, el duelo comenzará automáticamente.</p>
      <button className="duel-btn-ghost" onClick={reiniciar}>Cancelar</button>
    </div>
  );

  // ── JUGANDO ────────────────────────────────────────────
  if (fase === 'jugando') return (
    <div className="duel-container">
      <div className="duel-players">
        <span className="duel-player duel-player-you">{username}</span>
        <span className="duel-vs">VS</span>
        <span className="duel-player duel-player-rival">
          {jugadores.find(j => j !== username) || '???'}
        </span>
      </div>

      <div className="duel-problem">
        <p className="duel-ecuacion">{problema?.ecuacion}</p>
      </div>

      <div className={`duel-answer-row ${intentoIncorrecto ? 'duel-shake' : ''}`}>
        <input
          className="duel-answer-input"
          type="number"
          placeholder="Tu respuesta"
          value={respuesta}
          onChange={e => setRespuesta(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviarRespuesta()}
          autoFocus
        />
        <button className="duel-btn-primary" onClick={enviarRespuesta}>
          ✓ Enviar
        </button>
      </div>

      <button className="duel-btn-ghost duel-rendirse" onClick={rendirse}>
        Rendirse
      </button>
    </div>
  );

  // ── RESULTADO ──────────────────────────────────────────
  if (fase === 'resultado') {
    const gane = resultado?.ganador === username;
    return (
      <div className="duel-container">
        <div className={`duel-resultado ${gane ? 'duel-win' : 'duel-lose'}`}>
          <span className="duel-resultado-emoji">{gane ? '🏆' : '💀'}</span>
          <h2 className="duel-resultado-titulo">
            {gane ? '¡Victoria!' : 'Derrota'}
          </h2>
          <p className="duel-resultado-sub">
            {resultado?.desconectado
              ? `${resultado.perdedor} se desconectó`
              : resultado?.rendido
              ? `${resultado.perdedor} se rindió`
              : `${resultado.ganador} resolvió primero`}
          </p>
        </div>

        <div className="duel-resultado-problem">
          <p className="duel-resultado-label">Ecuación:</p>
          <p className="duel-resultado-ecuacion">{problema?.ecuacion}</p>
          <p className="duel-resultado-label">Respuesta correcta:</p>
          <p className="duel-resultado-answer">{problema?.respuestas?.join(', ')}</p>
        </div>

        <button className="duel-btn-primary" onClick={reiniciar}>
          Nuevo duelo
        </button>
      </div>
    );
  }
}
