"""Prisma client lifecycle.

The generated client lives in app/generated/prisma (committed to the repo so no
generation step is required at deployment time). Adding that directory to
sys.path makes `from prisma import Prisma` resolve to the generated package.
"""
from __future__ import annotations

import sys
from pathlib import Path

from fastapi import Request

GENERATED = Path(__file__).resolve().parent.parent / "generated"
if str(GENERATED) not in sys.path:
    sys.path.insert(0, str(GENERATED))

from prisma import Prisma  # noqa: E402

_client: Prisma | None = None


async def connect() -> None:
    global _client
    if _client is None:
        _client = Prisma(auto_register=True)
        await _client.connect()


async def disconnect() -> None:
    global _client
    if _client is not None:
        await _client.disconnect()
        _client = None


def get_db(request: Request) -> Prisma:
    """FastAPI dependency that yields the shared Prisma client."""
    if _client is None:
        raise RuntimeError("Prisma client has not been initialised.")
    return _client


__all__ = ["Prisma", "connect", "disconnect", "get_db"]