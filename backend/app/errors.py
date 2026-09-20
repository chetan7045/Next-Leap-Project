"""Consistent API error types.

Every failure surfaces as:
{
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "message": "Human readable message."
  }
}
"""
from __future__ import annotations

from typing import Callable

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from prisma.errors import PrismaError


class AppError(Exception):
    """Base application error mapped to an HTTP response."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    code: str = "INTERNAL_ERROR"

    def __init__(self, message: str | None = None) -> None:
        self.message = message or self.code.replace("_", " ").capitalize() + "."
        super().__init__(self.message)


class RestaurantNotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "RESTAURANT_NOT_FOUND"


class ReviewNotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "REVIEW_NOT_FOUND"


def error_body(code: str, message: str) -> dict:
    return {"error": {"code": code, "message": message}}


def _json(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content=error_body(code, message))


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        return _json(exc.status_code, exc.code, exc.message)

    @app.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        errors = exc.errors()
        first = errors[0] if errors else {}
        loc = ".".join(
            str(part) for part in first.get("loc", []) if part not in ("body", "query")
        )
        code = "VALIDATION_ERROR"
        if loc == "rating":
            code = "INVALID_RATING"
        elif loc == "review":
            code = "INVALID_REVIEW"
        message = first.get("msg", "Invalid request.")
        return _json(status.HTTP_422_UNPROCESSABLE_CONTENT, code, message)

    @app.exception_handler(PrismaError)
    async def prisma_handler(_: Request, exc: PrismaError) -> JSONResponse:
        return _json(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "DATABASE_ERROR",
            "The database could not complete the request.",
        )

    @app.exception_handler(Exception)
    async def unhandled_handler(_: Request, exc: Exception) -> JSONResponse:
        return _json(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            "Something went wrong on the server.",
        )


# Re-export for convenience in services.
__all__ = [
    "AppError",
    "RestaurantNotFoundError",
    "ReviewNotFoundError",
]