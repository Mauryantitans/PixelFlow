import logging
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.config import settings
from .core.database import init_db
from .core.security_config import CORSSettings
from .api import api_router
from .utils.session_manager import session_manager
from .middleware import RateLimitMiddleware, SecurityHeadersMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown"""
    # Startup
    logger.info("Starting PixelFlow backend...")
    
    # Initialize database
    try:
        init_db()
        logger.info("Database initialized successfully")
        
        # Create first admin if needed
        from .core.database import SessionLocal
        from .utils.init_admin import create_first_admin_if_needed
        db = SessionLocal()
        try:
            create_first_admin_if_needed(db)
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
    
    # Clean up any leftover files from previous runs
    session_manager.cleanup_all_files()
    
    # Start background cleanup task
    await session_manager.start_cleanup_task()
    
    logger.info("PixelFlow backend started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down PixelFlow backend...")
    
    # Stop background tasks
    await session_manager.stop_cleanup_task()
    
    # Clean up all files
    session_manager.cleanup_all_files()
    
    logger.info("PixelFlow backend shutdown complete")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="PixelFlow - Visual Image Processing Pipeline Builder",
    lifespan=lifespan
)

# Add CORS middleware
logger.info(f"Configuring CORS with {len(settings.CORS_ORIGINS)} allowed origins:")
for origin in settings.CORS_ORIGINS:
    logger.info(f"  ✓ {origin}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=CORSSettings.ALLOW_CREDENTIALS,
    allow_methods=CORSSettings.ALLOW_METHODS,
    allow_headers=CORSSettings.ALLOW_HEADERS,
    expose_headers=CORSSettings.EXPOSE_HEADERS,
)

# Add security middlewares
app.add_middleware(RateLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# Include API routes
app.include_router(api_router, prefix="/api")

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )

# Root endpoint
@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "message": "PixelFlow Backend API",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint with security status"""
    from .middleware.rate_limit import RateLimitMiddleware
    from .middleware.security_headers import get_headers_info
    from .core.security_config import RateLimiting, SecurityHeaders, LoginSecurity
    
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "cors_origins": settings.CORS_ORIGINS,  # DEBUG: Show CORS origins
        "sessions": session_manager.get_session_stats(),
        "security": {
            "rate_limiting": {
                "enabled": RateLimiting.ENABLED,
                "stats": RateLimitMiddleware.get_stats()
            },
            "security_headers": get_headers_info(),
            "login_security": {
                "max_attempts": LoginSecurity.MAX_ATTEMPTS,
                "lockout_minutes": int(LoginSecurity.LOCKOUT_DURATION.total_seconds() / 60)
            }
        }
    }

# Legacy endpoints for compatibility with the original frontend
@app.post("/upload")
async def legacy_upload(file, session_id: str):
    """Legacy upload endpoint - redirects to new API"""
    from .api.routes.images import upload_image
    return await upload_image(file, session_id)

@app.post("/process")
async def legacy_process(request):
    """Legacy process endpoint - redirects to new API"""
    from .api.routes.processing import process_images
    return await process_images(request)

@app.post("/process-live")
async def legacy_process_live(request):
    """Legacy process-live endpoint - redirects to new API"""
    from .api.routes.processing import process_live
    return await process_live(request)

@app.post("/cleanup-session")
async def legacy_cleanup_session(request):
    """Legacy cleanup endpoint - redirects to new API"""
    from .api.routes.images import cleanup_session
    return await cleanup_session(request)

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )