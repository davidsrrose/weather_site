from fastapi import APIRouter

from fastapi_app.routes.health import router as health_router

router = APIRouter()
router.include_router(health_router)
