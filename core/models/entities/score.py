from dataclasses import dataclass

from core.models.types.difficulty import Difficulty
from core.models.types.technique import Technique


@dataclass
class Score:
    player_id: str
    username: str
    puzzle_date: str
    difficulty: Difficulty
    time_seconds: int
    technique: Technique | None = None
    id: int | None = None
    position: int | None = None
