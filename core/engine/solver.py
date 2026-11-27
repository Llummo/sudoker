

from core.models.entities.board import Board
from core.models.entities.cell import Cell


class Solver:
    def __init__(self, board : Board):
        self.board = board
    _board : Board


    def _select_best_cell(self, board: Board) -> Cell | None:
        best_cell = None
        fewest_candidates =10
        most_neighbors = -1

        empty_cells = board.get_empty_cells()

        if (len(empty_cells) == 0):
            return None

        for cell in empty_cells:

            candidates = board.get_candidates(cell)

            empty_neighbor_count = board.get_affected_empty_count(cell)
            if (len(candidates) == 0):
                return cell
            
            
            if (len(candidates) < fewest_candidates): 
                best_cell = cell
                fewest_candidates = len(candidates)
                most_neighbors = empty_neighbor_count

                    
            elif empty_neighbor_count > most_neighbors and len(candidates) == fewest_candidates: 
                best_cell = cell
                most_neighbors = empty_neighbor_count
        return best_cell

        
