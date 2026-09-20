"""Rasa FastAPI application entrypoint."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import restaurants, reviews
from app.config import settings
from app.database.prisma import connect, disconnect
from app.errors import register_exception_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect()
    yield
    await disconnect()


app = FastAPI(
    title="Rasa API",
    version="1.0.0",
    description=(
        "Backend for Rasa, a restaurant reviews and ratings prototype. "
        "HOPS Mumbai (Versova) is the first seeded restaurant; the API is "
        "entirely restaurant-ID driven so more restaurants can be added "
        "without architectural change."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in settings.allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

api = APIRouter(prefix="/api")
api.include_router(restaurants.router)
api.include_router(reviews.router)
app.include_router(api)


@app.get("/", include_in_schema=False)
async def root() -> dict:
    return {"app": settings.app_name, "docs": "/docs"}