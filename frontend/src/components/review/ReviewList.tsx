import { Button } from '../ui/Button'
import { ErrorState, EmptyReviews, InlineNotice } from '../ui/States'
import { ReviewsSkeleton } from '../ui/Skeletons'
import { ReviewCard } from './ReviewCard'
import { ReviewToolbar } from './ReviewToolbar'
import type { useReviews } from '../../hooks/useReviews'

type ReviewsState = ReturnType<typeof useReviews>

export function ReviewList({
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
  onWrite,
}: ReviewsState & { onWrite: () => void }) {
  const showToolbar = !loading && !error && (total > 0 || reviews.length > 0)

  return (
    <div id="reviews" className="scroll-mt-20 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">Customer Reviews</h2>
        {!loading && !error && total > 0 && (
          <span className="pb-0.5 text-sm font-semibold text-ink-soft">
            {total} review{total === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {showToolbar && (
        <ReviewToolbar
          sort={sort}
          rating={rating}
          onSortChange={setSort}
          onRatingChange={setRating}
          disabled={loading}
        />
      )}

      {loading && <ReviewsSkeleton />}

      {!loading && error && (
        <ErrorState
          title="We couldn't load reviews."
          message={error}
          onRetry={reload}
        />
      )}

      {!loading && !error && reviews.length === 0 && <EmptyReviews onWrite={onWrite} />}

      {!loading && !error && reviews.length > 0 && (
        <>
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li key={review.id}>
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="pt-1 text-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading reviews…' : 'Load more reviews'}
              </Button>
            </div>
          )}
          {!hasMore && total > 5 && <InlineNotice>You've seen all reviews</InlineNotice>}
        </>
      )}
    </div>
  )
}