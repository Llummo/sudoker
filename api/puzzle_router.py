import os
from datetime import date as Date
from functools import lru_cache

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from core.models.entities.puzzle import Puzzle
from core.models.types.difficulty import Difficulty
from core.services.daily_puzzle_service import DailyPuzzleService, PuzzleGenerator
from infrastructure.puzzle_repository import PostgresPuzzleRepository


class PuzzleResponse(BaseModel):
    date: str
    difficulty: Difficulty
    initial_grid: list[list[int]]
    solution_grid: list[list[int]]
    trials: int

    @classmethod
    def from_entity(cls, puzzle: Puzzle) -> "PuzzleResponse":
        return cls(
            date=puzzle.date,
            difficulty=puzzle.difficulty,
            initial_grid=puzzle.initial_grid,
            solution_grid=puzzle.solution_grid,
            trials=puzzle.trials,
        )


def build_generator() -> PuzzleGenerator:
    # PUZZLE_ENGINE=placeholder (por defecto) mientras Solver y DifficultyGrader
    # están en desarrollo. Con PUZZLE_ENGINE=real se usa el Generator del engine.
    # Los imports van aquí dentro para que el engine incompleto no rompa el arranque.
    if os.environ.get("PUZZLE_ENGINE", "placeholder").lower() == "real":
        from core.engine.difficulty_grader import DifficultyGrader
        from core.engine.generator import Generator
        from core.engine.solver import Solver

        return Generator(Solver(), DifficultyGrader())

    from core.engine.placeholder_generator import PlaceholderGenerator

    return PlaceholderGenerator()


@lru_cache
def get_puzzle_service() -> DailyPuzzleService:
    generator = build_generator()
    repository = PostgresPuzzleRepository()
    return DailyPuzzleService(generator, repository)


router = APIRouter(prefix="/puzzles", tags=["puzzles"])


@router.get("/daily", response_model=PuzzleResponse)
def get_today_puzzle(
    difficulty: Difficulty = Query(Difficulty.MEDIUM),
    service: DailyPuzzleService = Depends(get_puzzle_service),
) -> PuzzleResponse:
    puzzle = service.get_daily_puzzle(Date.today().isoformat(), difficulty)
    return PuzzleResponse.from_entity(puzzle)


@router.get("/{puzzle_date}", response_model=PuzzleResponse)
def get_puzzle_by_date(
    puzzle_date: Date,
    difficulty: Difficulty = Query(Difficulty.MEDIUM),
    service: DailyPuzzleService = Depends(get_puzzle_service),
) -> PuzzleResponse:
    puzzle = service.get_daily_puzzle(puzzle_date.isoformat(), difficulty)
    return PuzzleResponse.from_entity(puzzle)
