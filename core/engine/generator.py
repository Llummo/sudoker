import hashlib
from random import Random

from core.engine.difficulty_grader import DifficultyGrader
from core.engine.solver import Solver
from core.models.entities.board import Board
from core.models.entities.cell import Cell
from core.models.entities.region import Region
from core.models.entities.puzzle import Puzzle
from core.models.types.difficulty import Difficulty
from core.models.types.region_type import RegionType


class Generator:

    def __init__(self, solver: Solver, grader: DifficultyGrader, max_attempts: int = 10):
        self._solver = solver
        self._grader = grader
        self._max_attempts = max_attempts

    def generate_daily(self, date: str, target: Difficulty) -> Puzzle:
        backup: Puzzle | None = None
        backup_distance: int | None = None

        for attempt in range(self._max_attempts):
            seed = self._compute_seed(date, attempt)
            rng = Random(seed)  

            board = self._build_full_board(rng)
            solution_grid = board.to_matrix()

            self._carve_holes(board, rng)
            initial_grid = board.to_matrix()   

            result = self._solver.solve(board.clone(), max_solutions=1)
            trials = result.trials_count

            puzzle = Puzzle(
                date=date,
                difficulty=target,
                initial_grid=initial_grid,
                solution_grid=solution_grid,
                trials=trials,
            )

            distance = self._grader.distance(trials, target)
            if backup_distance is None or distance < backup_distance:
                backup = puzzle
                backup_distance = distance

            if self._grader.evaluate(trials) == target:
                return puzzle

        return backup

    def _compute_seed(self, date: str, attempt: int) -> int:
        text = f"{date}#{attempt}".encode("utf-8")
        digest = hashlib.sha256(text).hexdigest()
        return int(digest[:16], 16)  

    def _build_empty_board(self) -> Board:
        grid = [[Cell(row, col) for col in range(9)] for row in range(9)]

        regions = []
        for row in range(9):
            regions.append(Region(RegionType.ROW, [grid[row][col] for col in range(9)]))
        for col in range(9):
            regions.append(Region(RegionType.COL, [grid[row][col] for row in range(9)]))
        for box_row in (0, 3, 6):
            for box_col in (0, 3, 6):
                box_cells = [
                    grid[r][c]
                    for r in range(box_row, box_row + 3)
                    for c in range(box_col, box_col + 3)
                ]
                regions.append(Region(RegionType.BOX, box_cells))

        return Board(grid, regions)

    def _build_full_board(self, rng: Random) -> Board:
        board = self._build_empty_board()

        def fill() -> bool:
            empty_cells = board.get_empty_cells()
            if not empty_cells:          
                return True

            best_cell, best_candidates = None, None
            for cell in empty_cells:
                candidates = board.get_candidates(cell)
                if not candidates:       
                    return False
                if best_candidates is None or len(candidates) < len(best_candidates):
                    best_cell, best_candidates = cell, candidates

            options = sorted(best_candidates)
            rng.shuffle(options)
            for value in options:
                best_cell.value = value 
                if fill():
                    return True
                best_cell.clear()        
            return False

        fill()  
        return board

    def _carve_holes(self, board: Board, rng: Random) -> None:

        cells = [board.get_cell(r, c) for r in range(9) for c in range(9)]
        rng.shuffle(cells)

        for cell in cells:
            removed_value = cell.value
            cell.clear()

            result = self._solver.solve(board.clone(), max_solutions=2)

            if result.solutions_count != 1:
                cell.value = removed_value  

        for row in board.grid:
            for cell in row:
                cell.is_fixed = not cell.is_empty()
