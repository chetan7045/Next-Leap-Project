"""Restaurant API schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_serializer

from .common import utc_iso


class RestaurantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str | None = None
    cuisines: list[str]
    location: str
    city: str
    address: str | None = None
    createdAt: datetime
    updatedAt: datetime

    @field_serializer("createdAt", "updatedAt")
    def _serialise_timestamps(self, value: datetime) -> str:
        return utc_iso(value)