"""Application configuration.

Secrets are read from the repository-local secrets.json during development
(or from environment variables in production, e.g. Vercel).

Nothing in this file is ever returned by an API or bundled into the frontend.
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path

# Repo root is two levels above this file (backend/app/config.py).
REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def _load_secrets() -> dict:
    secrets_path = REPO_ROOT / "secrets.json"
    if secrets_path.exists():
        try:
            return json.loads(secrets_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return {}
    return {}


def _env(name: str) -> str | None:
    return os.environ.get(name) or None


@dataclass(frozen=True)
class Settings:
    app_name: str = "Rasa"
    api_version: str = "1"
    environment: str = field(default_factory=lambda: os.environ.get("RASA_ENV", "development"))
    allowed_origins: list[str] = field(default_factory=list)

    @classmethod
    def load(cls, secrets: dict | None = None) -> "Settings":
        secrets = secrets if secrets is not None else _load_secrets()

        database_url = _env("DATABASE_URL") or secrets.get("DATABASE_URL")

        # Cross-origin: dev defaults to the Vite dev server; production uses the
        # ALLOWED_ORIGINS env var provided by the deployment platform.
        origins = _env("ALLOWED_ORIGINS")
        if origins:
            allowed = [origin.strip() for origin in origins.split(",") if origin.strip()]
        else:
            allowed = ["http://localhost:5173", "http://127.0.0.1:5173"]

        return cls(database_url=database_url, allowed_origins=allowed)

    database_url: str | None = None


settings = Settings.load()