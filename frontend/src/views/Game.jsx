// ============================================================================
// views/Game.jsx — Juego (escritorio y móvil)
// Dibuja la grilla, el cronómetro y los controles. Todo evento se delega
// a los handlers (onXxx) que vienen del controlador.
// El diseño se adapta con CSS: dos columnas en escritorio, una en móvil.
// ============================================================================

import { useEffect } from 'react';
import {
  clave,
  esPista,
  formatearFechaCorta,
  formatearTiempo,
  sonVecinas,
} from '../models/tablero.js';
import { Icono } from './Compartido.jsx';

export default function Game({
  puzzle,
  partida,
  faltantes,
  mensaje,
  onSeleccionar,
  onMover,
  onNumero,
  onBorrar,
  onNotas,
  onPausa,
  onRevisar,
  onInicio,
}) {
  // Teclado físico: 1-9, borrar, flechas y "N" para notas.
  useEffect(() => {
    const alPulsar = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key >= '1' && e.key <= '9') onNumero(Number(e.key));
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') onBorrar();
      else if (e.key === 'ArrowUp') { e.preventDefault(); onMover(-1, 0); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); onMover(1, 0); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); onMover(0, -1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); onMover(0, 1); }
      else if (e.key.toLowerCase() === 'n') onNotas();
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [onNumero, onBorrar, onMover, onNotas]);

  if (!puzzle || !partida) return null;

  const { valores, notas, seleccion, pausado, modoNotas, conflictos } = partida;
  const conflictosSet = new Set(conflictos);
  const valorSel = seleccion ? valores[seleccion.f][seleccion.c] : 0;
  const tiempo = formatearTiempo(partida.segundos);

  const botonPausa = (
    <button className="btn btn-amarillo btn-chico" onClick={onPausa}>
      <Icono nombre={pausado ? 'play' : 'pausa'} size={16} /> {pausado ? 'Seguir' : 'Pausar'}
    </button>
  );

  return (
    <div className="pantalla juego">
      <header className="juego-top">
        <button className="btn btn-claro btn-chico" onClick={onInicio} aria-label="Volver al inicio">
          <Icono nombre="atras" size={16} /> <span className="solo-desktop">Inicio</span>
        </button>
        <h1 className="logo-texto">Sudoker</h1>
        <div className="juego-top-der">
          <span className="chip solo-desktop">{formatearFechaCorta(puzzle.fecha)}</span>
          <span className="chip chip-oscuro solo-desktop">{puzzle.dificultad}</span>
          <span className="solo-movil">{botonPausa}</span>
        </div>
      </header>

      {/* Fila de datos solo para móvil */}
      <div className="meta-movil solo-movil">
        <div className="chips-movil">
          <span className="chip">{formatearFechaCorta(puzzle.fecha, true)}</span>
          <span className="chip chip-oscuro">{puzzle.dificultad}</span>
        </div>
        <div className="reloj-chico">
          <span className="punto" /> {tiempo}
        </div>
      </div>

      <div className="juego-cuerpo">
        <div className="tablero-wrap">
          <div className={`tablero ${pausado ? 'oculto' : ''}`} role="grid" aria-label="Tablero de Sudoku">
            {valores.map((fila, f) =>
              fila.map((valor, c) => {
                const pista = esPista(puzzle, f, c);
                const esSel = seleccion && seleccion.f === f && seleccion.c === c;
                const relacionada = seleccion && !esSel && sonVecinas(seleccion.f, seleccion.c, f, c);
                const clases = [
                  'celda',
                  pista ? 'pista' : '',
                  esSel ? 'sel' : '',
                  relacionada ? 'rel' : '',
                  valorSel && valor === valorSel ? 'igual' : '',
                  conflictosSet.has(clave(f, c)) ? 'error' : '',
                  c % 3 === 2 && c !== 8 ? 'sep-der' : '',
                  f % 3 === 2 && f !== 8 ? 'sep-inf' : '',
                ].join(' ');
                return (
                  <button
                    key={clave(f, c)}
                    className={clases}
                    onClick={() => onSeleccionar(f, c)}
                    role="gridcell"
                    aria-label={`Fila ${f + 1}, columna ${c + 1}${valor ? `, ${valor}` : ', vacía'}`}
                  >
                    {valor !== 0 ? (
                      valor
                    ) : notas[f][c].length > 0 ? (
                      <span className="notas">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                          <i key={n}>{notas[f][c].includes(n) ? n : ''}</i>
                        ))}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          {pausado && (
            <div className="overlay-pausa">
              <p>En pausa</p>
              <button className="btn btn-naranja" onClick={onPausa}>
                <Icono nombre="play" size={18} /> Reanudar
              </button>
            </div>
          )}
        </div>

        <aside className="panel">
          <div className="card reloj solo-desktop">
            <div>
              <span className="etiqueta">
                <span className="punto" /> Tiempo
              </span>
              <div className="reloj-num">{tiempo}</div>
            </div>
            {botonPausa}
          </div>

          <div className="acciones">
            <button
              className="btn btn-claro interruptor"
              role="switch"
              aria-checked={modoNotas}
              onClick={onNotas}
            >
              <Icono nombre="lapiz" size={16} /> Notas
              <span className={`switch ${modoNotas ? 'on' : ''}`}>
                <span />
              </span>
            </button>
            <button className="btn btn-verde" onClick={onRevisar}>
              <Icono nombre="check" size={18} /> Revisar
            </button>
          </div>

          <div className="card teclado">
            <div className="teclado-top solo-desktop">
              <span className="etiqueta">Números</span>
              <span className="nota-chica">quedan</span>
            </div>
            <div className="teclado-grid">
              {faltantes.map((resta, i) => (
                <button
                  key={i}
                  className="tecla"
                  disabled={resta === 0 || pausado}
                  onClick={() => onNumero(i + 1)}
                  aria-label={`Número ${i + 1}, quedan ${resta}`}
                >
                  <span className="tecla-num">{i + 1}</span>
                  <span className="tecla-resta">{resta}</span>
                </button>
              ))}
              <button className="tecla borrar" onClick={onBorrar}>
                <Icono nombre="borrador" size={16} />
                <span>Borrar</span>
              </button>
            </div>
          </div>

          <p className="ayuda solo-desktop">
            Toca una casilla y luego un número. Con «Notas» activado, anotas candidatos.
          </p>
        </aside>
      </div>

      {mensaje && (
        <div className={`toast ${mensaje.tipo}`} role="status">
          {mensaje.texto}
        </div>
      )}
    </div>
  );
}
