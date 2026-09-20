import { useEffect, useRef, useState } from 'react'
import { reviewApi } from '../../services/reviewApi'
import { Button } from '../ui/Button'
import { InteractiveStars } from '../ui/StarRating'

const MIN_LENGTH = 10
const MAX_LENGTH = 2000

interface WriteReviewModalProps {
  restaurantId: string
  restaurantName: string
  onClose: () => void
  onSubmitted: () => void
}

type FieldError = { rating?: string; review?: string }

export function WriteReviewModal({
  restaurantId,
  restaurantName,
  onClose,
  onSubmitted,
}: WriteReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldError>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function validate(): boolean {
    const errors: FieldError = {}
    if (rating === 0) errors.rating = 'Please select a rating.'
    if (reviewText.trim().length === 0) {
      errors.review = 'Please write at least 10 characters.'
    } else if (reviewText.trim().length < MIN_LENGTH) {
      errors.review = `Please write at least ${MIN_LENGTH} characters.`
    } else if (reviewText.length > MAX_LENGTH) {
      errors.review = `Please keep your review under ${MAX_LENGTH} characters.`
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (submitting) return
    if (!validate()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await reviewApi.create(restaurantId, { rating, review: reviewText.trim() })
      onSubmitted()
    } catch {
      setSubmitError('Something went wrong while submitting your review. Please try again.')
      setSubmitting(false)
    }
  }

  const remaining = MAX_LENGTH - reviewText.length

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="write-review-title"
        className="animate-scale-in relative w-full max-w-lg rounded-t-card border border-line bg-white p-6 shadow-2xl sm:rounded-card sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="write-review-title" className="text-2xl font-extrabold tracking-tight text-ink">
              Write a Review
            </h2>
            <p className="mt-1 text-sm font-medium text-ink-soft">{restaurantName}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close review dialog"
            className="rounded-full p-2 text-ink-soft transition-colors hover:bg-stone-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          <fieldset>
            <legend className="text-sm font-bold text-ink">How was your experience?</legend>
            <div className="mt-3">
              <InteractiveStars value={rating} onChange={setRating} size={32} />
            </div>
            {fieldErrors.rating && (
              <p role="alert" className="mt-2 text-xs font-semibold text-primary-600">
                {fieldErrors.rating}
              </p>
            )}
          </fieldset>

          <div>
            <label htmlFor="review-text" className="text-sm font-bold text-ink">
              Tell us about your experience...
            </label>
            <textarea
              id="review-text"
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              rows={5}
              placeholder="What did you order? How was the food, service and ambience?"
              className="mt-2 w-full resize-none rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm leading-relaxed text-ink placeholder:text-stone-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <div className="mt-1.5 flex items-center justify-between text-xs">
              {fieldErrors.review ? (
                <p role="alert" className="font-semibold text-primary-600">
                  {fieldErrors.review}
                </p>
              ) : (
                <span />
              )}
              <span className={`font-medium ${remaining < 0 ? 'text-primary-600' : 'text-stone-400'}`}>
                {remaining} characters left
              </span>
            </div>
          </div>

          {submitError && (
            <p role="alert" className="rounded-lg bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700">
              {submitError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting review…' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}