import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError

BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")


class Config(BaseModel):
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    frontend_port: int = 5173
    duckdb_path: str = ".data/weather.duckdb"
    zipcodestack_api_key: str = Field(min_length=1)


@lru_cache(maxsize=1)
def get_settings() -> Config:
    raw_config = {
        "zipcodestack_api_key": os.getenv("ZIPCODESTACK_API_KEY", ""),
    }
    try:
        return Config.model_validate(raw_config)
    except ValidationError as exc:
        raise RuntimeError(
            "Invalid backend config. Set ZIPCODESTACK_API_KEY in backend/.env."
        ) from exc
