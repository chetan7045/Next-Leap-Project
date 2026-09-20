import type { ReactNode } from 'react'
import { Button } from './Button'

export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="rounded-card border border-primary-100 bg-primary-50/50 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary-600" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            d="M12 8v5m0 3v.01M12 3l9 6v6l-9 6-9-6V9l9-6z"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      {message && <p className="mt-1 text-sm text-ink-soft">{message}</p>}
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function EmptyReviews({
  onWrite,
}: {
  onWrite: () => void
}) {
  return (
    <div className="rounded-card border border-line bg-white p-10 text-center shadow-card">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-primary-500" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m-8-4a8 8 0 1016 0"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-bold text-ink">No reviews yet</h3>
      <p className="mt-1 text-sm text-ink-soft">
        Be the first to share your experience.
      </p>
      <Button className="mt-5" onClick={onWrite}>
        Write the first review
      </Button>
    </div>
  )
}

export function InlineNotice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="text-sm font-medium text-ink-soft">
      {children}
    </p>
  )
}