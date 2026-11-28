// ============================================================================
// controllers/gameController.js
// Coordina el ciclo de la partida: conecta las acciones del usuario (views)
// con los datos (models) y el servidor (services).
// Se usa como hook:  const game = useGameController({ onTerminar })
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  alternarModoNotas,
  borrarCelda,
  colocarNumero,
  crearPartida,
  crearPuzzle,
  detectarConflictos,
  faltantesPorNumero,
  moverSeleccion,
  revisarPartida,
  seleccionarCelda,
  tableroLleno,
} from '../models/tablero.js';
import { calcularPuestoProvisional, crearRanking } from '../models/ranking.js';
import {
  JUGADOR_ACTUAL,
  enviarResultado,
  obtenerPuzzleDelDia,
  obtenerRanking,
} from '../services/puzzleService.js';

export function useGameController({ onTerminar } = {}) {
  const [puzzle, setPuzzle] = useState(null);
  const [partida, setPartida] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null); // { tipo: 'ok' | 'error', texto }
  const [terminada, setTerminada] = useState(false);
  const [puesto, setPuesto] = useState(null); // puesto provisional
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const onTerminarRef = useRef(onTerminar);
  onTerminarRef.current = onTerminar;

  // ---------------------------------------------------------- cargar / iniciar

  const cargarPuzzle = useCallback(async (opciones = {}) => {
    setCargando(true);
    setError(null);
    try {
      const dto = await obtenerPuzzleDelDia(opciones);
      setPuzzle(crearPuzzle(dto));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  /** Botón "Jugar": arranca el cronómetro. Si hay una partida a medias, la retoma. */
  const iniciarPartida = useCallback(() => {
    if (!puzzle) return;
    if (partida?.iniciada && !terminada) {
      setPartida((p) => ({ ...p, pausado: false }));
      return;
    }
    setPartida({ ...crearPartida(puzzle), iniciada: true });
    setTerminada(false);
    setGuardado(false);
    setPuesto(null);
    setMensaje(null);
  }, [puzzle, partida?.iniciada, terminada]);

  // ------------------------------------------------------------- cronómetro

  useEffect(() => {
    if (!partida?.iniciada || partida.pausado || terminada) return undefined;
    const id = setInterval(() => {
      setPartida((p) => (p && !p.pausado ? { ...p, segundos: p.segundos + 1 } : p));
    }, 1000);
    return () => clearInterval(id);
  }, [partida?.iniciada, partida?.pausado, terminada]);

  const pausar = useCallback(() => {
    setPartida((p) => (p && p.iniciada ? { ...p, pausado: true } : p));
  }, []);

  const alternarPausa = useCallback(() => {
    setPartida((p) => (p ? { ...p, pausado: !p.pausado } : p));
  }, []);

  // ---------------------------------------------------------------- tablero

  const seleccionar = useCallback((f, c) => {
    setPartida((p) => (p && !p.pausado ? seleccionarCelda(p, f, c) : p));
  }, []);

  const mover = useCallback((df, dc) => {
    setPartida((p) => (p && !p.pausado ? moverSeleccion(p, df, dc) : p));
  }, []);

  const ingresarNumero = useCallback(
    (n) => setPartida((p) => (p && puzzle ? colocarNumero(p, puzzle, n) : p)),
    [puzzle]
  );

  const borrar = useCallback(
    () => setPartida((p) => (p && puzzle ? borrarCelda(p, puzzle) : p)),
    [puzzle]
  );

  const alternarNotas = useCallback(() => {
    setPartida((p) => (p ? alternarModoNotas(p) : p));
  }, []);

  /** Botón "Revisar": marca conflictos y muestra un aviso. */
  const revisar = useCallback(() => {
    if (!partida) return;
    const { conflictos, resuelto } = revisarPartida(partida);
    setPartida((p) => ({ ...p, conflictos }));
    if (conflictos.length > 0) {
      setMensaje({
        tipo: 'error',
        texto: `Hay ${conflictos.length} casilla${conflictos.length > 1 ? 's' : ''} en conflicto.`,
      });
    } else if (!resuelto) {
      setMensaje({ tipo: 'ok', texto: 'Sin conflictos por ahora. ¡Sigue así!' });
    }
  }, [partida]);

  // El aviso desaparece solo.
  useEffect(() => {
    if (!mensaje) return undefined;
    const id = setTimeout(() => setMensaje(null), 3000);
    return () => clearTimeout(id);
  }, [mensaje]);

  // ----------------------------------------------------------- fin de partida

  useEffect(() => {
    if (!partida?.iniciada || terminada) return;
    if (tableroLleno(partida.valores) && detectarConflictos(partida.valores).length === 0) {
      setTerminada(true);
      setPartida((p) => ({ ...p, pausado: true, seleccion: null }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partida?.valores]);

  // Al terminar: calcula el puesto provisional y avisa a la app para mostrar el Resultado.
  useEffect(() => {
    if (!terminada) return undefined;
    let vivo = true;
    const segundos = partida.segundos;
    obtenerRanking({ fecha: puzzle?.fecha })
      .then((dto) => vivo && setPuesto(calcularPuestoProvisional(crearRanking(dto), segundos)))
      .catch(() => vivo && setPuesto(null));
    onTerminarRef.current?.();
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminada]);

  /** Guarda la técnica elegida en el estado de la partida. */
  const elegirTecnica = useCallback((tecnica) => {
    setPartida((p) => (p ? { ...p, tecnica } : p));
  }, []);

  /** Envía tiempo + técnica al servidor. Devuelve true si se guardó. */
  const guardarResultado = useCallback(async () => {
    if (guardado) return true;
    if (!partida?.tecnica) return false;
    setGuardando(true);
    setError(null);
    try {
      await enviarResultado({
        fecha: puzzle.fecha,
        jugador: JUGADOR_ACTUAL,
        segundos: partida.segundos,
        tecnica: partida.tecnica,
      });
      setGuardado(true);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setGuardando(false);
    }
  }, [guardado, partida, puzzle]);

  // ------------------------------------------------------------------ salida

  return {
    // estado
    puzzle,
    partida,
    cargando,
    error,
    mensaje,
    terminada,
    puesto,
    guardando,
    // derivados
    faltantes: partida ? faltantesPorNumero(partida.valores) : Array(9).fill(9),
    // acciones
    cargarPuzzle,
    iniciarPartida,
    pausar,
    alternarPausa,
    seleccionar,
    mover,
    ingresarNumero,
    borrar,
    alternarNotas,
    revisar,
    elegirTecnica,
    guardarResultado,
  };
}
