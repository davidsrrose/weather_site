"""Weather API routes."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.pipelines.weather_hourly import WeatherHourlyPipelineError, weather_hourly_source
from app.services.forecast_snapshot_cache import get_or_refresh_hourly_forecast
from config import get_settings

router = APIRouter(prefix="/weather", tags=["weather"])


def _validate_latitude(latitude: float) -> None:
    """Validate latitude range.

    Args:
        latitude: Latitude query parameter.

    Raises:
        HTTPException: If latitude is outside valid range.
    """
    if -90 <= latitude <= 90:
        return

    raise HTTPException(
        status_code=422,
        detail={
            "error": "invalid_latitude",
            "message": "Latitude must be between -90 and 90.",
            "lat": latitude,
        },
    )


def _validate_longitude(longitude: float) -> None:
    """Validate longitude range.

    Args:
        longitude: Longitude query parameter.

    Raises:
        HTTPException: If longitude is outside valid range.
    """
    if -180 <= longitude <= 180:
        return

    raise HTTPException(
        status_code=422,
        detail={
            "error": "invalid_longitude",
            "message": "Longitude must be between -180 and 180.",
            "lon": longitude,
        },
    )


def fetch_hourly_periods_for_location(lat: float, lon: float) -> list[dict[str, Any]]:
    """Fetch normalized hourly periods through dlt source.

    Args:
        lat: Latitude.
        lon: Longitude.

    Returns:
        Normalized hourly weather periods.
    """
    source = weather_hourly_source(lat=lat, lon=lon)
    resource = source.resources["weather_hourly_periods"]
    return list(resource)


def get_hourly_weather_payload(lat: float, lon: float) -> dict[str, Any]:
    """Get hourly weather payload with DuckDB snapshot caching.

    Args:
        lat: Latitude.
        lon: Longitude.

    Returns:
        Stable payload with generated_at, location, and periods.
    """
    settings = get_settings()
    return get_or_refresh_hourly_forecast(
        lat=lat,
        lon=lon,
        duckdb_path=settings.duckdb_path,
        fetch_periods=fetch_hourly_periods_for_location,
    )


@router.get("/hourly")
def get_hourly_weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
) -> dict[str, Any]:
    """Return normalized hourly weather periods for coordinates.

    Args:
        lat: Latitude query parameter.
        lon: Longitude query parameter.

    Returns:
        Weather payload containing location, generated timestamp, and periods.
    """
    _validate_latitude(lat)
    _validate_longitude(lon)

    try:
        payload = get_hourly_weather_payload(lat=lat, lon=lon)
    except WeatherHourlyPipelineError as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "error": "upstream_error",
                "message": "Unable to load hourly forecast right now.",
                "upstream_status": exc.upstream_status,
            },
        ) from exc

    return payload
