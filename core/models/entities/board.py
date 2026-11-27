

from dataclasses import dataclass
from re import sub

from core.models.entities.cell import Cell
from core.models.entities.region import Region
from core.models.types.region_type import RegionType


@dataclass
class Board:
    # Grid = matrix, list of a list yk :V
    grid: list[list[Cell]]
    regions: list[Region]


    # Returns an specific cell, if it wasn't obvious already
    def get_cell(self, x:int, y: int) -> Cell:
        return self.grid[x][y]


    # Returns empty cells
    def get_empty_cells(self) -> list:
        empty_cells = []
        for row in self.grid:
            for cell in row:
                if cell.is_empty():
                    empty_cells.append(cell)

        return empty_cells
        


    #Checks for existing values in each region
    def get_candidates(self, cell : Cell) -> set:
        used = set()
        all_nums = {1, 2, 3, 4, 5, 6, 7, 8, 9}
        for region in self.regions:
            if cell in region.cells:
                used.update(region.get_values())

        return all_nums - used



    # Checks for unsolved cells that are neighbors of a specific cells
    def get_affected_empty_count(self, c : Cell) -> int:
        affected_cells = set()
        for region in self.regions:
            if c in region.cells:
                for cell in region.cells:
                    if cell.is_empty() and cell != c:
                        """
                            catches the affected cell inside a set, bc if I sum +1, if a cell is at the same time in the same row and col
                            it would duplicate

                        """
                        affected_cells.add((cell.row, cell.col))
        return len(affected_cells)



    def is_complete(self) -> bool:
        return len(self.get_empty_cells())  == 0


    # Returns converts the grid into an integer matrix
    def to_matrix(self) -> list[list[int]]:
        converted = []
        obtained = []
        for row in self.grid:
            for cell in row:
                obtained.append(cell.value)

            converted.append(obtained.copy())
            obtained.clear()

        return converted

    # Clones the current board
    def clone(self) -> Board:
        new_grid =[]
        new_regions = []
        for row in self.grid:
            row_temp = []
            for cell in row:
                row_temp.append(Cell(cell.row, cell.col, cell.is_fixed, cell.value))
                
            new_grid.append(row_temp.copy())
            row_temp.clear()

        for row in range(9):
            row_cells = []
            for col in range(9):
                row_cells.append(new_grid[row][col])
            new_regions.append(Region(RegionType.ROW, row_cells))

        for col in range(9):
            col_cells = []
            for row in range(9):
                col_cells.append(new_grid[row][col])
            new_regions.append(Region(RegionType.COL, col_cells))
        # iterate through each box
        """
            basically boxes normally start at (0,0), (0, 3), (0, 6), and consecutively.
            Just follow the count for each 3 rows, and you will notice, next would be (3,0), (3, 3), etc

        """
        for box_row in (0, 3, 6):
            for box_col in (0, 3, 6):
                box_cells = []
                for r in range(box_row, box_row + 3):
                    for c in range(box_col, box_col + 3):
                        box_cells.append( new_grid[r][c])
                new_regions.append(Region(RegionType.BOX, box_cells))
                                   
        return Board(new_grid, new_regions)

