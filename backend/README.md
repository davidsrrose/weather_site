# Backend

## Setup
From repo root:
1. Install dependencies:
   - `uv sync`

From `backend/`:
2. Create local env file:
   - `cp .env.sample .env`
3. Create a free Zipcodebase API key:
   - `https://app.zipcodebase.com/register?plan=free`
4. Set your API key in `.env`:
   - `ZIPCODEBASE_API_KEY=your_real_key`
5. Non-secret defaults (host/port/duckdb path) live in `config.py`

## Run
From `backend/`:
1. Start the API server:
   - `uv run uvicorn fastapi_app.main:app --reload --port 8000`

## Verify
From a second terminal:
1. Health check:
   - `curl -i http://127.0.0.1:8000/api/health`
2. Geocode valid ZIP:
   - `curl -i http://127.0.0.1:8000/api/geocode/zip/10001`
3. Geocode invalid ZIP:
   - `curl -i http://127.0.0.1:8000/api/geocode/zip/1234`

Expected behavior:
- Health returns `200` and `{"status":"ok"}`.
- Valid ZIP returns `lat`, `lon`, `city`, `state`, and `source`.
- Invalid ZIP returns `422` with an `invalid_zip` payload.
- Repeated ZIP requests can return `source: "cache"` (see backend logs for cache hit/miss).

## Notes
- API runs on port `8000`.
- DuckDB parent directory is created automatically if missing.
- Non-secret defaults live in `backend/config.py`; `.env` is secret-only.
