from dataclasses import dataclass

from core.models.types.difficulty import Difficulty


@dataclass
class Puzzle:
    date: str
    difficulty: Difficulty
    initial_grid: list[list[int]]
    solution_grid: list[list[int]]
    trials: int
