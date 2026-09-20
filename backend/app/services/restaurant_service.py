"""Restaurant business logic."""
from __future__ import annotations

from pydantic import BaseModel

from app.database.prisma import Prisma
from app.errors import RestaurantNotFoundError


async def get_restaurant(db: Prisma, restaurant_id: str) -> BaseModel:
    restaurant = await db.restaurant.find_unique(where={"id": restaurant_id})
    if restaurant is None:
        raise RestaurantNotFoundError("Restaurant not found.")
    return restaurant


async def get_rating_summary(db: Prisma, restaurant_id: str):
    """Compute averageRating / totalReviews / distribution live from reviews."""
    await get_restaurant(db, restaurant_id)

    grouped = await db.review.group_by(
        by=["rating"],
        where={"restaurantId": restaurant_id},
        count=True,
    )

    distribution = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
    total = 0
    weighted_sum = 0.0
    for row in grouped:
        rating = int(row["rating"])
        count = int(row["_count"]["_all"])
        distribution[str(rating)] = count
        total += count
        weighted_sum += rating * count

    average = round(weighted_sum / total, 2) if total else 0.0
    return {
        "averageRating": average,
        "totalReviews": total,
        "distribution": distribution,
    }