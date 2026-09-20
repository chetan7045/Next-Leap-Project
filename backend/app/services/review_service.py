"""Review business logic."""
from __future__ import annotations

from datetime import datetime, timezone

from app.database.prisma import Prisma
from app.errors import RestaurantNotFoundError, ReviewNotFoundError
from app.services import relevance
from app.services.restaurant_service import get_restaurant

MAX_LIMIT = 50


async def _ensure_restaurant(db: Prisma, restaurant_id: str) -> None:
    await get_restaurant(db, restaurant_id)


async def list_reviews(
    db: Prisma,
    restaurant_id: str,
    sort: str = "recent",
    rating: int | None = None,
    page: int = 1,
    limit: int = 10,
) -> dict:
    await _ensure_restaurant(db, restaurant_id)
    limit = min(max(limit, 1), MAX_LIMIT)
    page = max(page, 1)

    where: dict = {"restaurantId": restaurant_id}
    if rating is not None:
        where["rating"] = rating

    total = await db.review.count(where=where)

    if sort == "recent":
        reviews = await db.review.find_many(
            where=where,
            order={"createdAt": "desc"},
            skip=(page - 1) * limit,
            take=limit,
        )
    else:  # relevant — deterministic scoring applied in the service layer
        all_reviews = await db.review.find_many(
            where=where, order={"createdAt": "desc"}
        )
        avg_row = await _average_rating_for(db, restaurant_id)
        scored = relevance.sort_by_relevance(
            all_reviews, avg_row, datetime.now(timezone.utc)
        )
        start = (page - 1) * limit
        reviews = scored[start : start + limit]

    return {
        "reviews": reviews,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit if total else 0,
        },
    }


async def _average_rating_for(db: Prisma, restaurant_id: str) -> float | None:
    grouped = await db.review.group_by(
        by=["rating"], where={"restaurantId": restaurant_id}, count=True
    )
    total = sum(int(row["_count"]["_all"]) for row in grouped)
    if total == 0:
        return None
    weighted = sum(
        int(row["rating"]) * int(row["_count"]["_all"]) for row in grouped
    )
    return weighted / total


async def create_review(db: Prisma, restaurant_id: str, rating: int, review: str):
    await _ensure_restaurant(db, restaurant_id)
    return await db.review.create(
        data={"restaurantId": restaurant_id, "rating": rating, "review": review}
    )


async def get_review(db: Prisma, review_id: str):
    review = await db.review.find_unique(where={"id": review_id})
    if review is None:
        raise ReviewNotFoundError("Review not found.")
    return review


async def update_review(db: Prisma, review_id: str, rating: int | None, review: str | None):
    await get_review(db, review_id)
    data: dict = {}
    if rating is not None:
        data["rating"] = rating
    if review is not None:
        data["review"] = review
    return await db.review.update(
        where={"id": review_id},
        data=data,
    )


async def delete_review(db: Prisma, review_id: str) -> None:
    await get_review(db, review_id)
    # Hard delete for the MVP. Swap for a soft-delete flag here later.
    await db.review.delete(where={"id": review_id})