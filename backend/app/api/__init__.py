from fastapi import APIRouter
from .routes import images, processing

api_router = APIRouter()

# Include route modules
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