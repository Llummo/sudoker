from core.engine.generator import Generator
from core.models.entities.puzzle import Puzzle
from core.models.types.difficulty import Difficulty
from infrastructure.puzzle_repository import PuzzleRepository


class DailyPuzzleService:

    def __init__(self, generator: Generator, repository: PuzzleRepository):
        self._generator = generator
        self._repository = repository

    def get_daily_puzzle(self, date: str, difficulty: Difficulty) -> Puzzle:
        cached = self._repository.find_by_date_and_difficulty(date, difficulty)
        if cached is not None:
            return cached

        puzzle = self._generator.generate_daily(date, difficulty)
        self._repository.save(puzzle)
        return puzzle
