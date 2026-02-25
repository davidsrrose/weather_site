from pathlib import Path


def ensure_duckdb_parent_dir(db_path: str) -> Path:
    resolved_path = Path(db_path).expanduser()
    if not resolved_path.is_absolute():
        resolved_path = (Path.cwd() / resolved_path).resolve()
    resolved_path.parent.mkdir(parents=True, exist_ok=True)
    return resolved_path
