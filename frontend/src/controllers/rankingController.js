// ============================================================================
// controllers/rankingController.js
// Coordina la carga del ranking diario y los cambios de filtro por técnica.
// Se usa como hook:  const ranking = useRankingController({ fecha })
// ============================================================================

import { useCallback, useMemo, useState } from 'react';
import {
  FILTRO_TODAS,
  contarPorTecnica,
  crearRanking,
  filtrarPorTecnica,
  resumenRanking,
} from '../models/ranking.js';
import { obtenerRanking } from '../services/puzzleService.js';

export function useRankingController({ fecha } = {}) {
  const [registros, setRegistros] = useState([]);
  const [filtro, setFiltro] = useState(FILTRO_TODAS);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  /** Pide el ranking al servidor y reinicia el filtro a "Todas". */
  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    setFiltro(FILTRO_TODAS);
    try {
      const dto = await obtenerRanking({ fecha });
      setRegistros(crearRanking(dto));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [fecha]);

  /** El jugador toca un botón de filtro. */
  const cambiarFiltro = useCallback((nuevo) => setFiltro(nuevo), []);

  const filas = useMemo(() => filtrarPorTecnica(registros, filtro), [registros, filtro]);
  const conteos = useMemo(() => contarPorTecnica(registros), [registros]);
  const resumen = useMemo(() => resumenRanking(registros), [registros]);

  return {
    filas,
    filtro,
    conteos,
    resumen,
    total: registros.length,
    cargando,
    error,
    cargar,
    cambiarFiltro,
  };
}
