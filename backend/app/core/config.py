from pathlib import Path
import os
from typing import Optional

class Settings:
    # App settings
    APP_NAME: str = "PixelFlow"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # File storage settings
    BASE_DIR: Path = Path(__file__).parent.parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    PROCESSED_DIR: Path = BASE_DIR / "processed"
    
    # Session settings
    SESSION_TIMEOUT: int = 30 * 60  # 30 minutes in seconds
    CLEANUP_INTERVAL: int = 5 * 60  # 5 minutes in seconds
    
    # Image processing settings
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS: set = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}
    THUMBNAIL_SIZE: tuple = (150, 150)
    
    # Server settings
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    def __init__(self):
        # Create directories if they don't exist
        self.UPLOAD_DIR.mkdir(exist_ok=True)
        self.PROCESSED_DIR.mkdir(exist_ok=True)

# Global settings instance
settings = Settings()