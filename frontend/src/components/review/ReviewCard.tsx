import type { Review } from '../../types'
import { formatDate, isEdited, timeAgo } from '../../utils/time'
import { StarRating } from '../ui/StarRating'

function Avatar({ seed }: { seed: string }) {
  const palette = [
    'bg-primary-100 text-primary-700',
    'bg-amber-100 text-amber-700',
    'bg-emerald-100 text-emerald-700',
    'bg-sky-100 text-sky-700',
    'bg-violet-100 text-violet-700',
  ]
  const index = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % palette.length
  return (
    <span
      aria-hidden="true"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-extrabold ${palette[index]}`}
    >
      {seed.slice(0, 1).toUpperCase()}
    </span>
  )
}

export function ReviewCard({ review }: { review: Review }) {
  const edited = isEdited(review)
  const oldEnoughForDate = new Date(review.createdAt).getFullYear() < new Date().getFullYear()

  const timestamp = oldEnoughForDate
    ? formatDate(review.createdAt)
    : timeAgo(review.createdAt)

  return (
    <article className="rounded-card border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-md sm:p-6">
      <div className="flex items-start gap-4">
        <Avatar seed={review.id} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-2 py-1 text-sm font-bold text-primary-700">
              {review.rating.toFixed(1)}
              <StarRating rating={review.rating} size={12} />
            </span>
          </div>

          <p className="mt-3 text-[15px] leading-relaxed text-ink">{review.review}</p>

          <p className="mt-3 text-xs font-medium text-ink-soft">
            {timestamp}
            {edited && (
              <span className="text-stone-400">
                {' '}
                · Updated {timeAgo(review.updatedAt)}
              </span>
            )}
          </p>
        </div>
      </div>
    </article>
  )
}