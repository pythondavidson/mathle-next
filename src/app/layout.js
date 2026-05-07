import { Space_Mono } from 'next/font/google';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../app/globals.css';

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
});

export const metadata = {
  title: 'Mathle — Ecuación del día',
  description: 'Mathle es el juego de matemáticas diario. Adivina los valores que hacen válida la ecuación en 6 intentos. Nuevo puzzle cada día.',
  keywords: 'mathle, juego matematicas, wordle matematicas, ecuacion del dia, puzzle matematico',
  authors: [{ name: 'Mathle' }],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    siteName: 'Mathle',
    title: 'Mathle — Ecuación del día',
    description: 'El juego de matemáticas diario. Adivina los valores que hacen válida la ecuación en 6 intentos.',
    url: 'https://mathle.online',
    images: [{ url: 'https://mathle.online/og-image.png', width: 1200, height: 630 }],
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mathle — Ecuación del día',
    description: 'El juego de matemáticas diario. Adivina los valores que hacen válida la ecuación en 6 intentos.',
    images: ['https://mathle.online/og-image.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={spaceMono.className}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}