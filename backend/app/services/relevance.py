"""
Prototype relevance ranking for Rasa.

This is a purely deterministic, transparent scoring heuristic. It is NOT
representative of Zomato's or any other real-world ranking algorithm.

Score = 0.5 * recencyScore + 0.3 * qualityScore + 0.2 * detailScore

Components
----------
recencyScore
    Exponential decay over time. Newer reviews rank higher.
        recencyScore = exp(-ageDays / 180)

qualityScore
    Rewards agreement with the restaurant's overall rating and penalises
    extreme / spam-like rating behaviour (a rating far from the norm).
        qualityScore = max(0, 1 - |rating - avgRating| / 4)

detailScore
    Rewards substantive reviews via a plateaued length signal (200+ chars
    yields the maximum signal).
        detailScore = min(len(trimmedText) / 200, 1)

The implementation is isolated here so it can be swapped for a more
sophisticated ranking system without touching the rest of the application.
"""
from __future__ import annotations

import math
from datetime import datetime, timezone


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def relevance_score(
    rating: int,
    created_at: datetime,
    text: str,
    avg_rating: float | None,
    now: datetime,
) -> float:
    created_at = _as_utc(created_at)
    now = _as_utc(now)

    age_days = max(0.0, (now - created_at).total_seconds() / 86_400.0)
    recency_score = math.exp(-age_days / 180.0)

    if avg_rating is not None:
        deviation = abs(float(rating) - avg_rating)
        quality_score = max(0.0, 1.0 - deviation / 4.0)
    else:
        quality_score = 1.0

    detail_score = min(len(text.strip()) / 200.0, 1.0)

    return (
        0.5 * recency_score + 0.3 * quality_score + 0.2 * detail_score
    )


def sort_by_relevance(
    reviews: list,
    avg_rating: float | None,
    now: datetime,
) -> list:
    """Return reviews ordered by relevance (desc), then recency (desc)."""
    scored = [
        (relevance_score(r.rating, r.createdAt, r.review, avg_rating, now), r)
        for r in reviews
    ]
    scored.sort(key=lambda pair: (pair[0], _as_utc(pair[1].createdAt)), reverse=True)
    return [r for _, r in scored]