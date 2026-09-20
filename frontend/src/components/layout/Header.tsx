import { Link } from 'react-router-dom'

export function RasaMark({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#f43f5e" />
      <path
        d="M10 8h7.2c3.4 0 5.6 1.9 5.6 4.9 0 2.2-1.3 3.8-3.3 4.4l4 6.7h-3.9l-3.6-6.2h-2.9V24H10V8zm3.1 2.7v4.1h3.6c1.6 0 2.6-.8 2.6-2.1s-1-2-2.6-2h-3.6z"
        fill="#fff"
      />
    </svg>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <RasaMark className="h-8 w-auto" />
          <span className="text-xl font-extrabold tracking-tight text-ink">Rasa</span>
        </Link>
        <nav aria-label="Primary">
          <Link
            to="/"
            className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-stone-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            Restaurants
          </Link>
        </nav>
      </div>
    </header>
  )
}