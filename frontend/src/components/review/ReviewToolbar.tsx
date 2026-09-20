import type { RatingFilter, SortOption } from '../../types'

const SORTS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'relevant', label: 'Relevant' },
]

const RATINGS: { value: RatingFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: '5', label: '5★' },
  { value: '4', label: '4★' },
  { value: '3', label: '3★' },
  { value: '2', label: '2★' },
  { value: '1', label: '1★' },
]

interface ReviewToolbarProps {
  sort: SortOption
  rating: RatingFilter
  onSortChange: (sort: SortOption) => void
  onRatingChange: (rating: RatingFilter) => void
  disabled?: boolean
}

export function ReviewToolbar({
  sort,
  rating,
  onSortChange,
  onRatingChange,
  disabled,
}: ReviewToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div
        className="inline-flex rounded-full border border-line bg-white p-1 shadow-sm"
        role="group"
        aria-label="Sort reviews"
      >
        {SORTS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={sort === option.value}
            onClick={() => onSortChange(option.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed ${
              sort === option.value
                ? 'bg-ink text-white'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Filter by rating"
      >
        {RATINGS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={rating === option.value}
            onClick={() => onRatingChange(option.value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed ${
              rating === option.value
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-line bg-white text-ink-soft hover:border-stone-300 hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}