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

          {/* 1 */}
          <section className="pp-section">
            <h2>1. Responsable del tratamiento</h2>
            <p>
              <strong>Mathle</strong> (<strong>mathle.online</strong>) es un juego de matemáticas diario
              desarrollado de forma independiente. El responsable del tratamiento de los datos personales
              recogidos a través de este sitio web es el titular del proyecto.
            </p>
            <p>
              Para cualquier consulta relacionada con la privacidad o el tratamiento de tus datos,
              puedes ponerte en contacto en:{" "}
              <a href="mailto:privacy@mathle.online">privacy@mathle.online</a>.
            </p>
          </section>

          {/* 2 */}
          <section className="pp-section">
            <h2>2. Datos que recopilamos</h2>
            <p>
              Recopilamos distintos tipos de información en función de cómo interactúas con Mathle:
            </p>

            <p><strong>Datos que tú nos proporcionas directamente:</strong></p>
            <ul>
              <li>
                <strong>Registro con email:</strong> nombre de usuario, dirección de correo electrónico
                y contraseña (almacenada de forma cifrada mediante bcrypt; nunca en texto plano).
              </li>
              <li>
                <strong>Registro con Google:</strong> nombre y dirección de email proporcionados por
                tu cuenta de Google a través de Google Identity Services.
              </li>
              <li>
                <strong>Comunicaciones:</strong> si nos contactas por email, conservamos el contenido
                de dicha comunicación para atender tu solicitud.
              </li>
            </ul>

            <p><strong>Datos generados por el uso del juego:</strong></p>
            <ul>
              <li>Puntuaciones, racha de días consecutivos y resultados de partidas.</li>
              <li>Historial de intentos y estadísticas de juego por usuario.</li>
              <li>Fecha y hora de última conexión.</li>
            </ul>

            <p><strong>Datos técnicos y de navegación (recopilados automáticamente):</strong></p>
            <ul>
              <li>Dirección IP.</li>
              <li>Tipo y versión de navegador.</li>
              <li>Sistema operativo y tipo de dispositivo.</li>
              <li>Páginas visitadas, tiempo de permanencia y acciones dentro del sitio.</li>
              <li>URL de referencia (página desde la que llegaste a Mathle).</li>
              <li>
                Identificadores de cookies y tecnologías de seguimiento similares utilizadas por
                Google AdSense y Google Analytics (véase la sección 6).
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section className="pp-section">
            <h2>3. Finalidad del tratamiento</h2>
            <p>Tratamos tus datos con las siguientes finalidades:</p>
            <ul>
              <li>
                <strong>Gestión de cuenta:</strong> crear y mantener tu cuenta de usuario,
                gestionar la autenticación y la seguridad del acceso.
              </li>
              <li>
                <strong>Funcionamiento del juego:</strong> mostrar tu posición en el ranking global,
                mantener tu racha de juego diaria y guardar tu historial de partidas.
              </li>
              <li>
                <strong>Mejora del servicio:</strong> analizar patrones de uso de forma agregada para
                detectar errores, mejorar la experiencia y desarrollar nuevas funcionalidades.
              </li>
              <li>
                <strong>Publicidad personalizada:</strong> mostrar anuncios relevantes a través de
                Google AdSense. Google puede utilizar cookies y tecnologías similares para personalizar
                los anuncios en función de tus visitas previas a Mathle y a otros sitios web
                (véase la sección 6).
              </li>
              <li>
                <strong>Cumplimiento legal:</strong> atender solicitudes de ejercicio de derechos,
                resolver reclamaciones y cumplir con las obligaciones legales aplicables.
              </li>
            </ul>
          </section>

          {/* 4 */}
          <section className="pp-section">
            <h2>4. Base legal del tratamiento</h2>
            <p>
              El tratamiento de tus datos se basa en las siguientes legitimaciones, de acuerdo con
              el Reglamento General de Protección de Datos (RGPD):
            </p>
            <ul>
              <li>
                <strong>Ejecución de un contrato:</strong> el tratamiento de los datos de tu cuenta
                y de juego es necesario para prestarte el servicio que has solicitado al registrarte.
              </li>
              <li>
                <strong>Interés legítimo:</strong> el análisis técnico del servicio y la detección de
                fraudes o abusos se realizan bajo nuestro interés legítimo de garantizar la seguridad
                y el correcto funcionamiento de Mathle.
              </li>
              <li>
                <strong>Consentimiento:</strong> el uso de cookies publicitarias y de seguimiento por
                parte de Google AdSense y Google Analytics requiere tu consentimiento previo, que se
                solicita mediante el aviso de cookies al acceder al sitio por primera vez. Puedes
                revocar este consentimiento en cualquier momento desde la configuración de cookies.
              </li>
              <li>
                <strong>Obligación legal:</strong> en determinados casos, el tratamiento puede ser
                necesario para cumplir con una obligación legal aplicable.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section className="pp-section">
            <h2>5. Google OAuth</h2>
            <p>
              Si decides iniciar sesión con tu cuenta de Google, utilizamos{" "}
              <strong>Google Identity Services</strong> para verificar tu identidad de forma segura.
              En este proceso, únicamente accedemos a tu nombre y dirección de email asociados a tu
              cuenta de Google. No accedemos a tu contraseña de Google, a tus contactos, a tu Drive,
              ni a ningún otro dato o servicio de tu cuenta.
            </p>
            <p>
              El uso de Google Identity Services está sujeto a la{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                Política de Privacidad de Google
              </a>{" "}
              y a sus{" "}
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
                Condiciones del Servicio
              </a>.
            </p>
          </section>

          {/* 6 */}
          <section className="pp-section">
            <h2>6. Cookies y publicidad (Google AdSense)</h2>
            <p>
              Mathle utiliza <strong>Google AdSense</strong> para mostrar anuncios. Google AdSense
              emplea cookies, balizas web y tecnologías similares para recopilar datos sobre tu
              comportamiento de navegación, tanto en Mathle como en otros sitios de la red de Google,
              con el fin de mostrarte anuncios personalizados.
            </p>
            <p>
              Entre la información que Google puede recopilar a través de estas tecnologías se incluye:
            </p>
            <ul>
              <li>Tu dirección IP y ubicación aproximada.</li>
              <li>Las páginas que visitas y el tiempo que pasas en ellas.</li>
              <li>Tus interacciones con los anuncios (visualizaciones, clics).</li>
              <li>Identificadores de dispositivo y de cookie.</li>
            </ul>
            <p>
              Estos datos son tratados por Google LLC bajo su propia política de privacidad. Puedes
              consultar cómo utiliza Google los datos cuando usas sitios o aplicaciones de sus socios
              en{" "}
              <a
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
              >
                policies.google.com/technologies/partner-sites
              </a>.
            </p>
            <p>
              Además de AdSense, utilizamos <strong>Google Analytics</strong> para obtener estadísticas
              de uso del sitio de forma agregada (número de visitantes, páginas más vistas, origen del
              tráfico, etc.). Google Analytics también utiliza cookies propias.
            </p>

            <p><strong>Tipos de cookies utilizadas en Mathle:</strong></p>
            <ul>
              <li>
                <strong>Cookies estrictamente necesarias:</strong> almacenamos en{" "}
                <code>localStorage</code> el token de sesión necesario para mantenerte conectado.
                No requieren consentimiento.
              </li>
              <li>
                <strong>Cookies de análisis (Google Analytics):</strong> recopilan datos de uso
                anónimos y agregados. Requieren consentimiento.
              </li>
              <li>
                <strong>Cookies publicitarias (Google AdSense):</strong> permiten a Google mostrar
                anuncios personalizados en función de tu historial de navegación. Requieren
                consentimiento.
              </li>
            </ul>

            <p>
              Puedes gestionar tus preferencias de cookies en cualquier momento desde el banner de
              cookies del sitio, desde la configuración de tu navegador, o desactivando la
              publicidad personalizada de Google en{" "}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                adssettings.google.com
              </a>.
            </p>
          </section>

          {/* 7 */}
          <section className="pp-section">
            <h2>7. Transferencias internacionales de datos</h2>
            <p>
              Google LLC tiene su sede en Estados Unidos. El uso de servicios de Google (AdSense,
              Analytics, Identity Services) implica una transferencia de datos fuera del Espacio
              Económico Europeo (EEE). Dichas transferencias se realizan bajo las garantías
              adecuadas establecidas por la Comisión Europea, incluyendo las Cláusulas Contractuales
              Tipo y, cuando sea aplicable, el marco EU-EE. UU. Data Privacy Framework.
            </p>
            <p>
              Puedes consultar más información sobre las transferencias de datos de Google en{" "}
              <a href="https://privacy.google.com/businesses/gdprcontrollerterms/" target="_blank" rel="noopener noreferrer">
                privacy.google.com/businesses/gdprcontrollerterms
              </a>.
            </p>
          </section>

          {/* 8 */}
          <section className="pp-section">
            <h2>8. Almacenamiento y seguridad</h2>
            <p>
              Tus datos se almacenan en servidores seguros. Aplicamos medidas técnicas y organizativas
              adecuadas para proteger tus datos frente a accesos no autorizados, pérdida, alteración
              o divulgación accidental, entre ellas:
            </p>
            <ul>
              <li>Cifrado de contraseñas con <strong>bcrypt</strong> (nunca en texto plano).</li>
              <li>Comunicaciones cifradas mediante <strong>HTTPS/TLS</strong> en todo el sitio.</li>
              <li>Acceso restringido a los datos únicamente al personal autorizado.</li>
              <li>Revisión periódica de los sistemas de seguridad.</li>
            </ul>
            <p>
              A pesar de estas medidas, ningún sistema de transmisión de datos por internet es
              completamente seguro. En caso de producirse una brecha de seguridad que afecte a tus
              datos, te notificaremos de acuerdo con lo establecido en la normativa aplicable.
            </p>
          </section>

          {/* 9 */}
          <section className="pp-section">
            <h2>9. Conservación de los datos</h2>
            <p>
              Conservamos tus datos personales durante el tiempo necesario para cumplir con las
              finalidades descritas en esta política:
            </p>
            <ul>
              <li>
                <strong>Datos de cuenta y juego:</strong> mientras mantengas tu cuenta activa en
                Mathle. Si eliminas tu cuenta, procederemos a borrar tus datos en un plazo máximo
                de 30 días, salvo que exista una obligación legal de conservarlos.
              </li>
              <li>
                <strong>Datos de navegación (Analytics):</strong> Google Analytics conserva los
                datos de uso durante un período de 14 meses por defecto.
              </li>
              <li>
                <strong>Cookies publicitarias:</strong> la duración varía según la cookie específica
                de Google AdSense; la mayoría tienen una vigencia de entre 30 días y 2 años.
              </li>
            </ul>
          </section>

          {/* 10 */}
          <section className="pp-section">
            <h2>10. Tus derechos</h2>
            <p>
              De acuerdo con el RGPD y la normativa española de protección de datos, tienes los
              siguientes derechos sobre tus datos personales:
            </p>
            <ul>
              <li>
                <strong>Acceso:</strong> obtener confirmación de si tratamos tus datos y, en su
                caso, acceder a ellos.
              </li>
              <li>
                <strong>Rectificación:</strong> solicitar la corrección de datos inexactos o
                incompletos.
              </li>
              <li>
                <strong>Supresión («derecho al olvido»):</strong> solicitar la eliminación de tus
                datos cuando, entre otros motivos, ya no sean necesarios para la finalidad para la
                que fueron recogidos.
              </li>
              <li>
                <strong>Limitación del tratamiento:</strong> solicitar que suspendamos el
                tratamiento de tus datos en determinadas circunstancias.
              </li>
              <li>
                <strong>Portabilidad:</strong> recibir tus datos en un formato estructurado,
                de uso común y lectura mecánica, y transmitirlos a otro responsable.
              </li>
              <li>
                <strong>Oposición:</strong> oponerte al tratamiento de tus datos basado en nuestro
                interés legítimo o con fines de publicidad personalizada.
              </li>
              <li>
                <strong>Retirada del consentimiento:</strong> revocar en cualquier momento el
                consentimiento prestado para el uso de cookies no esenciales, sin que ello afecte
                a la licitud del tratamiento previo.
              </li>
            </ul>
            <p>
              Puedes ejercer cualquiera de estos derechos contactándonos en{" "}
              <a href="mailto:privacy@mathle.online">privacy@mathle.online</a>. Responderemos a tu
              solicitud en un plazo máximo de 30 días. Si consideras que tus derechos no han sido
              debidamente atendidos, puedes presentar una reclamación ante la{" "}
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
              >
                Agencia Española de Protección de Datos (AEPD)
              </a>.
            </p>
          </section>

          {/* 11 */}
          <section className="pp-section">
            <h2>11. Menores de edad</h2>
            <p>
              Mathle no está dirigido a menores de 14 años. No recopilamos conscientemente datos
              personales de menores de esa edad. Si eres padre, madre o tutor legal y crees que tu
              hijo/a nos ha proporcionado datos personales sin tu consentimiento, contacta con
              nosotros en{" "}
              <a href="mailto:privacy@mathle.online">privacy@mathle.online</a> y procederemos a
              eliminar dicha información.
            </p>
          </section>

          {/* 12 */}
          <section className="pp-section">
            <h2>12. Cambios en esta política</h2>
            <p>
              Podemos actualizar esta Política de Privacidad periódicamente para reflejar cambios
              en nuestras prácticas, en la legislación aplicable o en los servicios de terceros
              que utilizamos. Cuando realicemos cambios relevantes, actualizaremos la fecha indicada
              en la parte superior de esta página. Te recomendamos revisarla de forma ocasional.
            </p>
            <p>
              Si los cambios afectan de forma significativa al tratamiento de tus datos, te lo
              comunicaremos de manera más destacada (por ejemplo, mediante un aviso en la página
              principal o, si tienes cuenta, por email).
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
