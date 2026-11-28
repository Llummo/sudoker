// ============================================================================
// models/ranking.js
// Registros del ranking del día + filtro activo por técnica.
// Sin interfaz ni red: solo datos y cálculos.
// ============================================================================

export const TECNICAS = ['Candidatos', 'Eliminación', 'Prueba y error', 'Intuición'];
export const FILTRO_TODAS = 'Todas';
export const FILTROS = [FILTRO_TODAS, ...TECNICAS];

const normalizar = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

const TECNICA_POR_CLAVE = {
  candidatos: 'Candidatos',
  candidates: 'Candidatos',
  eliminacion: 'Eliminación',
  elimination: 'Eliminación',
  pruebayerror: 'Prueba y error',
  trialanderror: 'Prueba y error',
  intuicion: 'Intuición',
  intuition: 'Intuición',
};

/** Convierte lo que mande el backend ("candidates", "prueba_y_error"...) al nombre que se muestra. */
export const nombreTecnica = (t) => TECNICA_POR_CLAVE[normalizar(t)] ?? t ?? '—';

/** Clave corta para el color de la etiqueta en CSS. */
export const slugTecnica = (t) =>
  ({
    Candidatos: 'candidatos',
    Eliminación: 'eliminacion',
    'Prueba y error': 'prueba',
    Intuición: 'intuicion',
  })[nombreTecnica(t)] ?? 'otra';

/** Un registro del ranking. */
export function crearRegistro(dto) {
  return {
    posicion: Number(dto.posicion ?? dto.position ?? 0),
    jugador: dto.jugador ?? dto.player ?? dto.username ?? 'anónimo',
    segundos: Number(dto.segundos ?? dto.tiempo ?? dto.seconds ?? dto.time ?? 0),
    tecnica: nombreTecnica(dto.tecnica ?? dto.technique),
    esActual: Boolean(dto.esActual ?? dto.es_actual ?? dto.is_current ?? false),
  };
}

/** Lista del backend -> registros ordenados por tiempo, con posición 1..n. */
export function crearRanking(lista = []) {
  return lista
    .map(crearRegistro)
    .sort((a, b) => a.segundos - b.segundos)
    .map((r, i) => ({ ...r, posicion: i + 1 }));
}

/** Devuelve las filas según el filtro activo (conservan su posición global). */
export function filtrarPorTecnica(registros, filtro = FILTRO_TODAS) {
  if (filtro === FILTRO_TODAS) return registros;
  return registros.filter((r) => r.tecnica === filtro);
}

/** { Todas: 12, Candidatos: 4, ... } para los números de los botones de filtro. */
export function contarPorTecnica(registros) {
  const conteos = { [FILTRO_TODAS]: registros.length };
  for (const t of TECNICAS) conteos[t] = registros.filter((r) => r.tecnica === t).length;
  return conteos;
}

/** Datos del resumen superior: puesto, tiempo del jugador y mejor tiempo. */
export function resumenRanking(registros) {
  const yo = registros.find((r) => r.esActual);
  return {
    puesto: yo ? yo.posicion : null,
    tiempo: yo ? yo.segundos : null,
    mejorTiempo: registros.length ? registros[0].segundos : null,
  };
}

/** Puesto que tendría un tiempo dado frente a los registros actuales (para la pantalla de resultado). */
export function calcularPuestoProvisional(registros, segundos) {
  return 1 + registros.filter((r) => !r.esActual && r.segundos < segundos).length;
}

export const formatearPuesto = (n) => (n == null ? '—' : `${n}.º`);
