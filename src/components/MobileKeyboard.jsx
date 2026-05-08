'use client';
import { useEffect, useRef } from 'react';
import './MobileKeyboard.css';

/**
 * MobileKeyboard
 *
 * Props:
 *  - open        → bool, si el teclado está desplegado
 *  - onKey(key)  → '0'-'9', 'backspace' o 'enter'
 *  - onClose()   → llamado cuando el usuario toca fuera del teclado
 *  - disabled    → bool
 */
export default function MobileKeyboard({ open, onKey, onClose, disabled = false }) {
  const kbRef = useRef(null);

  // Cerrar al tocar fuera (pero no si el toque es en una celda activa)
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e) {
      if (kbRef.current?.contains(e.target)) return;
      // Las celdas activas gestionan su propio foco y llaman a onOpen —
      // no cerramos aquí para que el cambio de celda no parpadee
      if (e.target.closest('.timed-cell') || e.target.closest('.cell')) return;
      onClose?.();
    }

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [open, onClose]);

  const rows = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['backspace', '0', 'enter'],
  ];

  return (
    <div
      ref={kbRef}
      className={`mobile-kb${open ? ' mobile-kb--open' : ''}`}
      role="group"
      aria-label="Teclado numérico"
    >
      <div className="mobile-kb__handle" aria-hidden="true" />

      {rows.map((row, ri) => (
        <div key={ri} className="mobile-kb__row">
          {row.map(k => (
            <button
              key={k}
              className={[
                'mobile-kb__key',
                k === 'backspace' && 'mobile-kb__key--back',
                k === 'enter'     && 'mobile-kb__key--enter',
              ].filter(Boolean).join(' ')}
              onPointerDown={e => {
                e.preventDefault(); // mantiene el foco en el input
                if (!disabled) onKey(k);
              }}
              disabled={disabled}
              aria-label={k === 'backspace' ? 'Borrar' : k === 'enter' ? 'Verificar' : k}
            >
              {k === 'backspace' ? '⌫' : k === 'enter' ? '✓' : k}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
