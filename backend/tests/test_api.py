"""Backend API tests."""
from __future__ import annotations

REVIEW_TEXT = "A perfectly balanced test review for the Rasa prototype." * 1


def _create_review(client, restaurant_id: str, rating: int = 5) -> dict:
    res = client.post(
        f"/api/restaurants/{restaurant_id}/reviews",
        json={"rating": rating, "review": REVIEW_TEXT},
    )
    assert res.status_code == 201, res.text
    return res.json()


class TestRestaurants:
    def test_get_restaurant(self, client, seeded_restaurant_id):
        res = client.get(f"/api/restaurants/{seeded_restaurant_id}")
        assert res.status_code == 200
        body = res.json()
        assert body["name"] == "HOPS Mumbai"
        assert body["cuisines"] == ["Indian", "Chinese"]
        assert body["location"] == "Versova"
        assert body["city"] == "Mumbai"

    def test_get_missing_restaurant(self, client):
        res = client.get("/api/restaurants/00000000-0000-4000-8000-000000009999")
        assert res.status_code == 404
        assert res.json()["error"]["code"] == "RESTAURANT_NOT_FOUND"

    def test_list_restaurants(self, client):
        res = client.get("/api/restaurants")
        assert res.status_code == 200
        names = [r["name"] for r in res.json()]
        assert "HOPS Mumbai" in names


class TestReviews:
    def test_get_reviews_structure(self, client, seeded_restaurant_id):
        res = client.get(f"/api/restaurants/{seeded_restaurant_id}/reviews")
        assert res.status_code == 200
        body = res.json()
        assert isinstance(body["reviews"], list)
        assert body["pagination"]["total"] >= 20
        assert body["pagination"]["totalPages"] >= 2

    def test_sort_recent(self, client, seeded_restaurant_id):
        res = client.get(f"/api/restaurants/{seeded_restaurant_id}/reviews?sort=recent")
        reviews = res.json()["reviews"]
        timestamps = [r["createdAt"] for r in reviews]
        assert timestamps == sorted(timestamps, reverse=True)

    def test_sort_relevant(self, client, seeded_restaurant_id):
        res = client.get(f"/api/restaurants/{seeded_restaurant_id}/reviews?sort=relevant")
        assert res.status_code == 200
        assert len(res.json()["reviews"]) == 10

    def test_filter_rating(self, client, seeded_restaurant_id):
        for rating in (5, 4, 3, 2, 1):
            res = client.get(
                f"/api/restaurants/{seeded_restaurant_id}/reviews?rating={rating}"
            )
            assert res.status_code == 200
            body = res.json()
            assert all(r["rating"] == rating for r in body["reviews"])
            if rating == 1:
                assert body["pagination"]["total"] == 1

    def test_filter_and_sort_combined(self, client, seeded_restaurant_id):
        res = client.get(
            f"/api/restaurants/{seeded_restaurant_id}/reviews?rating=5&sort=recent"
        )
        body = res.json()
        assert all(r["rating"] == 5 for r in body["reviews"])
        timestamps = [r["createdAt"] for r in body["reviews"]]
        assert timestamps == sorted(timestamps, reverse=True)

    def test_invalid_rating_query(self, client, seeded_restaurant_id):
        res = client.get(f"/api/restaurants/{seeded_restaurant_id}/reviews?rating=6")
        assert res.status_code == 422

    def test_invalid_sort_query(self, client, seeded_restaurant_id):
        res = client.get(f"/api/restaurants/{seeded_restaurant_id}/reviews?sort=random")
        assert res.status_code == 422

    def test_pagination(self, client, seeded_restaurant_id):
        all_body = client.get(f"/api/restaurants/{seeded_restaurant_id}/reviews?limit=50").json()
        total = all_body["pagination"]["total"]
        first = client.get(
            f"/api/restaurants/{seeded_restaurant_id}/reviews?page=1&limit=3"
        ).json()
        second = client.get(
            f"/api/restaurants/{seeded_restaurant_id}/reviews?page=2&limit=3"
        ).json()
        ids_1 = {r["id"] for r in first["reviews"]}
        ids_2 = {r["id"] for r in second["reviews"]}
        assert not ids_1 & ids_2
        assert total == first["pagination"]["total"] == second["pagination"]["total"]


