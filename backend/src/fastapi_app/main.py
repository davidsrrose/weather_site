from fastapi import FastAPI

from fastapi_app.routes import router as routes_router
from config import get_settings
from fastapi_app.services.duckdb import ensure_duckdb_parent_dir

app = FastAPI(title="Weather Site Backend")
app.include_router(routes_router, prefix="/api")


@app.on_event("startup")
def on_startup() -> None:
    settings = get_settings()
    ensure_duckdb_parent_dir(settings.duckdb_path)
