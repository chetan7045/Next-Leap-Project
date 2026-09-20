"""
Rasa — database seed.

Behavior (repeatable):
  - Upserts the HOPS Mumbai restaurant using a fixed UUID (no duplicates on re-run).
  - Deletes all existing reviews for HOPS and recreates the prototype review set.

Usage:
  cd backend
  bash scripts/with_secrets.sh ../seeds/run-seed.sh

The DATABASE_URL used for connecting comes from the repository secrets.json
via scripts/with_secrets.sh, or from the DATABASE_URL environment variable.
"""
from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND / "app" / "generated"))

from prisma import Prisma  # noqa: E402

HOPS_ID = "00000000-0000-4000-8000-000000000001"

HOPS = {
    "id": HOPS_ID,
    "name": "HOPS Mumbai",
    "description": (
        "HOPS is a lively bar and restaurant in the heart of Versova Village, "
        "Mumbai. It brings together the best of Indian and Chinese kitchens — "
        "from rich, slow-cooked curries to wok-tossed noodles — alongside a "
        "well-stocked bar and a relaxed, open-air vibe that works equally well "
        "for a quiet weekday dinner or a boisterous weekend with friends."
    ),
    "cuisines": ["Indian", "Chinese"],
    "location": "Versova",
    "city": "Mumbai",
    "address": "Ground Floor, Versova Village, Andheri West, Mumbai 400061 (prototype data)",
}

# (rating, review_text, age_in_days) — ages are relative to "now" so every
# reseed produces distinct, spread-out timestamps while keeping the set fresh.
REVIEWS: list[tuple[int, str, float]] = [
    (5, "Absolutely loved the butter chicken here — rich, creamy and perfectly spiced. The Sunday crowd is worth braving for this.", 2),
    (5, "Best Chinese food in Versova by a long shot. We ordered the hakka noodles and chilli paneer and both were cooked to perfection.", 4),
    (4, "Really good food and a lovely open-air seating area. Rating it 4 only because it gets a bit crowded on weekends.", 6),
    (5, "Beautiful ambience and even better service. Our server remembered our order from last time, which says a lot.", 9),
    (3, "Average experience. The food was okay but nothing stood out. The place looks nice though, so it's fine for a quick bite.", 14),
    (5, "Went for an anniversary dinner and they made it so special. Great music, great drinks, great vibes. Highly recommended!", 18),
    (4, "The butter chicken was delicious and the naan was fresh. Service was a little slow but the food made up for it.", 23),
    (2, "The food was underwhelming and overpriced for the quantity. The Manchurian was soggy and the service was slow. Won't rush back.", 30),
    (5, "The kebabs are sensational and the dal makhani is easily one of the best I've had in Mumbai. Generous portions for the price.", 37),
    (4, "Nice place for a casual dinner. The chilli chicken was spicy and tasty. Would've liked a few more sharing plates though.", 45),
    (3, "Food took a while to arrive and the chilli paneer was much spicier than expected. Tastes decent otherwise.", 52),
    (5, "Perfect spot for a lazy weekday dinner. The staff is warm, the place is clean and the food consistently impresses.", 61),
    (4, "Good ambience and polite staff. The dumplings were great but one dish came out a bit cold. Overall a satisfying meal.", 70),
    (5, "Loved the dumplings! Light, fresh and packed with flavour. Will definitely be coming back soon.", 83),
    (3, "The ambience is nice but the service was inconsistent. We had to call someone over multiple times for water refills.", 97),
    (4, "Solid Indian-Chinese joint. The hakka noodles are great, portions are decent. Prices are slightly on the higher side.", 110),
    (5, "Fantastic experience overall. The manager came by to check on us and even offered a complementary dessert. That's how you run a restaurant.", 128),
    (2, "Crowded, loud and the wait was way too long. When our food finally arrived it was average at best. Not worth the hype.", 150),
    (4, "Enjoyed the evening here. Great selection of drinks, food was good, though the wait for the table was longer than expected.", 180),
    (5, "Chinese food is their strength — Singapore noodles and crispy corn were outstanding. Great vegetarian options too.", 210),
    (4, "The food was very good, especially the fish. Ambience is modern and clean. Service could be more attentive during rush hours.", 250),
    (1, "Terrible experience. Our order took over an hour, two items were wrong, and the staff was dismissive when we pointed it out. The food, when it arrived, was cold and bland.", 300),
    (4, "A reliable spot with tasty food. Not mind-blowing but consistently good and the outdoor seating is a big plus.", 360),
    (5, "Great value for money. Excellent cocktails, quick service and the music volume is just right for conversation.", 420),
]


def review_timestamp(age_days: float) -> datetime:
    base = datetime.now(timezone.utc) - timedelta(days=age_days)
    return base.replace(microsecond=int(age_days * 1000) + 123)


async def seed() -> None:
    db = Prisma()
    await db.connect()
    try:
        restaurant = await db.restaurant.upsert(
            where={"id": HOPS_ID},
            data={
                "create": HOPS,
                "update": {k: v for k, v in HOPS.items() if k != "id"},
            },
        )
        name = restaurant.name
        await db.review.delete_many(where={"restaurantId": HOPS_ID})

        now = datetime.now(timezone.utc)
        await db.review.create_many(
            data=[
                {
                    "restaurantId": HOPS_ID,
                    "rating": rating,
                    "review": text,
                    "createdAt": review_timestamp(age_days),
                    "updatedAt": review_timestamp(age_days) if age_days < 400 else now,
                }
                for rating, text, age_days in REVIEWS
            ]
        )

        total = await db.review.count(where={"restaurantId": HOPS_ID})
        print(f"Seeded restaurant: {name}")
        print(f"Seeded reviews:    {total}")
    finally:
        await db.disconnect()


if __name__ == "__main__":
    asyncio.run(seed())