class TestRatingSummary:
    def test_summary(self, client, seeded_restaurant_id):
        res = client.get(f"/api/restaurants/{seeded_restaurant_id}/rating-summary")
        assert res.status_code == 200
        body = res.json()
        assert body["totalReviews"] >= 20
        dist = body["distribution"]
        assert sum(dist.values()) == body["totalReviews"]
        assert dist["1"] >= 1 and dist["5"] >= 5
        assert 0 <= body["averageRating"] <= 5

    def test_summary_missing_restaurant(self, client):
        res = client.get("/api/restaurants/00000000-0000-4000-8000-000000009999/rating-summary")
        assert res.status_code == 404


class TestReviewLifecycle:
    def test_create_and_read(self, client, test_restaurant):
        created = _create_review(client, test_restaurant)
        assert created["rating"] == 5
        assert created["restaurantId"] == test_restaurant

        res = client.get(f"/api/restaurants/{test_restaurant}/reviews")
        reviews = res.json()["reviews"]
        assert any(r["id"] == created["id"] for r in reviews)

    def test_create_single_star(self, client, test_restaurant):
        created = _create_review(client, test_restaurant, rating=1)
        assert created["rating"] == 1

    def test_summary_reflects_new_review(self, client, test_restaurant):
        before = client.get(f"/api/restaurants/{test_restaurant}/rating-summary").json()
        _create_review(client, test_restaurant, rating=5)
        after = client.get(f"/api/restaurants/{test_restaurant}/rating-summary").json()
        assert after["totalReviews"] == before["totalReviews"] + 1
        assert after["distribution"]["5"] == before["distribution"]["5"] + 1

    def test_invalid_rating_rejected(self, client, test_restaurant):
        for rating in (0, 6, -1):
            res = client.post(
                f"/api/restaurants/{test_restaurant}/reviews",
                json={"rating": rating, "review": REVIEW_TEXT},
            )
            assert res.status_code == 422, rating

    def test_short_review_rejected(self, client, test_restaurant):
        res = client.post(
            f"/api/restaurants/{test_restaurant}/reviews",
            json={"rating": 4, "review": "short"},
        )
        assert res.status_code == 422
        assert res.json()["error"]["code"] == "INVALID_REVIEW"

    def test_long_review_rejected(self, client, test_restaurant):
        res = client.post(
            f"/api/restaurants/{test_restaurant}/reviews",
            json={"rating": 4, "review": "x" * 2001},
        )
        assert res.status_code == 422

    def test_empty_review_rejected(self, client, test_restaurant):
        res = client.post(
            f"/api/restaurants/{test_restaurant}/reviews",
            json={"rating": 4, "review": ""},
        )
        assert res.status_code == 422

    def test_create_missing_restaurant(self, client):
        res = client.post(
            "/api/restaurants/00000000-0000-4000-8000-000000009999/reviews",
            json={"rating": 4, "review": REVIEW_TEXT},
        )
        assert res.status_code == 404

    def test_update_changes_updated_at(self, client, test_restaurant):
        created = _create_review(client, test_restaurant)
        res = client.put(
            f"/api/reviews/{created['id']}",
            json={"rating": 4, "review": "An updated test review, now with more detail."},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["rating"] == 4
        assert body["updatedAt"] >= created["updatedAt"]

    def test_update_rating_only(self, client, test_restaurant):
        created = _create_review(client, test_restaurant, rating=2)
        res = client.put(f"/api/reviews/{created['id']}", json={"rating": 3})
        assert res.status_code == 200
        assert res.json()["rating"] == 3
        assert res.json()["review"] == created["review"]

    def test_update_requires_field(self, client, test_restaurant):
        created = _create_review(client, test_restaurant)
        res = client.put(f"/api/reviews/{created['id']}", json={})
        assert res.status_code == 422

    def test_delete(self, client, test_restaurant):
        created = _create_review(client, test_restaurant)
        res = client.delete(f"/api/reviews/{created['id']}")
        assert res.status_code == 204
        res = client.delete(f"/api/reviews/{created['id']}")
        assert res.status_code == 404

    def test_delete_reduces_count(self, client, test_restaurant):
        _create_review(client, test_restaurant)
        before = client.get(f"/api/restaurants/{test_restaurant}/rating-summary").json()
        reviews = client.get(f"/api/restaurants/{test_restaurant}/reviews").json()["reviews"]
        target = reviews[0]["id"]
        client.delete(f"/api/reviews/{target}")
        after = client.get(f"/api/restaurants/{test_restaurant}/rating-summary").json()
        assert after["totalReviews"] == before["totalReviews"] - 1