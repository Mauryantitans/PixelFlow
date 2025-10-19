from fastapi import APIRouter
from .routes import images, images_db, processing, processing_db, auth, oauth, pipelines, admin
from ..core.config import settings

api_router = APIRouter()

# Include route modules
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["authentication"]
)

api_router.include_router(
    oauth.router,
    prefix="/auth",
    tags=["oauth"]
)

api_router.include_router(
    pipelines.router,
    prefix="/pipelines",
    tags=["pipelines"]
)

# Use database or filesystem image storage based on config
if settings.IMAGE_STORAGE == "database":
    api_router.include_router(
        images_db.router,
        prefix="/images",
        tags=["images"]
    )
    api_router.include_router(
        processing_db.router,
        prefix="/processing",
        tags=["processing"]
    )
else:
    api_router.include_router(
        images.router,
        prefix="/images",
        tags=["images"]
    )
    api_router.include_router(
        processing.router,
        prefix="/processing",
        tags=["processing"]
    )

api_router.include_router(
    admin.router,
    tags=["admin"]
)

# Root endpoint
@api_router.get("/")
async def root():
    return {
        "message": "PixelFlow API",
        "version": "1.0.0",
        "status": "running"
    }

@api_router.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "PixelFlow API"
    }
