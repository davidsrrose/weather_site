"""ZIP geocode API routes."""

import re

from fastapi import APIRouter, HTTPException

from config import get_settings
from fastapi_app.services.zip_geocode_service import (
    ZipGeocodeUpstreamError,
    get_zip_geocode,
)

ZIP_REGEX = re.compile(r"^\d{5}$")

router = APIRouter(prefix="/geocode", tags=["zip-geocode"])


def _validate_zip_code(zip_code: str) -> None:
    """Validate ZIP code format for geocoding endpoint."""
    if ZIP_REGEX.fullmatch(zip_code):
        return
    raise HTTPException(
        status_code=422,
        detail={
            "error": "invalid_zip",
            "message": "ZIP must be exactly 5 digits.",
            "zip": zip_code,
        },
    )


@router.get("/zip/{zip_code}")
async def get_zip_geocode_endpoint(zip_code: str) -> dict[str, object]:
    """Return geocode information for a ZIP code."""
    _validate_zip_code(zip_code)
    settings = get_settings()

    try:
        result = await get_zip_geocode(
            zip_code=zip_code,
            duckdb_path=settings.duckdb_path,
            zipcodebase_api_key=settings.zipcodebase_api_key,
            zip_cache_ttl_days=settings.zip_geocode_cache_ttl_days,
            request_timeout_seconds=settings.zip_geocode_http_timeout_seconds,
        )
    except ZipGeocodeUpstreamError as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "error": "upstream_error",
                "message": "Unable to resolve ZIP right now.",
            },
        ) from exc

    return result.to_dict()
