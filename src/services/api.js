import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── INTERCEPTOR — añade JWT automáticamente si existe ──────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('mathle_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── AUTH ───────────────────────────────────────────────────────────
export const register = (username, email, password) =>
  api.post('/api/auth/register', { username, email, password });

export const login = (email, password) =>
  api.post('/api/auth/login', { email, password });

export const getMe = () =>
  api.get('/api/auth/profile');

export const getPublicProfile = (username) =>
  api.get(`/api/auth/profile/public/${username}`);

export const deleteAccount = () =>
  api.delete('/api/auth/delete');

// ── DAILY ──────────────────────────────────────────────────────────
export const saveDailyScore = (date, attempts, points, won) =>
  api.post('/api/daily/score', { date, attempts, points, won });

// ── TIMED ──────────────────────────────────────────────────────────
export const saveTimedScore = (points) =>
  api.post('/api/timed/score', { points });

// ── LEADERBOARD UNIFICADO ──────────────────────────────────────────
// modo: 'diario' | 'contrarreloj' | 'ambos'
// filter: 'hoy' | 'semana' | 'alltime'
export const getDailyLeaderboard = (filter = 'hoy', modo = 'ambos') => {
  if (modo === 'diario')       return api.get(`/api/daily/leaderboard?filter=${filter}`);
  if (modo === 'contrarreloj') return api.get(`/api/timed/leaderboard?filter=${filter}`);
  // 'ambos' — llama a los dos y los fusiona en el cliente
  return Promise.all([
    api.get(`/api/daily/leaderboard?filter=${filter}`),
    api.get(`/api/timed/leaderboard?filter=${filter}`),
  ]).then(([daily, timed]) => {
    // Fusionar por username, sumando puntos
    const map = {};
    for (const row of [...daily.data, ...timed.data]) {
      if (!map[row.username]) map[row.username] = { username: row.username, pts: 0, racha: row.racha };
      map[row.username].pts += row.pts;
      map[row.username].racha = Math.max(map[row.username].racha, row.racha);
    }
    const merged = Object.values(map).sort((a, b) => b.pts - a.pts).slice(0, 10);
    // Devolver en el mismo formato que axios para que Leaderboard.jsx no cambie
    return { data: merged };
  });
};

export const getTimedLeaderboard = (filter = 'alltime') =>
  api.get(`/api/timed/leaderboard?filter=${filter}`);

// ── HELPERS ────────────────────────────────────────────────────────
export const saveToken   = (token) => localStorage.setItem('mathle_token', token);
export const getToken    = ()      => localStorage.getItem('mathle_token');
export const removeToken = ()      => localStorage.removeItem('mathle_token');
export const isLoggedIn  = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('mathle_token');
};
export const saveUser  = (user) => localStorage.setItem('mathle_user', JSON.stringify(user));
export const getUser = () => {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('mathle_user')); }
  catch { return null; }
};
export const removeUser = () => localStorage.removeItem('mathle_user');
export const logout     = () => {
  removeToken();
  removeUser();
  window.dispatchEvent(new Event('mathle_auth_change'));
};
export const googleComplete = (credential, username) =>
  api.post('/api/auth/google/complete', { credential, username });
export const googleAuth = (credential) =>
  api.post('/api/auth/google', { credential });

export default api;
