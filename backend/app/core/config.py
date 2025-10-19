from pathlib import Path
import os
from typing import Optional
from dotenv import load_dotenv
from .security_config import SessionSecurity, CORSSettings, FileUploadSecurity

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    # App settings
    APP_NAME: str = os.environ.get("APP_NAME", "PixelFlow")
    VERSION: str = os.environ.get("VERSION", "1.1.0")
    DEBUG: bool = os.environ.get("DEBUG", "False").lower() == "true"
    
    # Image storage settings
    IMAGE_STORAGE: str = os.environ.get("IMAGE_STORAGE", "filesystem")  # Options: filesystem, database
    
    # File storage settings
    BASE_DIR: Path = Path(__file__).parent.parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    PROCESSED_DIR: Path = BASE_DIR / "processed"
    
    # Session settings
    SESSION_TIMEOUT: int = 30 * 60  # 30 minutes in seconds
    CLEANUP_INTERVAL: int = 5 * 60  # 5 minutes in seconds
    
    # Image processing settings
    MAX_FILE_SIZE: int = FileUploadSecurity.MAX_FILE_SIZE
    ALLOWED_EXTENSIONS: set = FileUploadSecurity.ALLOWED_EXTENSIONS
    THUMBNAIL_SIZE: tuple = (150, 150)
    
    # Server settings
    HOST: str = os.environ.get("HOST", "0.0.0.0")
    _port_env = os.environ.get("PORT", "8000").strip()
    PORT: int = int(_port_env) if _port_env else 8000
    
    CORS_ORIGINS: list = CORSSettings.DEV_ORIGINS + CORSSettings.PROD_ORIGINS
    
    # SQLite fallback for development
    USE_SQLITE: bool = os.environ.get("USE_SQLITE", "False").lower() == "true"
    
    # Database settings
    if USE_SQLITE:
        SQLITE_PATH = BASE_DIR / "pixelflow.db"
        DATABASE_URL: str = f"sqlite:///{SQLITE_PATH}"
    else:
        DATABASE_URL: str = os.environ.get(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/pixelflow"
        )
        # Fix for Render/Heroku postgres:// URLs
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    # Authentication settings
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = SessionSecurity.ACCESS_TOKEN_EXPIRE_MINUTES
    REFRESH_TOKEN_EXPIRE_DAYS: int = SessionSecurity.REFRESH_TOKEN_EXPIRE_DAYS
    
    # Google OAuth settings
    GOOGLE_CLIENT_ID: str = os.environ.get("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/google/callback")
    
    def __init__(self):
        # Create directories if they don't exist
        self.UPLOAD_DIR.mkdir(exist_ok=True)
        self.PROCESSED_DIR.mkdir(exist_ok=True)

# Global settings instance
settings = Settings()
