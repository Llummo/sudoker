from core.models.entities.ranking import Ranking
from core.models.entities.score import Score
from core.models.types.difficulty import Difficulty
from core.models.types.technique import Technique
from infrastructure.puzzle_repository import PuzzleRepository
from infrastructure.score_repository import ScoreRepository


class RankingError(Exception):
    pass


class PuzzleNotFoundError(RankingError):
    pass


class InvalidSolutionError(RankingError):
    pass


class ScoreAlreadyExistsError(RankingError):
    pass


class ScoreNotFoundError(RankingError):
    pass


class RankingService:

    MIN_TIME_SECONDS = 30
    TOP_LIMIT = 12

    def __init__(self, score_repository: ScoreRepository, puzzle_repository: PuzzleRepository):
        self._scores = score_repository
        self._puzzles = puzzle_repository

    def submit_score(
        self,
        puzzle_date: str,
        difficulty: Difficulty,
        player_id: str,
        username: str,
        time_seconds: int,
        grid: list[list[int]],
    ) -> Score:
        puzzle = self._puzzles.find_by_date_and_difficulty(puzzle_date, difficulty)
        if puzzle is None:
            raise PuzzleNotFoundError("No existe un puzzle para esa fecha y dificultad")

        if grid != puzzle.solution_grid:
            raise InvalidSolutionError("La grilla enviada no coincide con la solución")

        if time_seconds < self.MIN_TIME_SECONDS:
            raise InvalidSolutionError("Tiempo de resolución inválido")

        if self._scores.find_by_player(puzzle_date, difficulty, player_id) is not None:
            raise ScoreAlreadyExistsError("El jugador ya registró un tiempo para este puzzle")

        score = Score(
            player_id=player_id,
            username=username.strip(),
            puzzle_date=puzzle_date,
            difficulty=difficulty,
            time_seconds=time_seconds,
        )
        return self._scores.save(score)

    def set_technique(self, puzzle_date: str, score_id: int, player_id: str, technique: Technique) -> Score:
        score = self._scores.update_technique(score_id, player_id, puzzle_date, technique)
        if score is None:
            raise ScoreNotFoundError("No existe ese registro para el jugador")
        return score

    def get_ranking(
        self,
        puzzle_date: str,
        difficulty: Difficulty,
        technique: Technique | None = None,
        player_id: str | None = None,
    ) -> Ranking:
        player_score = None
        if player_id is not None:
            player_score = self._scores.find_by_player(puzzle_date, difficulty, player_id)

        return Ranking(
            puzzle_date=puzzle_date,
            difficulty=difficulty,
            entries=self._scores.find_top(puzzle_date, difficulty, technique, self.TOP_LIMIT),
            total_players=self._scores.count_players(puzzle_date, difficulty),
            best_time=self._scores.best_time(puzzle_date, difficulty),
            player_score=player_score,
            technique_counts=self._scores.count_by_technique(puzzle_date, difficulty),
        )
