from enum import Enum

class Difficulty(str, Enum):
    HARD = "HARD"
    MEDIUM = "MEDIUM"
    EASY = "EASY"


    @classmethod
    def from_rating(cls, rating : float) -> "Difficulty":
        if rating < 1.5:
            return cls.EASY
        elif rating < 3.5 and rating >= 1.5:
            return cls.MEDIUM
        else:
            return cls.HARD
