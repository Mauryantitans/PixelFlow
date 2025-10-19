"""
Security Headers Middleware for PixelFlow

Adds important security headers to all HTTP responses.
All settings can be adjusted in app/core/security_config.py
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.security_config import SecurityHeaders
import logging

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses"""
    
    def __init__(self, app):
        super().__init__(app)
        self.enabled = SecurityHeaders.ENABLED
    
    async def dispatch(self, request: Request, call_next):
        """Add security headers to response"""
        
        # Process request
        response = await call_next(request)
        
        # Skip if security headers are disabled
        if not self.enabled:
            return response
        
        # Add security headers
        self._add_security_headers(response)
        
        return response
    
    def _add_security_headers(self, response):
        """Add all configured security headers to the response"""
        
        # Content Security Policy
        if SecurityHeaders.CONTENT_SECURITY_POLICY:
            response.headers["Content-Security-Policy"] = SecurityHeaders.CONTENT_SECURITY_POLICY
        
        # HTTP Strict Transport Security (HSTS)
        # Only enable this in production with HTTPS!
        if SecurityHeaders.HSTS:
            response.headers["Strict-Transport-Security"] = SecurityHeaders.HSTS
        
        # X-Content-Type-Options
        if SecurityHeaders.X_CONTENT_TYPE_OPTIONS:
            response.headers["X-Content-Type-Options"] = SecurityHeaders.X_CONTENT_TYPE_OPTIONS
        
        # X-Frame-Options
        if SecurityHeaders.X_FRAME_OPTIONS:
            response.headers["X-Frame-Options"] = SecurityHeaders.X_FRAME_OPTIONS
        
        # X-XSS-Protection
        if SecurityHeaders.X_XSS_PROTECTION:
            response.headers["X-XSS-Protection"] = SecurityHeaders.X_XSS_PROTECTION
        
        # Referrer-Policy
        if SecurityHeaders.REFERRER_POLICY:
            response.headers["Referrer-Policy"] = SecurityHeaders.REFERRER_POLICY
        
        # Permissions-Policy
        if SecurityHeaders.PERMISSIONS_POLICY:
            response.headers["Permissions-Policy"] = SecurityHeaders.PERMISSIONS_POLICY
        
        # Add X-Powered-By header removal
        # Never expose which framework you're using
        if "X-Powered-By" in response.headers:
            del response.headers["X-Powered-By"]
        if "Server" in response.headers:
            del response.headers["Server"]
        
        return response


def get_headers_info() -> dict:
    """Get information about configured security headers"""
    return {
        "enabled": SecurityHeaders.ENABLED,
        "headers": {
            "Content-Security-Policy": bool(SecurityHeaders.CONTENT_SECURITY_POLICY),
            "Strict-Transport-Security": bool(SecurityHeaders.HSTS),
            "X-Content-Type-Options": bool(SecurityHeaders.X_CONTENT_TYPE_OPTIONS),
            "X-Frame-Options": bool(SecurityHeaders.X_FRAME_OPTIONS),
            "X-XSS-Protection": bool(SecurityHeaders.X_XSS_PROTECTION),
            "Referrer-Policy": bool(SecurityHeaders.REFERRER_POLICY),
            "Permissions-Policy": bool(SecurityHeaders.PERMISSIONS_POLICY)
        }
    }
