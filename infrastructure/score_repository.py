import os
from abc import ABC, abstractmethod

import psycopg

from core.models.entities.score import Score
from core.models.types.difficulty import Difficulty
from core.models.types.technique import Technique


class ScoreRepository(ABC):

    @abstractmethod
    def save(self, score: Score) -> Score:
        ...

    @abstractmethod
    def update_technique(self, score_id: int, player_id: str, puzzle_date: str, technique: Technique) -> Score | None:
        ...

    @abstractmethod
    def find_by_player(self, puzzle_date: str, difficulty: Difficulty, player_id: str) -> Score | None:
        ...

    @abstractmethod
    def find_top(self, puzzle_date: str, difficulty: Difficulty, technique: Technique | None, limit: int) -> list[Score]:
        ...

    @abstractmethod
    def count_by_technique(self, puzzle_date: str, difficulty: Difficulty) -> dict[Technique, int]:
        ...

    @abstractmethod
    def count_players(self, puzzle_date: str, difficulty: Difficulty) -> int:
        ...

    @abstractmethod
    def best_time(self, puzzle_date: str, difficulty: Difficulty) -> int | None:
        ...


class PostgresScoreRepository(ScoreRepository):

    _CREATE_TABLE = """
        CREATE TABLE IF NOT EXISTS scores (
            id           SERIAL      PRIMARY KEY,
            player_id    VARCHAR(64) NOT NULL,
            username     VARCHAR(30) NOT NULL,
            puzzle_date  DATE        NOT NULL,
            difficulty   VARCHAR(10) NOT NULL,
            time_seconds INTEGER     NOT NULL CHECK (time_seconds > 0),
            technique    VARCHAR(20),
            created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (puzzle_date, difficulty, player_id)
        )
    """

    _RANKED = """
        WITH ranked AS (
            SELECT id, player_id, username, puzzle_date::text AS puzzle_date, difficulty,
                   time_seconds, technique, created_at,
                   RANK() OVER (ORDER BY time_seconds) AS position
            FROM scores
            WHERE puzzle_date = %(date)s AND difficulty = %(difficulty)s
        )
        SELECT id, player_id, username, puzzle_date, difficulty, time_seconds, technique, position
        FROM ranked
    """

    def __init__(self, dsn: str | None = None):
        self._dsn = dsn or os.environ["DATABASE_URL"]
        self._create_table()

    def _connect(self) -> psycopg.Connection:
        return psycopg.connect(self._dsn)

    def _create_table(self) -> None:
        with self._connect() as conn:
            conn.execute(self._CREATE_TABLE)

    @staticmethod
    def _to_score(row) -> Score:
        return Score(
            id=row[0],
            player_id=row[1],
            username=row[2],
            puzzle_date=row[3],
            difficulty=Difficulty(row[4]),
            time_seconds=row[5],
            technique=Technique(row[6]) if row[6] is not None else None,
            position=row[7],
        )

    def save(self, score: Score) -> Score:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO scores (player_id, username, puzzle_date, difficulty, time_seconds, technique)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    score.player_id,
                    score.username,
                    score.puzzle_date,
                    score.difficulty.value,
                    score.time_seconds,
                    score.technique.value if score.technique else None,
                ),
            )
        return self.find_by_player(score.puzzle_date, score.difficulty, score.player_id)

    def update_technique(self, score_id: int, player_id: str, puzzle_date: str, technique: Technique) -> Score | None:
        with self._connect() as conn:
            row = conn.execute(
                """
                UPDATE scores
                SET technique = %s
                WHERE id = %s AND player_id = %s AND puzzle_date = %s
                RETURNING difficulty
                """,
                (technique.value, score_id, player_id, puzzle_date),
            ).fetchone()

        if row is None:
            return None
        return self.find_by_player(puzzle_date, Difficulty(row[0]), player_id)

    def find_by_player(self, puzzle_date: str, difficulty: Difficulty, player_id: str) -> Score | None:
        with self._connect() as conn:
            row = conn.execute(
                self._RANKED + " WHERE player_id = %(player_id)s",
                {"date": puzzle_date, "difficulty": difficulty.value, "player_id": player_id},
            ).fetchone()
        return self._to_score(row) if row else None

    def find_top(self, puzzle_date: str, difficulty: Difficulty, technique: Technique | None, limit: int) -> list[Score]:
        query = self._RANKED
        params = {"date": puzzle_date, "difficulty": difficulty.value, "limit": limit}
        if technique is not None:
            query += " WHERE technique = %(technique)s"
            params["technique"] = technique.value
        query += " ORDER BY position, created_at LIMIT %(limit)s"

        with self._connect() as conn:
            rows = conn.execute(query, params).fetchall()
        return [self._to_score(row) for row in rows]

    def count_by_technique(self, puzzle_date: str, difficulty: Difficulty) -> dict[Technique, int]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT technique, COUNT(*)
                FROM scores
                WHERE puzzle_date = %s AND difficulty = %s AND technique IS NOT NULL
                GROUP BY technique
                """,
                (puzzle_date, difficulty.value),
            ).fetchall()

        counts = {technique: 0 for technique in Technique}
        for technique, total in rows:
            counts[Technique(technique)] = total
        return counts

    def count_players(self, puzzle_date: str, difficulty: Difficulty) -> int:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT COUNT(*) FROM scores WHERE puzzle_date = %s AND difficulty = %s",
                (puzzle_date, difficulty.value),
            ).fetchone()
        return row[0]

    def best_time(self, puzzle_date: str, difficulty: Difficulty) -> int | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT MIN(time_seconds) FROM scores WHERE puzzle_date = %s AND difficulty = %s",
                (puzzle_date, difficulty.value),
            ).fetchone()
        return row[0]
