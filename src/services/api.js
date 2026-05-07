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

export const getDailyLeaderboard = (filter = 'hoy') =>
  api.get(`/api/daily/leaderboard?filter=${filter}`);

// ── TIMED ──────────────────────────────────────────────────────────
export const saveTimedScore = (points) =>
  api.post('/api/timed/score', { points });

export const getTimedLeaderboard = () =>
  api.get('/api/timed/leaderboard');

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
// api google login ----------------------------
export const googleAuth = (credential) =>
  api.post('/api/auth/google', { credential });
export default api;
