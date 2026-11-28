// ============================================================================
// views/Home.jsx — Inicio: Sudoku del día
// Solo muestra información y dispara eventos (Jugar / Ranking).
// ============================================================================

import { formatearFechaLarga } from '../models/tablero.js';
import { BarraDificultad, Icono, Logo, MiniTablero, Mochi } from './Compartido.jsx';

export default function Home({ puzzle, cargando, error, onJugar, onVerRanking, onReintentar }) {
  return (
    <div className="pantalla home">
      <header className="home-top">
        <Logo />
        <button className="btn btn-claro btn-chico" onClick={onVerRanking}>
          <Icono nombre="trofeo" size={18} /> Ranking de hoy
        </button>
      </header>

      <main className="home-hero">
        <section className="home-izq">
          {puzzle && (
            <span className="chip chip-fecha">
              <Icono nombre="calendario" size={18} /> {formatearFechaLarga(puzzle.fecha)}
            </span>
          )}

          <h1 className="titulo-grande">Sudoker</h1>
          <h2 className="subtitulo">Sudoku del día</h2>
          <p className="lema">Un Sudoku nuevo cada día, igual para todos.</p>

          <div className="card dificultad-card">
            <div className="dificultad-fila">
              <span className="etiqueta">Dificultad de hoy</span>
              <span className="chip chip-oscuro">{puzzle ? puzzle.dificultad : '…'}</span>
            </div>
            <BarraDificultad nivel={puzzle ? puzzle.nivel : 0} />
          </div>

          <div className="jugar-fila">
            <button className="btn btn-naranja btn-grande" onClick={onJugar} disabled={!puzzle}>
              <Icono nombre="play" size={22} /> Jugar
            </button>
            <span className="nota-chica">El reloj empieza al entrar</span>
          </div>

          {cargando && <p className="estado">Cargando el Sudoku de hoy…</p>}
          {error && (
            <p className="estado estado-error" role="alert">
              {error}{' '}
              <button className="enlace" onClick={onReintentar}>
                Reintentar
              </button>
            </p>
          )}
        </section>

        <section className="home-der">
          <div className="card tablero-card">
            <span className="cinta cinta-amarilla" />
            <span className="cinta cinta-verde" />
            <div className="tablero-card-top">
              <strong>Tablero de hoy</strong>
              {puzzle && <span className="nota-chica">{puzzle.pistas} pistas</span>}
            </div>
            {puzzle ? (
              <MiniTablero grilla={puzzle.inicial} />
            ) : (
              <div className="mini-tablero vacio" />
            )}
            <span className="sello-sudoku">
              数<br />独
            </span>
          </div>

          <div className="mochi-fila">
            <Mochi size={74} />
            <div className="burbuja">
              <span className="burbuja-nombre">Mochi</span>
              {puzzle
                ? `¡Hoy toca uno de dificultad ${puzzle.dificultad.toLowerCase()}! ¿Lo resuelves antes que nadie?`
                : '¡Preparando el reto de hoy!'}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
