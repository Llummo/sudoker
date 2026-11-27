from core.engine.solver import Solver
from core.models.entities.board import Board
from core.models.entities.cell import Cell
from core.models.entities.region import Region
from core.models.types.region_type import RegionType


def build_board(matrix: list[list[int]]) -> Board:
    grid = []
    regions = []

    for r in range(9):
        row_cells = []
        for c in range(9):
            val = matrix[r][c]
            cell = Cell(r, c, val != 0, val)
            row_cells.append(cell)
        grid.append(row_cells)


    for r in range(9):
        row_cells = []
        for c in range(9):
            row_cells.append(grid[r][c])
        regions.append(Region(RegionType.ROW, row_cells))

    for c in range(9):
        col_cells = []
        for r in range(9):
            col_cells.append(grid[r][c])
        regions.append(Region(RegionType.COL, col_cells))


    for box_row in (0, 3, 6):
        for box_col in (0, 3, 6):
            box_cells = []
            for r in range(box_row, box_row + 3):
                for c in range(box_col, box_col + 3):
                    box_cells.append(grid[r][c])
            regions.append(Region(RegionType.BOX, box_cells))

    return Board(grid, regions)

def test_select_best_cell_when_board_is_complete():

    solved_matrix = [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ]

    board = build_board(solved_matrix)
    solver = Solver()
    best_cell = solver._select_best_cell(board)

    if best_cell is not None:
        print(best_cell.value)
    else:
        print("none?")


if __name__ == "__main__":
    test_select_best_cell_when_board_is_complete()
    print("passed")
