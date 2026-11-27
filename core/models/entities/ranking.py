from dataclasses import dataclass, field

from core.models.entities.score import Score
from core.models.types.difficulty import Difficulty
from core.models.types.technique import Technique


@dataclass
class Ranking:
    puzzle_date: str
    difficulty: Difficulty
    entries: list[Score]
    total_players: int
    best_time: int | None
    player_score: Score | None
    technique_counts: dict[Technique, int] = field(default_factory=dict)
