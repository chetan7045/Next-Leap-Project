"""Rating summary schema."""
from __future__ import annotations

from pydantic import BaseModel


class RatingSummary(BaseModel):
    averageRating: float
    totalReviews: int
    distribution: dict[str, int]