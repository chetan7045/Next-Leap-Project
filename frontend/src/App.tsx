import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { HomePage } from './pages/HomePage'
import { RestaurantPage } from './pages/RestaurantPage'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurants/:restaurantId" element={<RestaurantPage />} />
          <Route
            path="*"
            element={
              <div className="mx-auto max-w-3xl px-4 py-20 text-center">
                <p className="text-2xl font-extrabold text-ink">Page not found</p>
                <p className="mt-2 text-sm text-ink-soft">
                  <a className="font-semibold text-primary-600 underline-offset-2 hover:underline" href="/">
                    Back to Rasa
                  </a>
                </p>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="mx-auto max-w-5xl px-4 pb-16 pt-10 text-center text-xs font-medium text-stone-400 sm:px-6">
        <span className="font-bold text-primary-500">Rasa</span> — a restaurant reviews prototype. Made with care for people who love food.
      </footer>
    </BrowserRouter>
  )
}