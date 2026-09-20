"""Review routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status
from pydantic import TypeAdapter

from app.database.prisma import Prisma, get_db
from app.schemas.review import (
    Pagination,
    ReviewCreate,
    ReviewOut,
    ReviewUpdate,
    ReviewsPage,
)
from app.services import review_service

router = APIRouter(tags=["reviews"])

review_out = TypeAdapter(ReviewOut)
reviews_page = TypeAdapter(ReviewsPage)


@router.get(
    "/restaurants/{restaurant_id}/reviews",
    summary="Get restaurant reviews",
    description=(
        "Return paginated reviews for a restaurant. Supports sorting "
        "(recent | relevant) and per-star rating filtering, which combine."
    ),
    responses={404: {"description": "Restaurant not found"}},
    response_model=ReviewsPage,
)
async def get_reviews(
    restaurant_id: str,
    sort: str = Query("recent", pattern="^(recent|relevant)$"),
    rating: int | None = Query(default=None, ge=1, le=5),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Prisma = Depends(get_db),
):
    result = await review_service.list_reviews(
        db=db,
        restaurant_id=restaurant_id,
        sort=sort,
        rating=rating,
        page=page,
        limit=limit,
    )
    return {
        "reviews": [review_out.validate_python(r) for r in result["reviews"]],
        "pagination": Pagination(**result["pagination"]),
    }


@router.post(
    "/restaurants/{restaurant_id}/reviews",
    summary="Create a review",
    status_code=status.HTTP_201_CREATED,
    description="Submit a rating (1-5) and review text for a restaurant.",
    responses={404: {"description": "Restaurant not found"}, 422: {"description": "Validation error"}},
    response_model=ReviewOut,
)
async def create_review(
    restaurant_id: str,
    payload: ReviewCreate,
    db: Prisma = Depends(get_db),
):
    review = await review_service.create_review(
        db=db,
        restaurant_id=restaurant_id,
        rating=payload.rating,
        review=payload.review,
    )
    return review_out.validate_python(review)


@router.put(
    "/reviews/{review_id}",
    summary="Update a review",
    description="Update a review's rating and/or text. updatedAt is refreshed.",
    responses={404: {"description": "Review not found"}, 422: {"description": "Validation error"}},
    response_model=ReviewOut,
)
async def update_review(
    review_id: str,
    payload: ReviewUpdate,
    db: Prisma = Depends(get_db),
):
    review = await review_service.update_review(
        db=db,
        review_id=review_id,
        rating=payload.rating,
        review=payload.review,
    )
    return review_out.validate_python(review)


@router.delete(
    "/reviews/{review_id}",
    summary="Delete a review",
    description="Hard-delete a review by ID.",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"description": "Review not found"}},
)
async def delete_review(
    review_id: str,
    response: Response,
    db: Prisma = Depends(get_db),
):
    await review_service.delete_review(db=db, review_id=review_id)
    return None