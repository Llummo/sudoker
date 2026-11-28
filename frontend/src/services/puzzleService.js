// ============================================================================
// services/puzzleService.js
// ÚNICA capa del frontend que habla con el backend (FastAPI → api/puzzle_router.py).
// Las vistas y controladores NUNCA escriben URLs ni usan fetch directamente.
//
// Devuelve JSON "crudo". Quien lo convierte a objetos del dominio es models/.
// ============================================================================

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ⚠️ Rutas PROVISIONALES: se ajustan cuando tengamos puzzle_router.py.
// Es el único lugar del frontend donde viven estas rutas.
export const ENDPOINTS = {
  puzzleDiario: '/puzzles/daily', // GET  ?date=YYYY-MM-DD&difficulty=...
  resultados: '/results',         // POST { date, player, seconds, technique }
  ranking: '/ranking',            // GET  ?date=YYYY-MM-DD
};

// Temporal: mientras no haya login, el jugador actual es fijo.
export const JUGADOR_ACTUAL = 'nube_roja';

// ------------------------------------------------------------------ fetch base

async function peticion(ruta, { metodo = 'GET', cuerpo, params } = {}) {
  const url = new URL(API_URL + ruta, window.location.origin);
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }

  if (!respuesta.ok) {
    let detalle = '';
    try {
      const j = await respuesta.json();
      detalle = typeof j.detail === 'string' ? j.detail : '';
    } catch {
      /* sin cuerpo JSON */
    }
    throw new Error(detalle || `Error del servidor (${respuesta.status}).`);
  }
  return respuesta.json();
}

// ----------------------------------------------------------------- API pública

/** Pide el puzzle diario. Si no se indica fecha, el backend usa la de hoy. */
export function obtenerPuzzleDelDia({ fecha, dificultad } = {}) {
  if (USAR_MOCK) return mock.puzzle(fecha);
  return peticion(ENDPOINTS.puzzleDiario, { params: { date: fecha, difficulty: dificultad } });
}

/** Envía el resultado de la partida (tiempo + técnica). */
export function enviarResultado({ fecha, jugador, segundos, tecnica }) {
  const cuerpo = { date: fecha, player: jugador, seconds: segundos, technique: tecnica };
  if (USAR_MOCK) return mock.guardar({ fecha, jugador, segundos, tecnica });
  return peticion(ENDPOINTS.resultados, { metodo: 'POST', cuerpo });
}

/** Consulta el ranking del día. Devuelve una lista de registros (JSON crudo). */
export function obtenerRanking({ fecha } = {}) {
  if (USAR_MOCK) return mock.ranking();
  return peticion(ENDPOINTS.ranking, { params: { date: fecha } });
}

// ============================================================================
// MOCK — datos de prueba para trabajar sin backend (VITE_USE_MOCK=true).
// Se borra cuando la API real esté lista.
// ============================================================================

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Un Sudoku completo válido; cada día se re-etiquetan los dígitos y se eligen otras pistas.
const BASE = [
  '534678912', '672195348', '198342567',
  '859761423', '426853791', '713924856',
  '961537284', '287419635', '345286179',
].join('');

function generador(semilla) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mezclar(lista, azar) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function puzzleDePrueba(fecha) {
  const dia = fecha ?? new Date().toISOString().slice(0, 10);
  const azar = generador(Number(dia.replace(/-/g, '')));
  const mapa = mezclar(['1', '2', '3', '4', '5', '6', '7', '8', '9'], azar);
  const solucion = [...BASE].map((d) => mapa[Number(d) - 1]).join('');
  const conservar = new Set(mezclar([...Array(81).keys()], azar).slice(0, 29));
  const puzzle = [...solucion].map((d, i) => (conservar.has(i) ? d : '0')).join('');
  return { date: dia, difficulty: 'Media', puzzle, solution: solucion, clues: 29, metrics: {} };
}

const OTROS = [
  ['kumo_azul', 298, 'Candidatos'],
  ['valeria.r', 321, 'Eliminación'],
  ['tetsu88', 347, 'Candidatos'],
  ['mateo_sdk', 370, 'Prueba y error'],
  ['hana.lima', 393, 'Eliminación'],
  ['pixelgato', 479, 'Intuición'],
  ['rodri.q', 545, 'Eliminación'],
  ['yuzu_tea', 570, 'Prueba y error'],
  ['camila.dev', 612, 'Candidatos'],
  ['onigiri42', 708, 'Intuición'],
  ['andresito', 782, 'Prueba y error'],
].map(([player, seconds, technique]) => ({ player, seconds, technique, is_current: false }));

let miResultado = null;

const mock = {
  async puzzle(fecha) {
    await esperar(300);
    return puzzleDePrueba(fecha);
  },
  async guardar({ jugador, segundos, tecnica }) {
    await esperar(300);
    miResultado = { player: jugador, seconds: segundos, technique: tecnica, is_current: true };
    return { ok: true };
  },
  async ranking() {
    await esperar(300);
    return miResultado ? [...OTROS, miResultado] : [...OTROS];
  },
};
