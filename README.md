# sudoker

API de Sudoker (FastAPI + PostgreSQL).

## Levantar en local

1. Base de datos (requiere Docker):

   ```bash
   docker compose up -d db
   ```

2. Variables de entorno:

   ```bash
   cp .env.example .env
   ```

3. Dependencias y servidor:

   ```bash
   python -m venv .venv
   .venv\Scripts\activate        # Windows  (Linux/macOS: source .venv/bin/activate)
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

   Documentación interactiva: http://localhost:8000/docs

## Motor de puzzles (`PUZZLE_ENGINE`)

| Valor                   | Qué usa                                                                 |
|-------------------------|-------------------------------------------------------------------------|
| `placeholder` (defecto) | `core/engine/placeholder_generator.py`: puzzle de solución única, determinista por fecha, con la dificultad pedida (hardcodeada, no se calcula). |
| `real`                  | `Generator` con `Solver` y `DifficultyGrader`.                           |

`placeholder` existe solo para probar la conexión con el frontend mientras el
`Solver` y el `DifficultyGrader` se terminan. Los puzzles se guardan en la tabla
`puzzles`, así que al cambiar a `real` hay que borrar los del día generados con
el placeholder:

```sql
DELETE FROM puzzles WHERE puzzle_date = CURRENT_DATE;
```

## Endpoints

| Método | Ruta                                       | Uso                                   |
|--------|--------------------------------------------|---------------------------------------|
| GET    | `/puzzles/daily?difficulty=MEDIUM`         | Puzzle de hoy                         |
| GET    | `/puzzles/{fecha}?difficulty=MEDIUM`       | Puzzle de una fecha (`YYYY-MM-DD`)    |
| POST   | `/rankings/{fecha}/scores`                 | Registrar tiempo (valida la grilla)   |
| PATCH  | `/rankings/{fecha}/scores/{id}`            | Guardar la técnica usada              |
| GET    | `/rankings/{fecha}?difficulty=&technique=&player_id=` | Ranking del día            |
