from fastapi import APIRouter

from app.api import router as app_api_router
from fastapi_app.routes.health import router as health_router
from fastapi_app.routes.zip_geocode_router import router as zip_geocode_router

router = APIRouter()
router.include_router(health_router)
router.include_router(zip_geocode_router)
router.include_router(app_api_router)
