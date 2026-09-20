export interface Restaurant {
  id: string
  name: string
  description: string | null
  cuisines: string[]
  location: string
  city: string
  address: string | null
  createdAt: string
  updatedAt: string
}

export interface Review {
  id: string
  restaurantId: string
  rating: number
  review: string
  createdAt: string
  updatedAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ReviewsPage {
  reviews: Review[]
  pagination: Pagination
}

export interface RatingDistribution {
  '5': number
  '4': number
  '3': number
  '2': number
  '1': number
}

export interface RatingSummary {
  averageRating: number
  totalReviews: number
  distribution: RatingDistribution
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
  }
}

export type SortOption = 'recent' | 'relevant'
export type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1'