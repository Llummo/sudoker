// ============================================================================
// views/Compartido.jsx
// Piezas visuales pequeñas que usan varias pantallas: iconos, mascota Mochi,
// logo, barra de dificultad y vista previa del tablero. Solo presentación.
// ============================================================================

const ICONOS = {
  calendario: (
    <>
      <path d="M4 6h16v14H4z" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </>
  ),
  trofeo: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
      <path d="M8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 20h8" />
    </>
  ),
  play: <path d="M7 4l13 8-13 8z" fill="currentColor" />,
  pausa: <path d="M8 5v14M16 5v14" strokeWidth="3.4" />,
  lapiz: <path d="M4 20l1-4L16 5l3 3L8 19l-4 1zM14 7l3 3" />,
  check: <path d="M5 12.5l5 5L20 7" />,
  borrador: <path d="M5 15l8-8 6 6-6 6H9zM9 21h11" />,
  casa: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v10h12V10" />
    </>
  ),
  atras: <path d="M15 18l-6-6 6-6" />,
  reloj: (
    <>
      <circle cx="12" cy="14" r="7" />
      <path d="M12 14v-3M9 3h6" />
    </>
  ),
  brillo: <path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z" />,
};

export function Icono({ nombre, size = 20 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONOS[nombre]}
    </svg>
  );
}

/** Mascota Mochi. */
export function Mochi({ size = 64 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d="M32 14C17 14 9 24 9 36c0 10 9 17 23 17s23-7 23-17c0-12-8-22-23-22z"
        fill="#fff8ec"
        stroke="#3a2a22"
        strokeWidth="3"
      />
      <path d="M32 14c0-6 4-10 10-10-1 6-4 10-10 10z" fill="#8fb55e" stroke="#3a2a22" strokeWidth="3" />
      <circle cx="24" cy="36" r="2.8" fill="#3a2a22" />
      <circle cx="40" cy="36" r="2.8" fill="#3a2a22" />
      <ellipse cx="17" cy="42" rx="4" ry="2.6" fill="#f7a99a" />
      <ellipse cx="47" cy="42" rx="4" ry="2.6" fill="#f7a99a" />
      <path d="M29 42q3 3 6 0" fill="none" stroke="#3a2a22" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="logo">
      <Mochi size={34} />
      <span>Sudoker</span>
    </div>
  );
}

/** Barra de 5 segmentos. `nivel` va de 1 a 5. */
export function BarraDificultad({ nivel, pequena = false }) {
  return (
    <div className={`barra-dif ${pequena ? 'pequena' : ''}`} role="img" aria-label={`Nivel ${nivel} de 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < nivel ? 'lleno' : ''} />
      ))}
    </div>
  );
}

/** Vista previa del tablero (solo pistas), usada en el inicio. */
export function MiniTablero({ grilla }) {
  return (
    <div className="mini-tablero" aria-hidden="true">
      {grilla.map((fila, f) =>
        fila.map((v, c) => (
          <span
            key={`${f}-${c}`}
            className={[
              v ? 'con-pista' : '',
              c % 3 === 2 && c !== 8 ? 'sep-der' : '',
              f % 3 === 2 && f !== 8 ? 'sep-inf' : '',
            ].join(' ')}
          >
            {v || ''}
          </span>
        ))
      )}
    </div>
  );
}
