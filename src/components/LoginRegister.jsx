'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { login, register, googleAuth, googleComplete, saveToken, saveUser, flushPendingScore } from "../services/api";
import "./LoginRegister.css";

export default function LoginRegister() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const googleBtnRef = useRef(null);
  const [googleStep, setGoogleStep] = useState(null);
  const [googleUsername, setGoogleUsername] = useState("");

  const isLogin = mode === "login";

  useEffect(() => {
    if (!window.google || !googleBtnRef.current) return;

    function handleGoogleResponse(response) {
      setLoading(true);
      setError("");
      setSuccess("");
      googleAuth(response.credential)
        .then(res => {
          if (res.data.needsUsername) {
            setGoogleStep({ credential: response.credential, email: res.data.email });
            setLoading(false);
          } else {
            saveToken(res.data.token);
            saveUser(res.data.user);
            setSuccess(`¡Bienvenido, ${res.data.user.username}!`);
            flushPendingScore();
            setTimeout(() => { window.location.href = "/"; }, 1000);
          }
        })
        .catch(err => {
          setError(err.response?.data?.error || "Error con Google. Inténtalo de nuevo.");
          setLoading(false);
        });
    }

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });

    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "outline",
      size: "large",
      width: googleBtnRef.current.offsetWidth || 296,
      text: "continue_with",
      locale: "es",
    });
  }, [router]);

  async function handleGoogleComplete(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await googleComplete(googleStep.credential, googleUsername);
      saveToken(res.data.token);
      saveUser(res.data.user);
      setSuccess(`¡Bienvenido, ${res.data.user.username}!`);
      await flushPendingScore();
      setTimeout(() => { window.location.href = "/"; }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || "Error al crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  function switchMode(newMode) {
    setMode(newMode);
    setError("");
    setSuccess("");
    setForm({ username: "", email: "", password: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      let res;
      if (isLogin) {
        res = await login(form.email, form.password);
      } else {
        res = await register(form.username, form.email, form.password);
      }
      saveToken(res.data.token);
      saveUser(res.data.user);
      setSuccess(isLogin ? `¡Bienvenido, ${res.data.user.username}!` : "¡Cuenta creada con éxito!");
      await flushPendingScore();
      setTimeout(() => { window.location.href = "/"; }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || "Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (googleStep) {
    return (
      <div className="auth-root">
        <div className="auth-card">
          <div className="auth-logo">
            <span className="auth-logo-main">Mathle</span>
          </div>
          <div className="auth-google-welcome">
            <p className="auth-google-welcome-text">Cuenta de Google verificada.<br />Elige tu nombre de usuario.</p>
            <p className="auth-google-email">{googleStep.email}</p>
          </div>
          <form className="auth-form" onSubmit={handleGoogleComplete}>
            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label">Usuario</label>
                <span className={`auth-char-count${googleUsername.length >= 10 ? " auth-char-count--max" : ""}`}>
                  {googleUsername.length}/10
                </span>
              </div>
              <input className="auth-input" type="text" value={googleUsername}
                onChange={e => { setGoogleUsername(e.target.value); setError(""); }}
                placeholder="leibniz" maxLength={10} autoFocus required />
            </div>
            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}
            <button type="submit" className={`auth-submit${loading ? " loading" : ""}`} disabled={loading}>
              {loading ? "..." : "Continuar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-root">
      <div className="auth-card">

        <div className="auth-logo">
          <span className="auth-logo-main">Mathle</span>
        </div>

        <div className="auth-toggle">
          <button className={`auth-toggle-btn${isLogin ? " active" : ""}`} onClick={() => switchMode("login")}>
            Entrar
          </button>
          <button className={`auth-toggle-btn${!isLogin ? " active" : ""}`} onClick={() => switchMode("register")}>
            Registrarse
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>

          {isLogin && (
            <div className="auth-field">
              <label className="auth-label">Usuario / Correo</label>
              <input className="auth-input" type="text" name="email" value={form.email}
                onChange={handleChange} placeholder="leibniz / leibniz@euler.com"
                autoComplete="username" required />
            </div>
          )}

          {!isLogin && (
            <>
              <div className="auth-field">
                <div className="auth-label-row">
                  <label className="auth-label">Usuario</label>
                  <span className={`auth-char-count${form.username.length >= 10 ? " auth-char-count--max" : ""}`}>
                    {form.username.length}/10
                  </span>
                </div>
                <input className="auth-input" type="text" name="username" value={form.username}
                  onChange={handleChange} placeholder="leibniz"
                  autoComplete="username" maxLength={10} required />
              </div>
              <div className="auth-field">
                <label className="auth-label">Correo</label>
                <input className="auth-input" type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="leibniz@euler.com"
                  autoComplete="email" required />
              </div>
            </>
          )}

          <div className="auth-field">
            <label className="auth-label">Contraseña</label>
            <input className="auth-input" type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="••••••••"
              autoComplete={isLogin ? "current-password" : "new-password"} required />
          </div>

          {isLogin && (
            <div className="auth-forgot">
              <button type="button" className="auth-forgot-btn">¿Olvidaste tu contraseña?</button>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <button type="submit" className={`auth-submit${loading ? " loading" : ""}`} disabled={loading}>
            {loading ? "..." : isLogin ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <div className="auth-divider"><span>o continúa con</span></div>

        <div ref={googleBtnRef} style={{ display: "flex", justifyContent: "center" }} />

      </div>
    </div>
  );
}
