from enum import Enum

class RegionType(str, Enum):
    ROW = "ROW"
    COL = "COL"
    BOX = "BOX"
