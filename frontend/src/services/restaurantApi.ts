import { apiFetch } from './api'
import type { Restaurant, RatingSummary } from '../types'

export const restaurantApi = {
  async list(): Promise<Restaurant[]> {
    return apiFetch<Restaurant[]>('/restaurants')
  },

  async getById(id: string): Promise<Restaurant> {
    return apiFetch<Restaurant>(`/restaurants/${id}`)
  },

  async getRatingSummary(id: string): Promise<RatingSummary> {
    return apiFetch<RatingSummary>(`/restaurants/${id}/rating-summary`)
  },
}