
from dataclasses import dataclass

@dataclass
class Cell:
    def __init__(self):
        pass


    row : int
    col : int
    is_fixed : bool = False
    value : int = 0


    def is_empty(self) -> bool:
        return self.value == 0

    def clear(self) -> None:
        self.value = 0

