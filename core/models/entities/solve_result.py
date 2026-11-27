from dataclasses import dataclass


@dataclass
class SolveResult:
    solutions_count : int
    trials_count : int
    solutions_list : list[list[int]] | None
