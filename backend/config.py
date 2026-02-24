from functools import lru_cache

from pydantic import BaseModel


class Settings(BaseModel):
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    frontend_port: int = 5173
    weather_duckdb_path: str = ".data/weather.duckdb"
    zipcodestack_api_key: str = "replace_me"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
