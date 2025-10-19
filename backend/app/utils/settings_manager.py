"""
System Settings Manager for PixelFlow

Manages editable system settings stored in the database.
Admin can change these from the admin panel UI.
"""

from sqlalchemy.orm import Session
from app.models.db_models import SystemSettings
from datetime import timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Cache for settings to avoid database query on every request
_settings_cache: Optional[SystemSettings] = None
_cache_timestamp = 0


def get_settings(db: Session, use_cache: bool = True) -> SystemSettings:
    """
    Get system settings from database
    Creates default settings if none exist
    """
    # Don't use cache - always get fresh from DB to avoid session issues
    settings = db.query(SystemSettings).first()
    
    if not settings:
        # Create default settings
        settings = SystemSettings(
            id=1,  # Only one settings record
            free_user_max_pipelines=3,
            guest_storage_quota_mb=50,
            free_user_storage_quota_mb=500,
            guest_max_images_per_session=50,
            free_user_max_images_per_session=100,
            max_images_per_upload=20,
            guest_upload_retention_hours=24,
            free_user_upload_retention_days=7,
            guest_processed_retention_hours=1,
            free_user_processed_retention_hours=24,
            guest_session_lifetime_hours=24,
            user_session_lifetime_days=7,
            session_grace_period_hours=2,
            enable_auto_cleanup=True,
            cleanup_on_logout=True,
            cleanup_on_tab_close=True,
            delete_oldest_on_quota=False,
            warn_at_percentage=80
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
        logger.info("Created default system settings")
    
    return settings


def update_settings(db: Session, updates: dict, user_id: int) -> SystemSettings:
    """
    Update system settings
    Only admin users should be able to call this
    """
    global _settings_cache
    
    settings = get_settings(db, use_cache=False)
    
    # Update allowed fields
    allowed_fields = {
        'free_user_max_pipelines',
        'guest_storage_quota_mb',
        'free_user_storage_quota_mb',
        'guest_max_images_per_session',
        'free_user_max_images_per_session',
        'max_images_per_upload',
        'guest_upload_retention_hours',
        'free_user_upload_retention_days',
        'guest_processed_retention_hours',
        'free_user_processed_retention_hours',
        'guest_session_lifetime_hours',
        'user_session_lifetime_days',
        'session_grace_period_hours',
        'enable_auto_cleanup',
        'cleanup_on_logout',
        'cleanup_on_tab_close',
        'delete_oldest_on_quota',
        'warn_at_percentage'
    }
    
    for field, value in updates.items():
        if field in allowed_fields and hasattr(settings, field):
            setattr(settings, field, value)
            logger.info(f"Setting updated: {field} = {value} by user {user_id}")
    
    settings.updated_by = user_id
    
    db.commit()
    db.refresh(settings)
    
    # Invalidate cache
    _settings_cache = None
    
    logger.info(f"System settings updated by user {user_id}")
    
    return settings


def invalidate_cache():
    """Invalidate settings cache (call after updates)"""
    global _settings_cache
    _settings_cache = None
