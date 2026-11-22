
from dataclasses import dataclass

@dataclass
class Cell:

    row : int
    col : int
    is_fixed : bool = False
    value : int = 0


    def is_empty(self) -> bool:
        return self.value == 0

    def clear(self) -> None:
        self.value = 0

