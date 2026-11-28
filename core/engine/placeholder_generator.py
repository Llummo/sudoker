"""Generador TEMPORAL para probar la conexión frontend <-> backend.

No usa Solver ni DifficultyGrader (aún en desarrollo): parte de un Sudoku con
solución única conocida y lo transforma de forma determinista según la fecha.
Las transformaciones usadas (re-etiquetar dígitos, permutar bandas/columnas de
cajas, permutar filas/columnas dentro de cada banda y transponer) conservan la
unicidad de la solución.

La dificultad NO se calcula: se devuelve la que se pide (valor hardcodeado).
Se elimina cuando el Generator real esté listo (ver PUZZLE_ENGINE en el README).
"""

import hashlib
from random import Random

from core.models.entities.puzzle import Puzzle
from core.models.types.difficulty import Difficulty

_BASE_PUZZLE = (
    "530070000"
    "600195000"
    "098000060"
    "800060003"
    "400803001"
    "700020006"
    "060000280"
    "000419005"
    "000080079"
)

_BASE_SOLUTION = (
    "534678912"
    "672195348"
    "198342567"
    "859761423"
    "426853791"
    "713924856"
    "961537284"
    "287419635"
    "345286179"
)


def _to_matrix(digits: str) -> list[list[int]]:
    return [[int(digits[row * 9 + col]) for col in range(9)] for row in range(9)]


def _line_order(rng: Random) -> list[int]:
    bands = [0, 1, 2]
    rng.shuffle(bands)
    order = []
    for band in bands:
        lines = [band * 3, band * 3 + 1, band * 3 + 2]
        rng.shuffle(lines)
        order.extend(lines)
    return order


class PlaceholderGenerator:

    def generate_daily(self, date: str, target: Difficulty) -> Puzzle:
        rng = Random(self._compute_seed(date))

        digits = list(range(1, 10))
        rng.shuffle(digits)
        relabel = {0: 0, **{original: new for original, new in zip(range(1, 10), digits)}}
        rows = _line_order(rng)
        cols = _line_order(rng)
        transpose = rng.random() < 0.5

        def transform(grid: list[list[int]]) -> list[list[int]]:
            result = [[relabel[grid[r][c]] for c in cols] for r in rows]
            if transpose:
                result = [list(line) for line in zip(*result)]
            return result

        return Puzzle(
            date=date,
            difficulty=target,
            initial_grid=transform(_to_matrix(_BASE_PUZZLE)),
            solution_grid=transform(_to_matrix(_BASE_SOLUTION)),
            trials=0,
        )

    def _compute_seed(self, date: str) -> int:
        digest = hashlib.sha256(f"placeholder#{date}".encode("utf-8")).hexdigest()
        return int(digest[:16], 16)
