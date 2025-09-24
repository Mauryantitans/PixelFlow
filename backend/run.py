#!/usr/bin/env python3
"""
PixelFlow Backend Runner
Run this file to start the PixelFlow backend server
"""

import sys
import os
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

try:
    import uvicorn
    from app.main import app
    from app.core.config import settings
except ImportError as e:
    print(f"Error importing required modules: {e}")
    print("Please make sure you've installed all requirements:")
    print("pip install -r requirements.txt")
    sys.exit(1)

def main():
    """Main function to run the server"""
    print(f"Starting {settings.APP_NAME} v{settings.VERSION}")
    print(f"Server will be available at: http://{settings.HOST}:{settings.PORT}")
    print(f"API documentation at: http://{settings.HOST}:{settings.PORT}/docs")
    print(f"Debug mode: {'ON' if settings.DEBUG else 'OFF'}")
    print("-" * 50)
    
    try:
        uvicorn.run(
            "app.main:app",
            host=settings.HOST,
            port=settings.PORT,
            reload=settings.DEBUG,
            log_level="info" if settings.DEBUG else "warning",
            access_log=settings.DEBUG
        )
    except KeyboardInterrupt:
        print("\nShutting down gracefully...")
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()