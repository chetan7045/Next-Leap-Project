"""Restaurant routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.database.prisma import Prisma, get_db
from app.schemas.restaurant import RestaurantOut
from app.schemas.summary import RatingSummary
from app.services import restaurant_service

router = APIRouter(prefix="/restaurants", tags=["restaurants"])


@router.get(
    "",
    summary="List restaurants",
    description="Return all restaurants. Used for discovery; supports future multi-restaurant growth.",
    response_model=list[RestaurantOut],
)
async def list_restaurants(db: Prisma = Depends(get_db)):
    return await db.restaurant.find_many(order={"name": "asc"})


@router.get(
    "/{restaurant_id}",
    summary="Get restaurant by ID",
    description="Return a single restaurant by its UUID.",
    responses={404: {"description": "Restaurant not found"}},
    response_model=RestaurantOut,
)
async def get_restaurant(restaurant_id: str, db: Prisma = Depends(get_db)):
    return await restaurant_service.get_restaurant(db, restaurant_id)


@router.get(
    "/{restaurant_id}/rating-summary",
    summary="Get restaurant rating summary",
    description=(
        "Calculate and return the restaurant's average rating, total review "
        "count and per-star rating distribution, computed live from reviews."
    ),
    responses={404: {"description": "Restaurant not found"}},
    response_model=RatingSummary,
)
async def get_rating_summary(restaurant_id: str, db: Prisma = Depends(get_db)):
    return await restaurant_service.get_rating_summary(db, restaurant_id)