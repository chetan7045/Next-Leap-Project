# Rasa

**Rasa** is a production-structured restaurant reviews and ratings prototype, inspired by the Zomato review experience. It demonstrates a complete, genuinely-working vertical slice:

`Restaurant → Restaurant Details → Rating Summary → Reviews → Filtering/Sorting → Write Review → Submit → Persist → Updated Rating Summary`

The first (and currently only) restaurant is **HOPS Mumbai, Versova** — a bar and restaurant serving Indian and Chinese cuisine. The architecture is entirely restaurant-ID driven: HOPS is simply the first restaurant in a future multi-restaurant platform. Nothing in the code assumes HOPS is the only restaurant.

---

## 1. Product

- Open a restaurant page (`. /restaurants/{restaurantId}`).
- See restaurant info, overall rating, total review count and a live rating distribution.
- Browse reviews with **recent** and **relevant** sorting.
- Filter by **All / 5★ / 4★ / 3★ / 2★ / 1★** — filtering and sorting work together and are evaluated by the backend.
- Submit a review (interactive star picker + validated text).
- The average rating, review count and distribution update immediately without a page refresh.

Out of scope for the MVP (but architecturally accommodated): food ordering, payments, delivery, owner dashboards, authentication, maps, chat, notifications, image uploads and AI-generated reviews.

---

## 2. Architecture

```
React + Tailwind (Vite)
        │  HTTP / JSON
        ▼
FastAPI (Routers → Service layer → Prisma)
        │
        ▼
Prisma ORM (migrations)
        │
        ▼
Neon PostgreSQL
```

- **Frontend** — React 19, TypeScript, Tailwind CSS v4, Vite, React Router. A clean service layer (`src/services/`) wraps all HTTP; components never talk to URLs directly.
- **Backend** — Python 3.14, FastAPI, Pydantic v2, Prisma Python client. Business logic lives in a service layer, not route handlers. Swagger/OpenAPI docs are served at `/docs`.
- **Database** — Neon PostgreSQL, schema owned by Prisma (`backend/prisma/schema.prisma` is the source of truth) and applied via committed migrations.

---

## 3. Folder structure

```
rasa/
├── frontend/                  # React + Vite + Tailwind app
│   ├── src/
│   │   ├── components/        # Shared, single-responsibility components
│   │   │   ├── layout/        # Header, branding mark
│   │   │   ├── restaurant/    # Hero, rating summary / distribution
│   │   │   ├── review/        # List, card, toolbar, write-review modal
│   │   │   └── ui/            # Buttons, stars, skeletons, states
│   │   ├── hooks/             # useReviews (sort/filter/pagination logic)
│   │   ├── pages/             # HomePage, RestaurantPage
│   │   ├── services/          # api.ts + restaurantApi.ts + reviewApi.ts
│   │   ├── types/             # Shared API types
│   │   └── utils/             # Relative-time formatting
│   ├── vite.config.ts         # Dev proxy /api → localhost:8000
│   └── ...
├── backend/
│   ├── app/
│   │   ├── api/               # FastAPI routers (restaurants, reviews)
│   │   ├── schemas/           # Pydantic request/response models
│   │   ├── services/          # Business logic incl. relevance ranking
│   │   ├── database/          # Prisma client lifecycle
│   │   ├── config.py          # Environment/secrets configuration layer
│   │   ├── errors.py          # Consistent error responses + handlers
│   │   ├── main.py            # FastAPI app, CORS, router mounting
│   │   └── generated/prisma/  # Committed Prisma Python client (generated)
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema (source of truth)
│   │   └── migrations/        # Committed SQL migrations
│   ├── api/index.py           # Vercel serverless ASGI entrypoint
│   ├── tests/                 # Backend pytest suite
│   └── requirements.txt
├── seeds/
│   ├── seed.py                # Upsert HOPS + recreate review dataset
│   └── run-seed.sh
├── secrets.example.json       # Placeholders ONLY (never real values)
├── .gitignore                 # secrets.json excluded
└── README.md
```

---

## 4. Database

Two primary entities:

```
Restaurant (1) ──────────── (N) Review
  id          UUID            id           UUID
  name        Text            restaurantId UUID  → Restaurant.id
  description Text?           rating       Int   (1–5, DB-checked in app)
  cuisines    String[]        review       Text
  location    Text            createdAt    DateTime (UTC)
  city        Text            updatedAt    DateTime (UTC)
  address     Text?
  createdAt   DateTime (UTC)
  updatedAt   DateTime (UTC)
```

