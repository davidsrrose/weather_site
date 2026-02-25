# Backend

## Setup
From repo root:
1. Install dependencies:
   - `uv sync`

From `backend/`:
2. Create local env file:
   - `cp .env.sample .env`
3. Set your API key in `.env`:
   - `ZIPCODESTACK_API_KEY=your_real_key`
4. Non-secret defaults (host/port/duckdb path) live in `config.py`

## Run
From `backend/`:
1. Start the API server:
   - `uv run uvicorn fastapi_app.main:app --reload --port 8000`

## Verify (Ticket 2)
From a second terminal:
1. Health check:
   - `curl -i http://127.0.0.1:8000/api/health`
2. Expected result:
   - HTTP `200 OK`
   - JSON body: `{"status":"ok"}`

Notes:
- API is served on port `8000`.
- DuckDB parent directory is created at startup.
- Non-secret defaults live in `backend/config.py`; `.env` is secret-only.
