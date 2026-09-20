"""Vercel serverless entrypoint for the FastAPI application.

Vercel imports this module and serves the `app` object as an ASGI app.
"""
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND / "app" / "generated"))

from app.main import app  # noqa: E402

__all__ = ["app"]


# Durably re-register the client for each cold start. `connect` is idempotent.
async def startup() -> None:
    from app.database.prisma import connect

    await connect()


app.router.on_startup.append(startup)