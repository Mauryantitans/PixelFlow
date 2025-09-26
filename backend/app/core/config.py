import os

class Settings:
    # App settings
    APP_NAME: str = "PixelFlow"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.environ.get("DEBUG", "False").lower() == "true"
    
    # File storage settings
    BASE_DIR: Path = Path(__file__).parent.parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    PROCESSED_DIR: Path = BASE_DIR / "processed"
    
    # Session settings
    SESSION_TIMEOUT: int = 30 * 60
    CLEANUP_INTERVAL: int = 5 * 60
    
    # Image processing settings
    MAX_FILE_SIZE: int = 50 * 1024 * 1024
    ALLOWED_EXTENSIONS: set = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}
    THUMBNAIL_SIZE: tuple = (150, 150)
    
    # Server settings - Updated for production
    HOST: str = "0.0.0.0"  # Allow external connections
    PORT: int = int(os.environ.get("PORT", 8000))  # Use platform port
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://pixel-flow-ivory.vercel.app",  # Your Vercel URL
        "https://*.vercel.app",  # All Vercel preview deployments
    ]
    
    def __init__(self):
        # Create directories if they don't exist
        self.UPLOAD_DIR.mkdir(exist_ok=True)
        self.PROCESSED_DIR.mkdir(exist_ok=True)
