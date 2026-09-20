const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function plural(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? '' : 's'}`
}

/** Format an ISO timestamp as a friendly relative time ("3 days ago"). */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const timestamp = new Date(iso).getTime()
  if (!Number.isFinite(timestamp)) return ''
  const diff = now.getTime() - timestamp
  if (diff < MINUTE) return 'just now'
  if (diff < HOUR) return `${plural(Math.floor(diff / MINUTE), 'minute')} ago`
  if (diff < DAY) return `${plural(Math.floor(diff / HOUR), 'hour')} ago`
  if (diff < 30 * DAY) return `${plural(Math.floor(diff / DAY), 'day')} ago`
  if (diff < 365 * DAY) return `${plural(Math.floor(diff / (30 * DAY)), 'month')} ago`
  return `${plural(Math.floor(diff / (365 * DAY)), 'year')} ago`
}

/** Absolute date for older reviews: "12 Mar 2025". */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** True when a review's updatedAt is materially newer than createdAt. */
export function isEdited(review: { createdAt: string; updatedAt: string }): boolean {
  return new Date(review.updatedAt).getTime() - new Date(review.createdAt).getTime() > MINUTE
}