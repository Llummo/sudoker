// ============================================================================
// views/Result.jsx — Resultado de la partida
// Muestra tiempo, dificultad y puesto provisional; pide la técnica usada.
// ============================================================================

import { formatearFechaMedia, formatearTiempo } from '../models/tablero.js';
import { TECNICAS, formatearPuesto } from '../models/ranking.js';
import { BarraDificultad, Icono, Logo, Mochi } from './Compartido.jsx';

const DESCRIPCIONES = {
  Candidatos: 'Anoté los números posibles en cada casilla',
  Eliminación: 'Descarté números por fila, columna y caja',
  'Prueba y error': 'Probé un número y comprobé si encajaba',
  Intuición: 'Fui casilla a casilla, sin método fijo',
};

export default function Result({
  puzzle,
  partida,
  puesto,
  guardando,
  error,
  onElegirTecnica,
  onVerRanking,
  onInicio,
}) {
  if (!puzzle || !partida) return null;
  const elegida = partida.tecnica;

  return (
    <div className="pantalla resultado">
      <header className="resultado-top">
        <Logo />
        <span className="chip">{formatearFechaMedia(puzzle.fecha)}</span>
      </header>

      <main className="cuaderno">
        <section className="pagina pagina-izq">
          <span className="etiqueta">Sudoku del día · Resuelto</span>
          <span className="sello-bien">
            ¡Bien
            <br />
            hecho!
          </span>

          <h1 className="resuelto">¡Resuelto!</h1>

          <span className="nota-chica">Tu tiempo</span>
          <div className="tiempo-final">{formatearTiempo(partida.segundos)}</div>

          <div className="mini-card">
            <span className="etiqueta">Dificultad</span>
            <div className="dificultad-fila">
              <strong>{puzzle.dificultad}</strong>
              <BarraDificultad nivel={puzzle.nivel} pequena />
            </div>
          </div>

          <div className="mini-card">
            <span className="etiqueta">Puesto provisional</span>
            <strong className="puesto">{puesto ? `${formatearPuesto(puesto)} de hoy` : '…'}</strong>
          </div>

          <div className="mochi-fila chica">
            <Mochi size={52} />
            <div className="burbuja">¡Mañana hay otro!</div>
          </div>
        </section>

        <div className="anillos" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} />
          ))}
        </div>

        <section className="pagina pagina-der">
          <h2 className="pregunta">¿Qué técnica usaste?</h2>
          <p className="nota-chica">Aparecerá junto a tu tiempo en el ranking.</p>

          <div className="opciones" role="radiogroup" aria-label="Técnica usada">
            {TECNICAS.map((t) => (
              <label key={t} className={`opcion ${elegida === t ? 'activa' : ''}`}>
                <input
                  type="radio"
                  name="tecnica"
                  value={t}
                  checked={elegida === t}
                  onChange={() => onElegirTecnica(t)}
                />
                <span className="radio" />
                <span>
                  <strong>{t}</strong>
                  <small>{DESCRIPCIONES[t]}</small>
                </span>
              </label>
            ))}
          </div>

          <p className="nota-chica">
            {elegida ? 'Listo, ya puedes guardar tu resultado.' : 'Elige una opción para guardarla.'}
          </p>
          {error && (
            <p className="estado estado-error" role="alert">
              {error}
            </p>
          )}

          <div className="resultado-botones">
            <button
              className="btn btn-naranja"
              onClick={onVerRanking}
              disabled={!elegida || guardando}
            >
              <Icono nombre="trofeo" size={18} /> {guardando ? 'Guardando…' : 'Ver ranking'}
            </button>
            <button className="btn btn-claro" onClick={onInicio}>
              <Icono nombre="casa" size={18} /> Volver al inicio
            </button>
          </div>
        </section>

        <div className="pestanas" aria-hidden="true">
          <span className="p-naranja" />
          <span className="p-amarilla" />
          <span className="p-verde" />
          <span className="p-azul" />
        </div>
      </main>
    </div>
  );
}
