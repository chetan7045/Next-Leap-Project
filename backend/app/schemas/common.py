"""Shared schema helpers."""
from __future__ import annotations

from datetime import datetime, timezone


def utc_iso(value: datetime) -> str:
    """Serialize a datetime as an ISO 8601 UTC string (always Z-suffixed)."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")