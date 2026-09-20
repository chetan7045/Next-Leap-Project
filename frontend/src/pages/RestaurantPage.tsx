import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useReviews } from '../hooks/useReviews'
import { restaurantApi } from '../services/restaurantApi'
import type { Restaurant, RatingSummary } from '../types'
import { RestaurantHero } from '../components/restaurant/RestaurantHero'
import { RatingSummaryCard } from '../components/restaurant/RatingSummaryCard'
import { ReviewList } from '../components/review/ReviewList'
import { WriteReviewModal } from '../components/review/WriteReviewModal'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/States'
import { HeroSkeleton, SummarySkeleton } from '../components/ui/Skeletons'

export function RestaurantPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>()
  const id = restaurantId ?? ''

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [summary, setSummary] = useState<RatingSummary | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const successTimer = useRef<number | undefined>(undefined)

  const reviews = useReviews(id)
  const reviewsRef = useRef(reviews)
  reviewsRef.current = reviews

  const fetchRestaurantAndSummary = useCallback(async () => {
    if (!id) return
    setLoadError(false)
    setRestaurant(null)
    setSummary(null)
    try {
      const [restaurantData, summaryData] = await Promise.all([
        restaurantApi.getById(id),
        restaurantApi.getRatingSummary(id),
      ])
      setRestaurant(restaurantData)
      setSummary(summaryData)
    } catch {
      setLoadError(true)
    }
  }, [id])

  useEffect(() => {
    void fetchRestaurantAndSummary()
  }, [fetchRestaurantAndSummary])

  useEffect(() => () => window.clearTimeout(successTimer.current), [])

  function handleWriteClick() {
    setShowModal(true)
  }

  const handleSubmitted = useCallback(async () => {
    setShowModal(false)
    setShowSuccess(true)
    window.clearTimeout(successTimer.current)
    successTimer.current = window.setTimeout(() => setShowSuccess(false), 5000)
    try {
      const [summaryData] = await Promise.all([restaurantApi.getRatingSummary(id)])
      setSummary(summaryData)
    } catch {
      // keep previous summary if the refresh fails
    }
    reviewsRef.current.setSort('recent')
    reviewsRef.current.setRating('all')
    reviewsRef.current.reload()
  }, [id])

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState
          title="We couldn't load this restaurant."
          message="Please check the link and try again."
          onRetry={fetchRestaurantAndSummary}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {!restaurant ? (
        <HeroSkeleton />
      ) : (
        <>
          <RestaurantHero restaurant={restaurant} />
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
            <div className="animate-fade-up order-2 space-y-6 lg:order-1">
              {showSuccess && (
                <div
                  role="status"
                  className="animate-fade-up flex items-start gap-3 rounded-card border border-emerald-200 bg-emerald-50 px-4 py-3"
                >
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true">
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4 10-10"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Review submitted</p>
                    <p className="text-sm text-emerald-700">
                      Thanks for sharing your experience. Your review is live above.
                    </p>
                  </div>
                </div>
              )}

              <ReviewList
                {...reviews}
                onWrite={handleWriteClick}
              />
            </div>

            <aside className="order-1 space-y-5 lg:order-2 lg:sticky lg:top-24">
              {!summary ? (
                <SummarySkeleton />
              ) : (
                <>
                  <RatingSummaryCard summary={summary} />
                  <Button className="w-full" onClick={handleWriteClick}>
                    Write a Review
                  </Button>
                  <p className="px-2 text-center text-xs font-medium text-stone-400">
                    Your review is visible to everyone on Rasa.
                  </p>
                </>
              )}
            </aside>
          </div>
        </>
      )}

      {restaurant && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <Button className="w-full" onClick={handleWriteClick}>
            Write a Review
          </Button>
        </div>
      )}

      {showModal && restaurant && (
        <WriteReviewModal
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          onClose={() => setShowModal(false)}
          onSubmitted={handleSubmitted}
        />
      )}
    </div>
  )
}