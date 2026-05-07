import { Space_Mono } from 'next/font/google';
import Script from 'next/script';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NProgressBar from '../components/NProgressBar';
import './globals.css';

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
});
export const viewport = {
  themeColor: '#0e1117',
};
export const metadata = {
  title: 'Mathle — El juego de matemáticas diario',
  description: 'Mathle es el Wordle de las matemáticas. Adivina los valores que hacen válida la ecuación en 6 intentos. Un puzzle nuevo cada día, modo contrareloj y ranking global. ¡Gratis!',
  keywords: 'mathle, wordle matematicas, juego matematicas diario, ecuacion del dia, puzzle matematico, juego numeros, contrareloj matematicas, adivina la ecuacion',
  authors: [{ name: 'Mathle' }],
  robots: 'index, follow, max-snippet:-1, max-image-preview:large',
  themeColor: '#0e1117',
  applicationName: 'Mathle',
  openGraph: {
    type: 'website',
    siteName: 'Mathle',
    title: 'Mathle — El juego de matemáticas diario',
    description: 'El Wordle de las matemáticas. Adivina los valores que hacen válida la ecuación en 6 intentos. Un puzzle nuevo cada día. ¡Gratis!',
    url: 'https://mathle.online',
    images: [{ url: 'https://mathle.online/og-image.png', width: 1200, height: 630, alt: 'Mathle — Adivina la ecuación en 6 intentos' }],
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mathle_online',
    title: 'Mathle — El juego de matemáticas diario',
    description: 'El Wordle de las matemáticas. Adivina los valores que hacen válida la ecuación en 6 intentos. Un puzzle nuevo cada día.',
    images: [{ url: 'https://mathle.online/og-image.png', alt: 'Mathle — Adivina la ecuación en 6 intentos' }],
  },
};

const schemaWebApp = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Mathle",
  "url": "https://mathle.online",
  "description": "Mathle es el Wordle de las matemáticas. Adivina los valores que hacen válida la ecuación en 6 intentos. Un puzzle nuevo cada día, gratis.",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Web, iOS, Android",
  "inLanguage": "es",
  "isAccessibleForFree": true,
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
  "author": { "@type": "Organization", "name": "Mathle", "url": "https://mathle.online" },
  "genre": "Puzzle",
  "keywords": "matematicas, wordle, ecuacion, puzzle diario, contrareloj",
  "screenshot": "https://mathle.online/og-image.png",
  "featureList": ["Ecuación del día", "Modo contrareloj", "Ranking global", "Gratis"]
};

const schemaFAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "¿Qué es Mathle?",
      "acceptedAnswer": { "@type": "Answer", "text": "Mathle es el juego de matemáticas diario, similar al Wordle pero con ecuaciones. Tienes 6 intentos para adivinar los valores que hacen válida la ecuación del día." }
    },
    {
      "@type": "Question",
      "name": "¿Cómo se juega Mathle?",
      "acceptedAnswer": { "@type": "Answer", "text": "Rellena los huecos de la ecuación con números. Si el valor está en la posición correcta se muestra en verde, si existe pero en otra posición en amarillo, y si no aparece en rojo. Tienes 6 intentos." }
    },
    {
      "@type": "Question",
      "name": "¿Es gratis Mathle?",
      "acceptedAnswer": { "@type": "Answer", "text": "Sí, Mathle es completamente gratuito. Puedes jugar sin registrarte, aunque crear una cuenta te permite guardar tu racha y aparecer en el ranking global." }
    },
    {
      "@type": "Question",
      "name": "¿Cada cuánto cambia la ecuación?",
      "acceptedAnswer": { "@type": "Answer", "text": "La ecuación del modo diario cambia cada día a medianoche. Además hay un modo contrareloj donde puedes resolver tantas ecuaciones como puedas en 60 segundos." }
    }
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        
        <link rel="canonical" href="https://mathle.online" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebApp) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }}
        />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7032825555764916"
          crossorigin="anonymous"></script>
      </head>
      <body className={spaceMono.className}>
        
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
        <NProgressBar />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}