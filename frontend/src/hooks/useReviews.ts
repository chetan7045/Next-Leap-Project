import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { reviewApi } from '../services/reviewApi'
import type { RatingFilter, Review, SortOption } from '../types'

const PAGE_SIZE = 10

interface UseReviews {
  reviews: Review[]
  total: number
  hasMore: boolean
  loading: boolean
  loadingMore: boolean
  error: string | null
  sort: SortOption
  rating: RatingFilter
  setSort: (sort: SortOption) => void
  setRating: (rating: RatingFilter) => void
  loadMore: () => void
  reload: () => void
}

export function useReviews(restaurantId: string): UseReviews {
  const [sort, setSort] = useState<SortOption>('recent')
  const [rating, setRating] = useState<RatingFilter>('all')
  const [page, setPage] = useState(1)
  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const hasMore = useMemo(() => reviews.length < total, [reviews.length, total])

  const runFetch = useCallback(
    async (pageNumber: number, append: boolean, currentSort: SortOption, currentRating: RatingFilter) => {
      const id = ++requestId.current
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError(null)
      try {
        const data = await reviewApi.list(restaurantId, {
          sort: currentSort,
          rating: currentRating,
          page: pageNumber,
          limit: PAGE_SIZE,
        })
        if (id !== requestId.current) return
        setReviews((prev) => (append ? [...prev, ...data.reviews] : data.reviews))
        setTotal(data.pagination.total)
        setPage(pageNumber)
      } catch {
        if (id !== requestId.current) return
        setError('We couldn\'t load reviews.')
      } finally {
        if (id === requestId.current) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [restaurantId],
  )

  useEffect(() => {
    void runFetch(1, false, sort, rating)
  }, [runFetch, sort, rating])

  const loadMore = useCallback(() => {
    void runFetch(page + 1, true, sort, rating)
  }, [runFetch, page, sort, rating])

  const reload = useCallback(() => {
    void runFetch(1, false, sort, rating)
  }, [runFetch, sort, rating])

  return {
    reviews,
    total,
    hasMore,
    loading,
    loadingMore,
    error,
    sort,
    rating,
    setSort,
    setRating,
    loadMore,
    reload,
  }
}