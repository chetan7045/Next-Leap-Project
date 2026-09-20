import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { restaurantApi } from '../services/restaurantApi'
import type { Restaurant } from '../types'
import { RasaMark } from '../components/layout/Header'
import { ErrorState } from '../components/ui/States'
import { Skeleton } from '../components/ui/Skeletons'

export function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    restaurantApi
      .list()
      .then((data) => {
        if (active) setRestaurants(data)
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center">
          <RasaMark className="h-16 w-16" />
        </div>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Honest reviews. <span className="text-primary-500">Real flavours.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-ink-soft">
          Rasa helps you decide where to eat next with genuine, recent reviews
          from people like you.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-extrabold tracking-tight text-ink">Restaurants</h2>

        {error && (
          <div className="mt-4">
            <ErrorState
              title="We couldn't load restaurants."
              onRetry={() => {
                setError(false)
                setRestaurants(null)
                restaurantApi
                  .list()
                  .then(setRestaurants)
                  .catch(() => setError(true))
              }}
            />
          </div>
        )}

        {!error && !restaurants && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="space-y-3 rounded-card border border-line bg-white p-5">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        )}

        {!error && restaurants && restaurants.length === 0 && (
          <p className="mt-6 text-sm font-medium text-ink-soft">No restaurants on Rasa yet.</p>
        )}

        {restaurants && restaurants.length > 0 && (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <li key={restaurant.id}>
                <Link
                  to={`/restaurants/${restaurant.id}`}
                  className="group block overflow-hidden rounded-card border border-line bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  <div className="relative h-36 bg-gradient-to-br from-primary-500 via-primary-400 to-amber-300">
                    <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-extrabold tracking-tight text-ink group-hover:text-primary-600">
                      {restaurant.name}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-ink-soft">
                      {restaurant.cuisines.join(' • ')}
                    </p>
                    <p className="mt-0.5 text-sm text-stone-400">
                      {restaurant.location}, {restaurant.city}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}