'use client';

import Link from "next/link";
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">

        <div className="footer-brand">
          <span className="footer-logo">Mathle</span>
          <p className="footer-tagline">El juego de matemáticas diario</p>
        </div>

        <div className="footer-bottom">
          <span className="footer-copy">© {year} Mathle. Todos los derechos reservados.</span>
          <span className="footer-sep">·</span>
          <a href="mailto:contact@mathle.online" className="footer-link footer-link--small">Contacto</a>
          <span className="footer-sep">·</span>
          <Link href="/privacidad" className="footer-link footer-link--small">Política de privacidad</Link>
        </div>

      </div>
    </footer>
  );
}
