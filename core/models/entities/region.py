
from dataclasses import dataclass
from core.models.entities import cell
from core.models.entities.cell import Cell
from core.models.types.region_type import RegionType

@dataclass
class Region:
    region_type : RegionType
    index : int
    cells: list[Cell]

    def get_values(self) -> set[int]:
        return {cell.value for cell in self.cells if not cell.is_empty()}

    def contains(self, value: int) -> bool:
        return value in self.get_values()


    def empty_count(self):
        count = 0
        for cell in self.cells:
            if cell.is_empty() != 0:
                count += 1
        return count

