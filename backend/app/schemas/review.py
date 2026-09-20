"""Review API schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_serializer, model_validator

from .common import utc_iso

MIN_REVIEW_LENGTH = 10
MAX_REVIEW_LENGTH = 2000


class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating between 1 and 5.")
    review: str = Field(
        ...,
        min_length=MIN_REVIEW_LENGTH,
        max_length=MAX_REVIEW_LENGTH,
        description="Review text.",
    )


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(BaseModel):
    rating: int | None = Field(
        default=None, ge=1, le=5, description="Rating between 1 and 5."
    )
    review: str | None = Field(
        default=None,
        min_length=MIN_REVIEW_LENGTH,
        max_length=MAX_REVIEW_LENGTH,
        description="Review text.",
    )

    @model_validator(mode="after")
    def require_something_to_update(self) -> "ReviewUpdate":
        if self.rating is None and self.review is None:
            raise ValueError("Provide at least one of rating or review to update.")
        return self


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    restaurantId: str
    rating: int
    review: str
    createdAt: datetime
    updatedAt: datetime

    @field_serializer("createdAt", "updatedAt")
    def _serialise_timestamps(self, value: datetime) -> str:
        return utc_iso(value)


class Pagination(BaseModel):
    page: int
    limit: int
    total: int
    totalPages: int


class ReviewsPage(BaseModel):
    reviews: list[ReviewOut]
    pagination: Pagination