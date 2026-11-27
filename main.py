from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.puzzle_router import router as puzzle_router
from api.ranking_router import router as ranking_router

app = FastAPI(title="Sudoker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["*"],
)

app.include_router(puzzle_router)
app.include_router(ranking_router)
