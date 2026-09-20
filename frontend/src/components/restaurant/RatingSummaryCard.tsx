import type { RatingSummary } from '../../types'
import { StarRating } from '../ui/StarRating'

const labels = ['5', '4', '3', '2', '1'] as const

function RatingDistribution({
  distribution,
  total,
}: {
  distribution: RatingSummary['distribution']
  total: number
}) {
  return (
    <div className="space-y-1.5">
      {labels.map((key) => {
        const count = distribution[key]
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <div key={key} className="flex items-center gap-3 text-xs font-semibold text-ink-soft">
            <span className="w-3 shrink-0 text-right">{key}</span>
            <span className="text-stone-400" aria-hidden="true">
              ★
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-primary-500 transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right font-medium text-stone-400">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

export function RatingSummaryCard({ summary }: { summary: RatingSummary }) {
  return (
    <section
      className="rounded-card border border-line bg-white p-6 shadow-card"
      aria-label="Rating summary"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-5xl font-extrabold tracking-tight text-ink">
            {summary.averageRating.toFixed(1)}
          </p>
          <div className="mt-2">
            <StarRating rating={summary.averageRating} size={20} />
          </div>
          <p className="mt-2 text-sm font-medium text-ink-soft">
            {summary.totalReviews} review{summary.totalReviews === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="my-5 h-px bg-line" />

      <h3 className="mb-3 text-sm font-bold text-ink">Rating distribution</h3>
      <RatingDistribution distribution={summary.distribution} total={summary.totalReviews} />
    </section>
  )
}