"""Shared test fixtures.

Tests run against the real (local/prototype) database but never mutate the
seeded HOPS data: each test uses a dedicated throwaway restaurant that is
created and fully cleaned up by the fixtures.
"""
from __future__ import annotations

import sys
import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "app" / "generated"))

from prisma import Prisma  # noqa: E402

from app.main import app  # noqa: E402


async def _connect_with_retry(db: Prisma, attempts: int = 4) -> None:
    """Neon's pooled serverless connection can cold-start; retry briefly."""
    import asyncio

    for attempt in range(attempts):
        try:
            await db.connect()
            return
        except Exception:
            if attempt == attempts - 1:
                raise
            await asyncio.sleep(0.5 * (attempt + 1))


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def test_restaurant(client):
    """Create a throwaway restaurant and clean it up (reviews first) after."""
    restaurant_id = str(uuid.uuid4())
    db = Prisma()
    import asyncio

    async def _run() -> None:
        await _connect_with_retry(db)
        await db.restaurant.create(
            data={
                "id": restaurant_id,
                "name": "Test Bistro",
                "location": "Testville",
                "city": "Test City",
                "cuisines": ["Test"],
                "description": None,
                "address": None,
            }
        )
        await db.disconnect()

    asyncio.run(_run())
    yield restaurant_id

    async def _cleanup() -> None:
        await _connect_with_retry(db)
        await db.review.delete_many(where={"restaurantId": restaurant_id})
        await db.restaurant.delete(where={"id": restaurant_id})
        await db.disconnect()

    asyncio.run(_cleanup())


@pytest.fixture()
def seeded_restaurant_id() -> str:
    return "00000000-0000-4000-8000-000000000001"