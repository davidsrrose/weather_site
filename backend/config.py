import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError

BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")


class Config(BaseModel):
    # Server runtime settings.
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    frontend_port: int = 5173

    # Local storage paths and cache freshness controls.
    duckdb_path: str = ".data/weather.duckdb"
    forecast_cache_ttl_minutes: int = Field(default=10, ge=1)
    zip_geocode_cache_ttl_days: int = Field(default=30, ge=1)

    # Upstream request behavior tuning.
    weather_hourly_http_timeout_seconds: float = Field(default=15.0, gt=0)
    zip_geocode_http_timeout_seconds: float = Field(default=10.0, gt=0)

    # External API credentials (required secrets).
    zipcodebase_api_key: str = Field(min_length=1)


@lru_cache(maxsize=1)
def get_settings() -> Config:
    raw_config: dict[str, str] = {}

    duckdb_path = os.getenv("WEATHER_DUCKDB_PATH")
    if duckdb_path:
        raw_config["duckdb_path"] = duckdb_path

    forecast_cache_ttl_minutes = os.getenv("FORECAST_CACHE_TTL_MINUTES")
    if forecast_cache_ttl_minutes:
        raw_config["forecast_cache_ttl_minutes"] = forecast_cache_ttl_minutes

    weather_hourly_http_timeout_seconds = os.getenv("WEATHER_HOURLY_HTTP_TIMEOUT_SECONDS")
    if weather_hourly_http_timeout_seconds:
        raw_config["weather_hourly_http_timeout_seconds"] = weather_hourly_http_timeout_seconds

    zip_geocode_cache_ttl_days = os.getenv("ZIP_GEOCODE_CACHE_TTL_DAYS")
    if zip_geocode_cache_ttl_days:
        raw_config["zip_geocode_cache_ttl_days"] = zip_geocode_cache_ttl_days

    zip_geocode_http_timeout_seconds = os.getenv("ZIP_GEOCODE_HTTP_TIMEOUT_SECONDS")
    if zip_geocode_http_timeout_seconds:
        raw_config["zip_geocode_http_timeout_seconds"] = zip_geocode_http_timeout_seconds

    zipcodebase_api_key = os.getenv("ZIPCODEBASE_API_KEY")
    if zipcodebase_api_key:
        raw_config["zipcodebase_api_key"] = zipcodebase_api_key

    try:
        return Config.model_validate(raw_config)
    except ValidationError as exc:
        raise RuntimeError(
            "Invalid backend config. Set ZIPCODEBASE_API_KEY in backend/.env."
        ) from exc