- `Review.restaurantId → Restaurant.id` with **`ON DELETE RESTRICT`** — a restaurant with reviews cannot be accidentally deleted.
- Indexes on `restaurantId`, `(restaurantId, createdAt)`, `(restaurantId, rating)` to support rating summary, recent sorting and rating filtering.
- **Ratings are never stored on the Restaurant row.** The overall rating, review count and distribution are always computed from the `Review` table on every request.

---

## 5. API documentation

Interactive docs: `http://localhost:8000/docs` (Swagger/OpenAPI).

Base URL: `/api`

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/api/restaurants` | List restaurants (supports future discovery) |
| `GET` | `/api/restaurants/{restaurant_id}` | Restaurant details |
| `GET` | `/api/restaurants/{restaurant_id}/rating-summary` | `averageRating`, `totalReviews`, `distribution` (computed live) |
| `GET` | `/api/restaurants/{restaurant_id}/reviews` | Paginated reviews with `sort` and `rating` filters |
| `POST` | `/api/restaurants/{restaurant_id}/reviews` | Create a review (201) |
| `PUT` | `/api/reviews/{review_id}` | Update rating and/or text; refreshes `updatedAt` |
| `DELETE` | `/api/reviews/{review_id}` | Hard-delete a review (204) |

### Query parameters — `GET .../reviews`

| Param | Values | Default |
| ----- | ------ | ------- |
| `sort` | `recent` \| `relevant` | `recent` |
| `rating` | `1`–`5` | unset (all) |
| `page` | `>= 1` | `1` |
| `limit` | `1–50` | `10` |

Response shape:

```json
{
  "reviews": [{ "id": "...", "restaurantId": "...", "rating": 5, "review": "...",
                "createdAt": "2026-09-01T09:20:11.002Z", "updatedAt": "..." }],
  "pagination": { "page": 1, "limit": 10, "total": 24, "totalPages": 3 }
}
```

### Rating summary

```json
{
  "averageRating": 4.0,
  "totalReviews": 24,
  "distribution": { "5": 10, "4": 8, "3": 3, "2": 2, "1": 1 }
}
```

### Errors

All errors share one shape:

```json
{ "error": { "code": "RESTAURANT_NOT_FOUND", "message": "Restaurant not found." } }
```

Status codes: `200` success, `201` created, `204` deleted, `400`/`422` bad input, `404` missing resource, `500` server error.

### Validation

- `rating`: integer, required, 1–5.
- `review`: required, 10–2000 characters.
- `restaurantId`: must reference an existing restaurant.

### "Relevant" sorting — prototype relevance ranking

This is a transparent, deterministic backend heuristic. **It does not represent Zomato's or any real-world ranking algorithm.**

```
relevanceScore = 0.5 · recencyScore + 0.3 · qualityScore + 0.2 · detailScore

recencyScore = exp(−ageDays / 180)                     // newer reviews win
qualityScore = max(0, 1 − |rating − avgRestaurant| / 4) // penalises extreme/spam-like ratings
detailScore = min(len(text) / 200, 1)                  // rewards substantive text
```

Implemented in `backend/app/services/relevance.py`, isolated so it can be replaced with a more sophisticated ranking system later.

---

## 6. Local setup

Prerequisites: Node 20+, Python 3.12+ (project tested on 3.14), `uv` (recommended) or `pip`, and a Neon PostgreSQL instance.

### 1. Install dependencies

```bash
# Frontend
cd frontend && npm install

# Backend (creates a venv in backend/.venv)
cd ../backend
uv venv .venv --python 3.14        # or: python3 -m venv .venv
uv pip install --python .venv/bin/python -r requirements.txt
```

### 2. Configure secrets

Copy the example and fill in your real values (this file is gitignored — never commit it):

```bash
cp secrets.example.json secrets.json
# edit secrets.json:
#   "DATABASE_URL": "postgresql://user:pass@host/db?sslmode=require",
#   "GITHUB_TOKEN":   (only if you need GitHub automation)
```

`secrets.json` is read by the backend for local development. In production, secrets come from the deployment platform's environment (see Deployment), never from a committed file.

### 3. Apply the database schema

```bash
cd backend
bash scripts/with_secrets.sh prisma migrate deploy
```

This applies the committed migrations in `backend/prisma/migrations` to Neon.

### 4. Seed HOPS Mumbai + reviews

```bash
bash ../seeds/run-seed.sh
```

The seed is **repeatable and idempotent**:

- Upserts HOPS Mumbai via a fixed UUID — it never creates a duplicate restaurant.
- Deletes all existing HOPS reviews and recreates the prototype set of **24 reviews** (10× 5★, 8× 4★, 3× 3★, 2× 2★, 1× 1★).
- Every review has a distinct `createdAt` spread across time so recent sorting is meaningful.

### 5. Start the backend

```bash
cd backend
bash scripts/with_secrets.sh uvicorn app.main:app --reload --port 8000
```

Swagger is available at `http://localhost:8000/docs`.

