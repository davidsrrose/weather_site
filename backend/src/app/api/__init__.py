"""App API router package."""

from fastapi import APIRouter

from app.api.weather import router as weather_router

router = APIRouter()
router.include_router(weather_router)

