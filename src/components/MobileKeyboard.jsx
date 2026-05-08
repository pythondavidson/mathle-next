'use client';
import './MobileKeyboard.css';

/**
 * MobileKeyboard
 *
 * Props:
 *  - onKey(key)   → se llama con '0'-'9', 'backspace' o 'enter'
 *  - disabled     → bool, desactiva todo el teclado (e.g. game over)
 */
export default function MobileKeyboard({ onKey, disabled = false }) {
  const keys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['backspace', '0', 'enter'],
  ];

  return (
    <div className="mobile-kb" role="group" aria-label="Teclado numérico">
      {keys.map((row, ri) => (
        <div key={ri} className="mobile-kb__row">
          {row.map(k => {
            const isAction = k === 'backspace' || k === 'enter';
            return (
              <button
                key={k}
                className={[
                  'mobile-kb__key',
                  k === 'backspace' && 'mobile-kb__key--back',
                  k === 'enter'     && 'mobile-kb__key--enter',
                ].filter(Boolean).join(' ')}
                onPointerDown={e => {
                  e.preventDefault(); // evita que el input pierda foco
                  if (!disabled) onKey(k);
                }}
                disabled={disabled}
                aria-label={k === 'backspace' ? 'Borrar' : k === 'enter' ? 'Verificar' : k}
              >
                {k === 'backspace' ? '⌫' : k === 'enter' ? '✓' : k}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
