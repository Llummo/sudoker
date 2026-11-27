from datetime import date as Date
from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from core.models.entities.ranking import Ranking
from core.models.entities.score import Score
from core.models.types.difficulty import Difficulty
from core.models.types.technique import Technique
from core.services.ranking_service import (
    InvalidSolutionError,
    PuzzleNotFoundError,
    RankingService,
    ScoreAlreadyExistsError,
    ScoreNotFoundError,
)
from infrastructure.puzzle_repository import PostgresPuzzleRepository
from infrastructure.score_repository import PostgresScoreRepository


class ScoreRequest(BaseModel):
    player_id: str = Field(min_length=1, max_length=64)
    username: str = Field(min_length=1, max_length=30)
    difficulty: Difficulty
    time_seconds: int = Field(gt=0)
    grid: list[list[int]]


class TechniqueRequest(BaseModel):
    player_id: str = Field(min_length=1, max_length=64)
    technique: Technique


class ScoreResponse(BaseModel):
    id: int
    username: str
    puzzle_date: str
    difficulty: Difficulty
    time_seconds: int
    technique: Technique | None
    position: int

    @classmethod
    def from_entity(cls, score: Score) -> "ScoreResponse":
        return cls(
            id=score.id,
            username=score.username,
            puzzle_date=score.puzzle_date,
            difficulty=score.difficulty,
            time_seconds=score.time_seconds,
            technique=score.technique,
            position=score.position,
        )


class RankingEntryResponse(BaseModel):
    position: int
    username: str
    time_seconds: int
    technique: Technique | None
    is_me: bool


class RankingResponse(BaseModel):
    date: str
    difficulty: Difficulty
    total_players: int
    best_time: int | None
    my_position: int | None
    my_time: int | None
    technique_counts: dict[Technique, int]
    entries: list[RankingEntryResponse]

    @classmethod
    def from_entity(cls, ranking: Ranking, player_id: str | None) -> "RankingResponse":
        me = ranking.player_score
        return cls(
            date=ranking.puzzle_date,
            difficulty=ranking.difficulty,
            total_players=ranking.total_players,
            best_time=ranking.best_time,
            my_position=me.position if me else None,
            my_time=me.time_seconds if me else None,
            technique_counts=ranking.technique_counts,
            entries=[
                RankingEntryResponse(
                    position=entry.position,
                    username=entry.username,
                    time_seconds=entry.time_seconds,
                    technique=entry.technique,
                    is_me=player_id is not None and entry.player_id == player_id,
                )
                for entry in ranking.entries
            ],
        )


@lru_cache
def get_ranking_service() -> RankingService:
    return RankingService(PostgresScoreRepository(), PostgresPuzzleRepository())


router = APIRouter(prefix="/rankings", tags=["rankings"])


@router.post("/{puzzle_date}/scores", response_model=ScoreResponse, status_code=status.HTTP_201_CREATED)
def submit_score(
    puzzle_date: Date,
    body: ScoreRequest,
    service: RankingService = Depends(get_ranking_service),
) -> ScoreResponse:
    try:
        score = service.submit_score(
            puzzle_date.isoformat(),
            body.difficulty,
            body.player_id,
            body.username,
            body.time_seconds,
            body.grid,
        )
    except PuzzleNotFoundError as error:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(error))
    except InvalidSolutionError as error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(error))
    except ScoreAlreadyExistsError as error:
        raise HTTPException(status.HTTP_409_CONFLICT, str(error))
    return ScoreResponse.from_entity(score)


@router.patch("/{puzzle_date}/scores/{score_id}", response_model=ScoreResponse)
def set_technique(
    puzzle_date: Date,
    score_id: int,
    body: TechniqueRequest,
    service: RankingService = Depends(get_ranking_service),
) -> ScoreResponse:
    try:
        score = service.set_technique(puzzle_date.isoformat(), score_id, body.player_id, body.technique)
    except ScoreNotFoundError as error:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(error))
    return ScoreResponse.from_entity(score)


@router.get("/{puzzle_date}", response_model=RankingResponse)
def get_ranking(
    puzzle_date: Date,
    difficulty: Difficulty = Query(Difficulty.MEDIUM),
    technique: Technique | None = Query(None),
    player_id: str | None = Query(None, max_length=64),
    service: RankingService = Depends(get_ranking_service),
) -> RankingResponse:
    ranking = service.get_ranking(puzzle_date.isoformat(), difficulty, technique, player_id)
    return RankingResponse.from_entity(ranking, player_id)
