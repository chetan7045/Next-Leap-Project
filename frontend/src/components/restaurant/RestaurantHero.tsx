import type { Restaurant } from '../../types'

export function RestaurantHero({ restaurant }: { restaurant: Restaurant }) {
  return (
    <section className="overflow-hidden rounded-card border border-line bg-white shadow-card">
      <div
        className="relative h-52 sm:h-72"
        role="img"
        aria-label={`Visual for ${restaurant.name}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-400 to-amber-300" />
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:28px_28px]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
        <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-primary-300" />
          Open for reviews
        </span>
      </div>

      <div className="px-5 pb-6 pt-5 sm:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {restaurant.name}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-ink-soft">
          <span>{restaurant.cuisines.join(' • ')}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center">
            <svg viewBox="0 0 16 16" className="mr-1 h-4 w-4 text-primary-500" aria-hidden="true">
              <path
                fill="currentColor"
                d="M8 1.5a4.75 4.75 0 00-4.75 4.75c0 3.55 4.75 8.25 4.75 8.25s4.75-4.7 4.75-8.25A4.75 4.75 0 008 1.5zm0 6.5A1.75 1.75 0 118 4.75 1.75 1.75 0 018 8z"
              />
            </svg>
            {restaurant.location}, {restaurant.city}
          </span>
        </p>
        {restaurant.description && (
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
            {restaurant.description}
          </p>
        )}
        {restaurant.address && (
          <p className="mt-3 text-xs font-medium text-stone-400">{restaurant.address}</p>
        )}
      </div>
    </section>
  )
}