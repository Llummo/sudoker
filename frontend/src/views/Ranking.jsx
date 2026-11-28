// ============================================================================
// views/Ranking.jsx — Ranking de hoy
// Resumen superior, filtros por técnica y tabla con la fila del jugador resaltada.
// ============================================================================

import { formatearFechaMedia, formatearTiempo } from '../models/tablero.js';
import { FILTROS, formatearPuesto, slugTecnica } from '../models/ranking.js';
import { Icono, Logo } from './Compartido.jsx';

const MEDALLA = { 1: 'oro', 2: 'plata', 3: 'bronce' };

const colorAvatar = (nombre) => `av-${(nombre.charCodeAt(0) || 0) % 5}`;

export default function Ranking({ puzzle, ranking, onInicio }) {
  const { filas, filtro, conteos, resumen, total, cargando, error, cargar, cambiarFiltro } = ranking;

  return (
    <div className="pantalla ranking">
      <header className="ranking-top">
        <button className="btn btn-claro btn-chico" onClick={onInicio}>
          <Icono nombre="atras" size={16} /> Volver al inicio
        </button>
        <Logo />
      </header>

      <section className="ranking-cabecera">
        <div>
          <h1 className="titulo-ranking">Ranking de hoy</h1>
          {puzzle && (
            <div className="chips-fila">
              <span className="chip">{formatearFechaMedia(puzzle.fecha)}</span>
              <span className="chip chip-oscuro">{puzzle.dificultad}</span>
            </div>
          )}
        </div>

        <div className="stats">
          <div className="stat destacado">
            <Icono nombre="trofeo" size={26} />
            <div>
              <span className="etiqueta">Tu puesto</span>
              <strong>{formatearPuesto(resumen.puesto)}</strong>
            </div>
          </div>
          <div className="stat">
            <Icono nombre="reloj" size={26} />
            <div>
              <span className="etiqueta">Tu tiempo</span>
              <strong>{resumen.tiempo != null ? formatearTiempo(resumen.tiempo) : '—'}</strong>
            </div>
          </div>
          <div className="stat">
            <Icono nombre="brillo" size={26} />
            <div>
              <span className="etiqueta">Mejor tiempo</span>
              <strong>{resumen.mejorTiempo != null ? formatearTiempo(resumen.mejorTiempo) : '—'}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="filtros" role="tablist" aria-label="Filtrar por técnica">
        {FILTROS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filtro === f}
            className={`filtro ${filtro === f ? 'activo' : ''}`}
            onClick={() => cambiarFiltro(f)}
          >
            {f} <span className="contador">{conteos[f] ?? 0}</span>
          </button>
        ))}
      </div>

      <section className="card tabla" role="table" aria-label="Ranking del día">
        <div className="fila cabecera" role="row">
          <span role="columnheader">Posición</span>
          <span role="columnheader">Jugador</span>
          <span role="columnheader">Tiempo</span>
          <span role="columnheader">Técnica</span>
        </div>

        {cargando && <p className="estado">Cargando ranking…</p>}
        {error && (
          <p className="estado estado-error" role="alert">
            {error}{' '}
            <button className="enlace" onClick={cargar}>
              Reintentar
            </button>
          </p>
        )}
        {!cargando && !error && filas.length === 0 && (
          <p className="estado">Nadie ha usado esta técnica todavía.</p>
        )}

        {filas.map((r) => (
          <div key={`${r.posicion}-${r.jugador}`} className={`fila ${r.esActual ? 'yo' : ''}`} role="row">
            <span role="cell" className="col-pos">
              {MEDALLA[r.posicion] ? (
                <span className={`medalla ${MEDALLA[r.posicion]}`}>{r.posicion}</span>
              ) : (
                <span className="pos-num">{r.posicion}</span>
              )}
            </span>
            <span role="cell" className="col-jug">
              <span className={`avatar ${colorAvatar(r.jugador)}`}>{r.jugador.charAt(0).toUpperCase()}</span>
              {r.jugador}
              {r.esActual && <span className="tag-tu">TÚ</span>}
            </span>
            <span role="cell" className="col-tiempo">
              {formatearTiempo(r.segundos)}
            </span>
            <span role="cell" className="col-tec">
              <span className={`pill pill-${slugTecnica(r.tecnica)}`}>{r.tecnica}</span>
            </span>
          </div>
        ))}
      </section>

      <footer className="ranking-pie">
        <span className="nota-chica">Top {total} de hoy · mismo tablero para todos</span>
        <button className="btn btn-naranja" onClick={onInicio}>
          <Icono nombre="casa" size={18} /> Volver al inicio
        </button>
      </footer>
    </div>
  );
}
