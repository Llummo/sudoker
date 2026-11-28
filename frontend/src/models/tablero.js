// ============================================================================
// models/tablero.js
// Datos del puzzle del día + estado de la partida + validaciones locales.
// No toca la interfaz ni hace peticiones de red: solo datos y cálculos.
// Todas las funciones devuelven objetos NUEVOS (React detecta bien los cambios).
// ============================================================================

export const TAMANO = 9;
export const NIVELES = ['Muy fácil', 'Fácil', 'Media', 'Difícil', 'Experta'];

// ---------------------------------------------------------------- utilidades

const sinTildes = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const clonar = (grilla) => grilla.map((fila) => [...fila]);

export const clave = (f, c) => `${f}-${c}`;

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const aFecha = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export function hoyISO() {
  const h = new Date();
  const mm = String(h.getMonth() + 1).padStart(2, '0');
  const dd = String(h.getDate()).padStart(2, '0');
  return `${h.getFullYear()}-${mm}-${dd}`;
}

/** "Viernes, 20 de noviembre de 2026" */
export function formatearFechaLarga(iso) {
  const f = aFecha(iso);
  const txt = `${DIAS[f.getDay()]}, ${f.getDate()} de ${MESES[f.getMonth()]} de ${f.getFullYear()}`;
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

/** "Viernes, 20 de noviembre" */
export function formatearFechaMedia(iso) {
  const f = aFecha(iso);
  const txt = `${DIAS[f.getDay()]}, ${f.getDate()} de ${MESES[f.getMonth()]}`;
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

/** "20 de noviembre"  (o "20 nov" si abreviado = true) */
export function formatearFechaCorta(iso, abreviado = false) {
  const f = aFecha(iso);
  const mes = MESES[f.getMonth()];
  return abreviado ? `${f.getDate()} ${mes.slice(0, 3)}` : `${f.getDate()} de ${mes}`;
}

/** 522 -> "08:42" */
export function formatearTiempo(segundos) {
  const s = Math.max(0, Math.floor(segundos || 0));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// ------------------------------------------------- adaptación del DTO (JSON)

const NIVEL_POR_NOMBRE = {
  'muy facil': 1, 'very easy': 1,
  facil: 2, easy: 2,
  media: 3, medio: 3, medium: 3,
  dificil: 4, hard: 4,
  experta: 5, experto: 5, expert: 5,
};

/** Convierte la dificultad que mande el backend (texto o número) a un nivel 1..5. */
export function nivelDeDificultad(valor) {
  if (typeof valor === 'number') return Math.min(5, Math.max(1, Math.round(valor)));
  return NIVEL_POR_NOMBRE[sinTildes(valor)] ?? 3;
}

/**
 * Acepta la grilla en cualquiera de estos formatos y devuelve matriz 9x9 de números (0 = vacío):
 *  - string de 81 caracteres ("0" o "." para vacío)
 *  - matriz 9x9
 *  - lista plana de 81 números
 */
export function aGrilla(origen) {
  if (typeof origen === 'string') {
    const d = origen.replace(/\./g, '0').replace(/[^0-9]/g, '');
    if (d.length !== 81) throw new Error('La grilla debe tener 81 celdas');
    return Array.from({ length: 9 }, (_, f) =>
      Array.from({ length: 9 }, (_, c) => Number(d[f * 9 + c]))
    );
  }
  if (Array.isArray(origen) && origen.length === 9 && Array.isArray(origen[0])) {
    return origen.map((fila) => fila.map((v) => Number(v) || 0));
  }
  if (Array.isArray(origen) && origen.length === 81) {
    return Array.from({ length: 9 }, (_, f) =>
      Array.from({ length: 9 }, (_, c) => Number(origen[f * 9 + c]) || 0)
    );
  }
  throw new Error('Formato de grilla no reconocido');
}

const contarPistas = (grilla) => grilla.flat().filter((v) => v !== 0).length;

/**
 * Puzzle del día (datos que NO cambian durante la partida).
 * Si el backend usa otros nombres de campo, solo se ajusta aquí.
 */
export function crearPuzzle(dto) {
  const inicial = aGrilla(dto.grilla_inicial ?? dto.puzzle ?? dto.initial ?? dto.grid);
  const dtoSolucion = dto.solucion ?? dto.solution ?? null;
  const nivel = nivelDeDificultad(dto.dificultad ?? dto.difficulty);
  return {
    fecha: dto.fecha ?? dto.date ?? hoyISO(),
    nivel,
    dificultad: NIVELES[nivel - 1],
    inicial,
    solucion: dtoSolucion ? aGrilla(dtoSolucion) : null,
    pistas: dto.pistas ?? dto.clues ?? contarPistas(inicial),
    metricas: dto.metricas ?? dto.metrics ?? {},
  };
}

export const esPista = (puzzle, f, c) => puzzle.inicial[f][c] !== 0;

// ------------------------------------------------------ estado de la partida

/** Estado inicial de una partida nueva. */
export function crearPartida(puzzle) {
  return {
    valores: clonar(puzzle.inicial),
    notas: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => [])),
    seleccion: null, // { f, c } o null
    segundos: 0,
    pausado: false,
    modoNotas: false,
    tecnica: null,
    conflictos: [], // claves "f-c" marcadas tras pulsar Revisar
    iniciada: false,
  };
}

export function seleccionarCelda(partida, f, c) {
  return { ...partida, seleccion: { f, c } };
}

export function moverSeleccion(partida, df, dc) {
  const actual = partida.seleccion ?? { f: 0, c: 0 };
  const f = Math.min(8, Math.max(0, actual.f + df));
  const c = Math.min(8, Math.max(0, actual.c + dc));
  return { ...partida, seleccion: { f, c } };
}

export function alternarModoNotas(partida) {
  return { ...partida, modoNotas: !partida.modoNotas };
}

const mismaCaja = (f1, c1, f2, c2) =>
  Math.floor(f1 / 3) === Math.floor(f2 / 3) && Math.floor(c1 / 3) === Math.floor(c2 / 3);

export const sonVecinas = (f1, c1, f2, c2) =>
  f1 === f2 || c1 === c2 || mismaCaja(f1, c1, f2, c2);

/** Coloca un dígito (modo normal) o alterna una nota (modo Notas) en la celda seleccionada. */
export function colocarNumero(partida, puzzle, numero) {
  const { seleccion } = partida;
  if (!seleccion || partida.pausado) return partida;
  const { f, c } = seleccion;
  if (esPista(puzzle, f, c)) return partida;

  if (partida.modoNotas) {
    if (partida.valores[f][c] !== 0) return partida; // solo se anota en celdas vacías
    const notas = partida.notas.map((fila) => fila.map((n) => [...n]));
    const lista = notas[f][c];
    notas[f][c] = lista.includes(numero)
      ? lista.filter((n) => n !== numero)
      : [...lista, numero].sort((a, b) => a - b);
    return { ...partida, notas, conflictos: [] };
  }

  const valores = clonar(partida.valores);
  valores[f][c] = numero;
  // al poner un valor se limpia la nota de esa celda y se quita ese número de las notas vecinas
  const notas = partida.notas.map((fila, ff) =>
    fila.map((n, cc) => {
      if (ff === f && cc === c) return [];
      return sonVecinas(f, c, ff, cc) ? n.filter((x) => x !== numero) : n;
    })
  );
  return { ...partida, valores, notas, conflictos: [] };
}

export function borrarCelda(partida, puzzle) {
  const { seleccion } = partida;
  if (!seleccion || partida.pausado) return partida;
  const { f, c } = seleccion;
  if (esPista(puzzle, f, c)) return partida;
  const valores = clonar(partida.valores);
  valores[f][c] = 0;
  const notas = partida.notas.map((fila) => fila.map((n) => [...n]));
  notas[f][c] = [];
  return { ...partida, valores, notas, conflictos: [] };
}

// ------------------------------------------------------ validaciones locales

/** Grupos de 9 celdas: 9 filas + 9 columnas + 9 cajas 3x3. */
function unidades() {
  const grupos = [];
  for (let i = 0; i < 9; i++) {
    grupos.push(Array.from({ length: 9 }, (_, k) => [i, k])); // fila i
    grupos.push(Array.from({ length: 9 }, (_, k) => [k, i])); // columna i
    const bf = Math.floor(i / 3) * 3;
    const bc = (i % 3) * 3;
    grupos.push(Array.from({ length: 9 }, (_, k) => [bf + Math.floor(k / 3), bc + (k % 3)])); // caja i
  }
  return grupos;
}
const UNIDADES = unidades();

/** Devuelve las claves "f-c" de todas las celdas que repiten número en su fila, columna o caja. */
export function detectarConflictos(valores) {
  const malas = new Set();
  for (const grupo of UNIDADES) {
    const vistos = new Map();
    for (const [f, c] of grupo) {
      const v = valores[f][c];
      if (v === 0) continue;
      if (!vistos.has(v)) vistos.set(v, []);
      vistos.get(v).push(clave(f, c));
    }
    for (const celdas of vistos.values()) {
      if (celdas.length > 1) celdas.forEach((k) => malas.add(k));
    }
  }
  return [...malas];
}

/** Cuántos números del 1 al 9 faltan por colocar. Posición 0 = dígito 1. */
export function faltantesPorNumero(valores) {
  const usados = Array(9).fill(0);
  for (const fila of valores) for (const v of fila) if (v !== 0) usados[v - 1] += 1;
  return usados.map((n) => Math.max(0, 9 - n));
}

export const tableroLleno = (valores) => valores.every((fila) => fila.every((v) => v !== 0));

/** Resultado de pulsar "Revisar". */
export function revisarPartida(partida) {
  const conflictos = detectarConflictos(partida.valores);
  const lleno = tableroLleno(partida.valores);
  return { conflictos, lleno, resuelto: lleno && conflictos.length === 0 };
}
