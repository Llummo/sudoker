// ============================================================================
// App.jsx
// Punto de unión: crea los controladores y decide qué vista mostrar.
// No usa librería de rutas: con 4 pantallas basta un estado simple.
// ============================================================================

import { useEffect, useState } from 'react';
import { useGameController } from './controllers/gameController.js';
import { useRankingController } from './controllers/rankingController.js';
import Home from './views/Home.jsx';
import Game from './views/Game.jsx';
import Result from './views/Result.jsx';
import Ranking from './views/Ranking.jsx';

export default function App() {
  const [pantalla, setPantalla] = useState('home'); // 'home' | 'game' | 'result' | 'ranking'

  const game = useGameController({ onTerminar: () => setPantalla('result') });
  const ranking = useRankingController({ fecha: game.puzzle?.fecha });

  // Al abrir la app se pide el puzzle del día (para la vista previa del inicio).
  useEffect(() => {
    game.cargarPuzzle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const irInicio = () => {
    game.pausar();
    setPantalla('home');
  };

  const irRanking = () => {
    game.pausar();
    ranking.cargar();
    setPantalla('ranking');
  };

  const jugar = () => {
    game.iniciarPartida();
    setPantalla('game');
  };

  const verRankingTrasGuardar = async () => {
    const ok = await game.guardarResultado();
    if (ok) irRanking();
  };

  switch (pantalla) {
    case 'game':
      return (
        <Game
          puzzle={game.puzzle}
          partida={game.partida}
          faltantes={game.faltantes}
          mensaje={game.mensaje}
          onSeleccionar={game.seleccionar}
          onMover={game.mover}
          onNumero={game.ingresarNumero}
          onBorrar={game.borrar}
          onNotas={game.alternarNotas}
          onPausa={game.alternarPausa}
          onRevisar={game.revisar}
          onInicio={irInicio}
        />
      );
    case 'result':
      return (
        <Result
          puzzle={game.puzzle}
          partida={game.partida}
          puesto={game.puesto}
          guardando={game.guardando}
          error={game.error}
          onElegirTecnica={game.elegirTecnica}
          onVerRanking={verRankingTrasGuardar}
          onInicio={irInicio}
        />
      );
    case 'ranking':
      return <Ranking puzzle={game.puzzle} ranking={ranking} onInicio={irInicio} />;
    default:
      return (
        <Home
          puzzle={game.puzzle}
          cargando={game.cargando}
          error={game.error}
          onJugar={jugar}
          onVerRanking={irRanking}
          onReintentar={() => game.cargarPuzzle()}
        />
      );
  }
}
