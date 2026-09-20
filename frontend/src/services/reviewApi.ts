import { apiFetch } from './api'
import type { RatingFilter, Review, ReviewsPage, SortOption } from '../types'

export interface ReviewQuery {
  sort: SortOption
  rating: RatingFilter
  page: number
  limit: number
}

export const reviewApi = {
  async list(restaurantId: string, query: ReviewQuery): Promise<ReviewsPage> {
    const params = new URLSearchParams({
      sort: query.sort,
      page: String(query.page),
      limit: String(query.limit),
    })
    if (query.rating !== 'all') {
      params.set('rating', query.rating)
    }
    return apiFetch<ReviewsPage>(
      `/restaurants/${restaurantId}/reviews?${params.toString()}`,
    )
  },

  async create(
    restaurantId: string,
    payload: { rating: number; review: string },
  ): Promise<Review> {
    return apiFetch<Review>(`/restaurants/${restaurantId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async update(
    reviewId: string,
    payload: { rating: number; review: string },
  ): Promise<Review> {
    return apiFetch<Review>(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  async remove(reviewId: string): Promise<void> {
    return apiFetch<void>(`/reviews/${reviewId}`, { method: 'DELETE' })
  },
}