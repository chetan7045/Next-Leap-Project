import { useState } from 'react'

function StarGlyph({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 2.5l2.9 5.9 6.5.94-4.7 4.58 1.1 6.48L12 17.4l-5.8 3l1.1-6.49-4.7-4.57 6.5-.94L12 2.5z"
      />
    </svg>
  )
}

/** Fraction-aware star row for display (e.g. rating 4.3). */
export function StarRating({ rating, size = 18 }: { rating: number; size?: number }) {
  const full = Math.round(rating)
  const stars = Array.from({ length: 5 }, (_, i) => {
    const fill = Math.min(Math.max(rating - i, 0), 1)
    return (
      <span
        key={i}
        className="relative inline-block shrink-0"
        style={{ width: size, height: size }}
      >
        <span className="absolute inset-0 text-stone-300">
          <StarGlyph size={size} />
        </span>
        <span
          className="absolute inset-0 overflow-hidden text-primary-500"
          style={{ width: `${fill * 100}%` }}
        >
          <StarGlyph size={size} />
        </span>
      </span>
    )
  })

  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`${full} out of 5 stars`}
    >
      {stars}
    </span>
  )
}

/**
 * Keyboard-accessible interactive star picker.
 * Buttons expose "Rate 4 out of 5" semantics; hover/click set the value.
 */
export function InteractiveStars({
  value,
  onChange,
  size = 28,
}: {
  value: number
  onChange: (value: number) => void
  size?: number
}) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value

  return (
    <div
      className="inline-flex items-center gap-1"
      role="radiogroup"
      aria-label="Select a rating"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= active
        const label = `${star} star${star === 1 ? '' : 's'}`
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`Rate ${label}`}
            title={label}
            className="cursor-pointer rounded-md p-0.5 transition-transform duration-100 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 hover:scale-110"
            style={{ color: filled ? 'var(--color-primary-500)' : 'var(--color-stone-300)' }}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onFocus={() => setHovered(star)}
            onBlur={() => setHovered(0)}
            onClick={() => onChange(star)}
          >
            <StarGlyph size={size} />
          </button>
        )
      })}
    </div>
  )
}