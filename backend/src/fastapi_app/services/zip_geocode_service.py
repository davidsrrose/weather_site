"""ZIP geocode service with DuckDB-backed ZIP cache."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import UTC, datetime, timedelta
import logging
from typing import Any

import duckdb
import httpx

from fastapi_app.services.duckdb import ensure_duckdb_parent_dir

logger = logging.getLogger("uvicorn.error")

ZIP_CACHE_MAX_AGE = timedelta(days=30)
ZIPCODESTACK_URL = "https://api.zipcodestack.com/v1/search"


class ZipGeocodeUpstreamError(Exception):
    """Raised when upstream geocoding cannot return usable data."""


@dataclass(frozen=True)
class ZipGeocodeResult:
    """Normalized geocode payload returned by the API."""

    zip: str
    lat: float
    lon: float
    city: str
    state: str
    source: str

    def to_dict(self) -> dict[str, Any]:
        """Return the dataclass as a serializable dictionary."""
        return asdict(self)


def _utc_now_naive() -> datetime:
    """Return current UTC timestamp as naive datetime for DuckDB TIMESTAMP."""
    return datetime.now(UTC).replace(tzinfo=None)


def _ensure_zip_cache_table(connection: duckdb.DuckDBPyConnection) -> None:
    """Create the ZIP cache table if it does not exist."""
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS zip_cache (
            zip TEXT PRIMARY KEY,
            lat DOUBLE,
            lon DOUBLE,
            city TEXT,
            state TEXT,
            fetched_at TIMESTAMP
        )
        """
    )


def _is_fresh(fetched_at: datetime) -> bool:
    """Return whether a cached row is still within max cache age."""
    return _utc_now_naive() - fetched_at < ZIP_CACHE_MAX_AGE


def _read_cached_zip(
    connection: duckdb.DuckDBPyConnection, zip_code: str
) -> ZipGeocodeResult | None:
    """Read cached geocode data for a ZIP, if present and fresh."""
    row = connection.execute(
        """
        SELECT zip, lat, lon, city, state, fetched_at
        FROM zip_cache
        WHERE zip = ?
        """,
        [zip_code],
    ).fetchone()

    if row is None:
        return None

    fetched_at: datetime = row[5]
    if not _is_fresh(fetched_at):
        return None

    logger.info("zip cache hit zip=%s fetched_at=%s", zip_code, fetched_at.isoformat())
    return ZipGeocodeResult(
        zip=row[0],
        lat=float(row[1]),
        lon=float(row[2]),
        city=str(row[3]),
        state=str(row[4]),
        source="cache",
    )


def _upsert_cached_zip(
    connection: duckdb.DuckDBPyConnection, result: ZipGeocodeResult
) -> None:
    """Insert or update a ZIP cache row with fresh geocode data."""
    fetched_at = _utc_now_naive()
    connection.execute(
        """
        INSERT INTO zip_cache (zip, lat, lon, city, state, fetched_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (zip) DO UPDATE SET
            lat = EXCLUDED.lat,
            lon = EXCLUDED.lon,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            fetched_at = EXCLUDED.fetched_at
        """,
        [
            result.zip,
            result.lat,
            result.lon,
            result.city,
            result.state,
            fetched_at,
        ],
    )


def _parse_zipcodestack_payload(
    zip_code: str, payload: dict[str, Any]
) -> ZipGeocodeResult:
    """Normalize ZipCodeStack payload into API response model."""
    results = payload.get("results", {})
    zip_matches = results.get(zip_code, [])
    if not isinstance(zip_matches, list) or not zip_matches:
        raise ZipGeocodeUpstreamError("No upstream geocode results for ZIP.")

    first_match = zip_matches[0]
    latitude = first_match.get("latitude")
    longitude = first_match.get("longitude")
    city = first_match.get("city")
    state = first_match.get("state_code") or first_match.get("state")

    if latitude is None or longitude is None or not city or not state:
        raise ZipGeocodeUpstreamError("Incomplete upstream geocode payload.")

    return ZipGeocodeResult(
        zip=zip_code,
        lat=float(latitude),
        lon=float(longitude),
        city=str(city),
        state=str(state),
        source="upstream",
    )


async def _fetch_upstream_zip_geocode(
    zip_code: str, api_key: str
) -> ZipGeocodeResult:
    """Fetch geocode data from ZipCodeStack."""
    params = {"codes": zip_code, "country": "us", "apikey": api_key}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(ZIPCODESTACK_URL, params=params)
    except httpx.HTTPError as exc:
        raise ZipGeocodeUpstreamError("Upstream geocode request failed.") from exc

    if response.status_code >= 400:
        raise ZipGeocodeUpstreamError(
            f"Upstream geocode returned HTTP {response.status_code}."
        )

    try:
        payload = response.json()
    except ValueError as exc:
        raise ZipGeocodeUpstreamError(
            "Upstream geocode returned invalid JSON."
        ) from exc

    return _parse_zipcodestack_payload(zip_code=zip_code, payload=payload)


async def get_zip_geocode(
    zip_code: str, duckdb_path: str, zipcodestack_api_key: str
) -> ZipGeocodeResult:
    """Resolve ZIP geocode using cache-first strategy with upstream fallback."""
    resolved_db_path = ensure_duckdb_parent_dir(duckdb_path)
    connection = duckdb.connect(str(resolved_db_path))

    try:
        _ensure_zip_cache_table(connection)
        cached = _read_cached_zip(connection, zip_code)
        if cached is not None:
            return cached

        logger.info("zip cache miss zip=%s fetching upstream", zip_code)
        upstream = await _fetch_upstream_zip_geocode(
            zip_code=zip_code, api_key=zipcodestack_api_key
        )
        _upsert_cached_zip(connection, upstream)
        return upstream
    finally:
        connection.close()
