'use client';

import "./PrivacyPolicy.css";

export default function PrivacyPolicy() {
  return (
    <div className="pp-root">
      <div className="pp-container">
        <div className="pp-header">
          <span className="pp-logo">Mathle</span>
          <h1 className="pp-title">Política de Privacidad</h1>
          <p className="pp-date">Última actualización: mayo 2025</p>
        </div>

        <div className="pp-body">

          <section className="pp-section">
            <h2>1. Responsable</h2>
            <p>
              Mathle (<strong>mathle.online</strong>) es un juego de matemáticas diario desarrollado de forma independiente.
              Para cualquier consulta sobre privacidad, puedes contactar en:{" "}
              <a href="mailto:privacy@mathle.online">privacy@mathle.online</a>.
            </p>
          </section>

          <section className="pp-section">
            <h2>2. Datos que recopilamos</h2>
            <p>Recopilamos únicamente los datos necesarios para el funcionamiento del juego:</p>
            <ul>
              <li><strong>Registro con email:</strong> nombre de usuario, dirección de email y contraseña (almacenada de forma cifrada).</li>
              <li><strong>Registro con Google:</strong> nombre y dirección de email proporcionados por tu cuenta de Google.</li>
              <li><strong>Datos de juego:</strong> puntuaciones, racha de días y resultados de partidas.</li>
            </ul>
          </section>

          <section className="pp-section">
            <h2>3. Finalidad del tratamiento</h2>
            <p>Usamos tus datos exclusivamente para:</p>
            <ul>
              <li>Gestionar tu cuenta y autenticación.</li>
              <li>Mostrar tu posición en el ranking y tu historial de partidas.</li>
              <li>Mantener tu racha de juego diaria.</li>
            </ul>
            <p>No utilizamos tus datos para publicidad, perfilado ni los cedemos a terceros.</p>
          </section>

          <section className="pp-section">
            <h2>4. Google OAuth</h2>
            <p>
              Si inicias sesión con Google, utilizamos Google Identity Services para verificar tu identidad.
              Solo accedemos a tu nombre y email. No accedemos a tu contraseña de Google ni a ningún otro
              dato de tu cuenta. Puedes consultar la política de privacidad de Google en{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                policies.google.com/privacy
              </a>.
            </p>
          </section>

          <section className="pp-section">
            <h2>5. Almacenamiento y seguridad</h2>
            <p>
              Tus datos se almacenan en servidores seguros. Las contraseñas se guardan cifradas con bcrypt
              y nunca en texto plano. La comunicación con el servidor se realiza siempre mediante HTTPS.
            </p>
          </section>

          <section className="pp-section">
            <h2>6. Tus derechos</h2>
            <p>Tienes derecho a:</p>
            <ul>
              <li>Acceder a los datos que tenemos sobre ti.</li>
              <li>Rectificar datos incorrectos.</li>
              <li>Eliminar tu cuenta y todos tus datos desde tu perfil o contactándonos.</li>
            </ul>
          </section>

          <section className="pp-section">
            <h2>7. Cookies</h2>
            <p>
              Mathle no utiliza cookies de seguimiento ni publicidad. Únicamente almacenamos en tu
              navegador el token de sesión necesario para mantenerte conectado (localStorage).
            </p>
          </section>

          <section className="pp-section">
            <h2>8. Cambios en esta política</h2>
            <p>
              Si realizamos cambios relevantes en esta política, lo notificaremos actualizando la fecha
              en la parte superior de esta página.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
