from fastapi import FastAPI

from app.api import router as api_router
from config import get_settings
from app.core.duckdb import ensure_duckdb_parent_dir

app = FastAPI(title="Weather Site Backend")
app.include_router(api_router, prefix="/api")


@app.on_event("startup")
def on_startup() -> None:
    settings = get_settings()
    ensure_duckdb_parent_dir(settings.weather_duckdb_path)