### 6. Start the frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to `localhost:8000`.

### Database migration workflow

To add a model/field: edit `backend/prisma/schema.prisma`, then generate and create a migration:

```bash
cd backend
bash scripts/with_secrets.sh prisma generate
bash scripts/with_secrets.sh prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma --script \
  > prisma/migrations/<timestamp>_name/migration.sql
bash scripts/with_secrets.sh prisma migrate deploy
```

> Note: Neon doesn't allow `prisma migrate dev` (it needs a shadow database), so migrations are authored with `migrate diff` and applied with `migrate deploy`.

---

## 7. Testing

### Backend

```bash
cd backend
bash scripts/with_secrets.sh python -m pytest tests/ -q
```

Covers: get/list restaurant, review listing, recent & relevant sorting, rating filtering, rating summary correctness, create/update/delete review, summary updates after create/delete, and validation (invalid rating, empty/short/overlong review, missing fields, missing restaurant/review). Tests use an isolated throwaway restaurant and never mutate seeded data.

### Frontend

```bash
cd frontend
npm run test      # vitest: time util + write-review modal validation
npm run build     # type-check + production build
```

### Manual happy path

1. `npm run dev` + backend running.
2. Open `http://localhost:5173` → click **HOPS Mumbai**.
3. See hero, rating `4.0`, 24 reviews, distribution bars.
4. Switch **Relevant** / click a star filter → list reloads from the API.
5. **Write a Review** → pick stars → write ≥ 10 characters → **Submit Review**.
6. Modal closes with a success banner; total count, distribution, average and the new review update without a refresh.

---

## 8. Environment & secrets

- Local development uses a gitignored `secrets.json` at the repo root.
- `secrets.example.json` contains **placeholders only** and is safe to commit.
- Secrets are **never** bundled into the frontend, returned by an API, logged, or committed. The frontend only ever talks to `/api` (same-origin in dev via the Vite proxy).
- The backend config layer (`backend/app/config.py`) prefers environment variables and falls back to `secrets.json` for local development.

### Production secret handling (Vercel)

Vercel does not treat a local `secrets.json` as secure production configuration. For production you must inject secrets through **Vercel's environment variables** (Dashboard → Project → Settings → Environment Variables, or `vercel env add`). Configure at minimum:

- Frontend project: `VITE_API_BASE_URL` = the deployed backend URL.
- Backend project: `DATABASE_URL` = the Neon connection string, `ALLOWED_ORIGINS` = comma-separated frontend origin(s).

The application never depends on a committed secrets file for production.

---

## 9. Deployment (Vercel)

Two independent Vercel projects built from the monorepo:

```
Frontend  →  Vercel (React/Vite preset), root = frontend/
Backend   →  Vercel (Python runtime),    root = backend/   (ASGI app in backend/api/index.py)
```

- **Frontend**: Vercel auto-detects Vite. Set `VITE_API_BASE_URL` to the backend's production URL (`https://<backend>.vercel.app`). The SPA route `/restaurants/:id` is handled client-side by React Router.
- **Backend**: Vercel's Python runtime serves the FastAPI app via `backend/api/index.py`. Set `DATABASE_URL` and `ALLOWED_ORIGINS` (the frontend origin) as Vercel environment variables. CORS is configured per-origin, never `*`, in production. Note: serverless cold starts and Neon's pooled connection are expected; keep `connection_limit` low / use the Neon pooler URL (both are used for the prototype).

CORS origins: `ALLOWED_ORIGINS` env var (comma-separated) in production; `http://localhost:5173` by default in development.

---

## 10. Code quality notes

- Service layer isolates database and business logic from route handlers.
- Relevance ranking is confined to one module and is fully documented.
- Components are small and single-purpose; HTTP lives in one service layer.
- Loading (skeletons), empty and error states exist for every async view.
- The UI is keyboard-accessible (stars are radio-style buttons, the modal traps Escape, focus rings everywhere) and responsive from mobile to desktop.
- Timestamps are stored in UTC and rendered as friendly relative time on the frontend.