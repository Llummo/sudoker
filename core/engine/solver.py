

from core.models.entities.board import Board
from core.models.entities.cell import Cell


class Solver: 
    def __init__(self) -> None:
        self._solutions : int = 0
        self._trials : int = 0
        self._max_solutions : int = 2
        self._solution : list[list[int]] | None = None 
    _solutions: int #Counts how many solutions there are
    _trials : int # Counts the amount of times the solver has attempted to get a solution 
    _max_solutions : int # Determines the maximum amount of solutions
    _solution : list[list[int]] | None # Saves a snapshot of the first valid solution


    def _solve(self, board: Board, max_solutions: int = 2) -> tuple[int, list[list[int]] | None, int]: 
        #backtrack affects self. variables:
        """
            If we dont reset them here, the problem is that when we want to solve another puzzle,
            the values present in self. will already have some defaults and in the next puzzle, there
            would be errors in the algorithm. Therefore, everytime something has to be solved, it's required to
            restart the values
        """
        self._solutions = 0
        self._trials = 0
        self._max_solutions = max_solutions
        self._solution = None

        working_board = board.clone()
        self._backtrack(working_board)
        return self._solutions, self._solution, self._trials

    def _backtrack(self, board: Board) -> None:
        if self._solutions >= self._max_solutions:
            return
        cell = self._select_best_cell(board)
        if cell is None:
            # If cell is empty, that means one solution was found
            self._solutions += 1

            # If we found 1 solution
            if self._solutions == 1:
            #Save a snapshot of it
                self._solution = board.to_matrix()
            return

        # Get all legal moves
        candidates = board.get_candidates(cell)

        # If candidates is 0, branch is a dead end
        if len(candidates) == 0:
            return

        # Backtrack section

        # Helps to loop over candidates in a more controlled way:
        """
            Candidates is a set(), iteration over a set is random, so
            if we dont use sorted, the randomness regarding the navigation of the
            candidates set could be too unstable, leading to unprecise results.
        """
        for digit in sorted(candidates):
            # Same condition as before, found 2 or more solutions, break
            if self._solutions >= self._max_solutions:
                break

            cell.value = digit # Try a guess with a number =
            
            self._trials += 1 # Record the attempt
            
            self._backtrack(board) # Pass the modified board to the next backtracking iteration
            
            cell.value = 0 # Erase our guess before trying the next digit, its just like clearing the value



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

        
