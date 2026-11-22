

class Cell:
    def __init__(self):
        pass


    value : int = 0
    row : int
    col : int
    is_fixed : bool = False


    def is_empty(self) -> bool:
        return self.value == 0

    def clear(self) -> None:
        self.value = 0

