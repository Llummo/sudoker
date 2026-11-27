import os
from abc import ABC, abstractmethod

import psycopg
from psycopg.types.json import Jsonb

from core.models.entities.puzzle import Puzzle
from core.models.types.difficulty import Difficulty


class PuzzleRepository(ABC):

    @abstractmethod
    def find_by_date_and_difficulty(self, date: str, difficulty: Difficulty) -> Puzzle | None:
        ...

    @abstractmethod
    def save(self, puzzle: Puzzle) -> None:
        ...


class PostgresPuzzleRepository(PuzzleRepository):

    _CREATE_TABLE = """
        CREATE TABLE IF NOT EXISTS puzzles (
            puzzle_date   DATE        NOT NULL,
            difficulty    VARCHAR(10) NOT NULL,
            initial_grid  JSONB       NOT NULL,
            solution_grid JSONB       NOT NULL,
            trials        INTEGER     NOT NULL,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (puzzle_date, difficulty)
        )
    """

    def __init__(self, dsn: str | None = None):
        self._dsn = dsn or os.environ["DATABASE_URL"]
        self._create_table()

    def _connect(self) -> psycopg.Connection:
        return psycopg.connect(self._dsn)

    def _create_table(self) -> None:
        with self._connect() as conn:
            conn.execute(self._CREATE_TABLE)

    def find_by_date_and_difficulty(self, date: str, difficulty: Difficulty) -> Puzzle | None:
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT puzzle_date::text, difficulty, initial_grid, solution_grid, trials
                FROM puzzles
                WHERE puzzle_date = %s AND difficulty = %s
                """,
                (date, difficulty.value),
            ).fetchone()

        if row is None:
            return None

        return Puzzle(
            date=row[0],
            difficulty=Difficulty(row[1]),
            initial_grid=row[2],
            solution_grid=row[3],
            trials=row[4],
        )

    def save(self, puzzle: Puzzle) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO puzzles (puzzle_date, difficulty, initial_grid, solution_grid, trials)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (puzzle_date, difficulty) DO NOTHING
                """,
                (
                    puzzle.date,
                    puzzle.difficulty.value,
                    Jsonb(puzzle.initial_grid),
                    Jsonb(puzzle.solution_grid),
                    puzzle.trials,
                ),
            )
