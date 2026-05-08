'use client';

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { isLoggedIn, getUser, logout } from "../services/api";
import "./Header.css";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [user, setUser] = useState(getUser());
  const userMenuRef = useRef(null);
  const menuRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function syncAuth() {
      setLoggedIn(isLoggedIn());
      setUser(getUser());
    }
    window.addEventListener('storage', syncAuth);
    window.addEventListener('mathle_auth_change', syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('mathle_auth_change', syncAuth);
    };
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  function handleLogout() {
    logout();
    setLoggedIn(false);
    setUser(null);
    setUserMenuOpen(false);
    setMenuOpen(false);
    router.push("/");
  }

  function getInitial() {
    return user?.username?.[0]?.toUpperCase() || "?";
  }

  if (pathname === "/") return null;

  const NAV_LINKS = [
    { to: "/diario",      icon: "📅", label: "Diario" },
    { to: "/contrareloj", icon: "⚡", label: "Contrareloj" },
    { to: "/duelo",       icon: "⚔️", label: "Duelo" },
    { to: "/leaderboard", icon: "🏆", label: "Ranking" },
    { to: "/como-jugar",  icon: "❓", label: "Cómo jugar" },
  ];

  return (
    <header className="header" ref={menuRef}>
      {/* ── DESKTOP ─────────────────────────────────────── */}
      <div className="header-desktop">
        {/* IZQUIERDA — modos */}
        <nav className="header-nav-left">
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              href={link.to}
              className={`header-link${pathname === link.to ? " active" : ""}`}
            >
              <span className="header-link-icon">{link.icon}</span>
              <span className="header-link-label">{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* CENTRO — logo */}
        <Link href="/" className="header-logo">
          <span className="header-logo-main">Mathle</span>
        </Link>

        {/* DERECHA — avatar/login */}
        <div className="header-right">
          {loggedIn ? (
            <div className="header-user" ref={userMenuRef}>
              <button className="header-avatar" onClick={() => setUserMenuOpen(o => !o)}>
                {getInitial()}
              </button>
              {userMenuOpen && (
                <div className="header-user-menu">
                  <div className="header-user-info">
                    <span className="header-user-name">{user?.username}</span>
                    <span className="header-user-email">{user?.email}</span>
                  </div>
                  <div className="header-menu-divider" />
                  <button className="header-menu-item" onClick={() => { setUserMenuOpen(false); router.push("/perfil"); }}>
                    👤 Mi perfil
                  </button>
                  <button className="header-menu-item" onClick={handleLogout}>
                    ↩ Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="header-login-btn">
              Entrar
            </Link>
          )}
        </div>
      </div>

      {/* ── MÓVIL ───────────────────────────────────────── */}
      <div className="header-mobile">
        <Link href="/" className="header-logo">
          <span className="header-logo-main">Mathle</span>
        </Link>

        <div className="header-mobile-right">
          {loggedIn && (
            <button className="header-avatar header-avatar--sm" onClick={() => router.push("/perfil")}>
              {getInitial()}
            </button>
          )}
          <button
            className={`header-hamburger${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menú"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* ── MENÚ MÓVIL — superpuesto ────────────────────── */}
      <div className={`header-mobile-menu${menuOpen ? " open" : ""}`}>
        <div className="header-mobile-menu-inner">
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              href={link.to}
              className={`header-mobile-link${pathname === link.to ? " active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="header-mobile-link-icon">{link.icon}</span>
              <span className="header-mobile-link-label">{link.label}</span>
            </Link>
          ))}
          <div className="header-mobile-divider" />
          {loggedIn ? (
            <button className="header-mobile-link header-mobile-logout" onClick={handleLogout}>
              <span className="header-mobile-link-icon">↩</span>
              <span className="header-mobile-link-label">Cerrar sesión</span>
            </button>
          ) : (
            <Link href="/login" className="header-mobile-link" onClick={() => setMenuOpen(false)}>
              <span className="header-mobile-link-icon">👤</span>
              <span className="header-mobile-link-label">Iniciar sesión</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
