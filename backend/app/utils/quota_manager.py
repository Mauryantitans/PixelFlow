"""
Storage Quota Management for PixelFlow

Checks user storage quotas before allowing uploads.
Throws errors instead of auto-deleting to give users control.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.db_models import UploadedImage, User
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)


def get_user_storage_quota(db: Session, user_id: Optional[int], is_admin: bool = False) -> int:
    """Get storage quota in bytes for a user"""
    from app.utils.settings_manager import get_settings
    
    settings = get_settings(db)
    
    if is_admin:
        return float('inf')  # Unlimited
    elif user_id is None:
        # Guest user
        return settings.guest_storage_quota_mb * 1024 * 1024
    else:
        # Registered free user
        return settings.free_user_storage_quota_mb * 1024 * 1024


def get_user_current_storage(db: Session, user_id: Optional[int], session_id: str) -> int:
    """Get current storage usage in bytes"""
    if user_id is not None:
        # For logged-in users, count all their images
        total_size = db.query(func.sum(UploadedImage.size_bytes)).filter(
            UploadedImage.user_id == user_id
        ).scalar() or 0
    else:
        # For guests, only count images in current session
        total_size = db.query(func.sum(UploadedImage.size_bytes)).filter(
            UploadedImage.session_id == session_id
        ).scalar() or 0
    
    return total_size


def check_storage_quota(
    db: Session, 
    user_id: Optional[int], 
    session_id: str,
    new_file_size: int,
    is_admin: bool = False
) -> Dict:
    """
    Check if user can upload a file without exceeding quota
    
    Returns:
        dict with keys:
        - 'allowed' (bool): Whether upload is allowed
        - 'current_mb' (float): Current usage in MB
        - 'quota_mb' (float): Total quota in MB
        - 'new_file_mb' (float): Size of file being uploaded in MB
        - 'after_upload_mb' (float): Usage after upload in MB
        - 'percentage_used' (float): Percentage of quota used
        - 'warning' (bool): Whether user is near quota
    """
    from app.utils.settings_manager import get_settings
    
    settings = get_settings(db)
    
    # Get quota
    quota_bytes = get_user_storage_quota(db, user_id, is_admin)
    
    # Admin has unlimited
    if quota_bytes == float('inf'):
        return {
            'allowed': True,
            'current_mb': 0,
            'quota_mb': 0,
            'new_file_mb': new_file_size / (1024 * 1024),
            'after_upload_mb': 0,
            'percentage_used': 0,
            'warning': False,
            'unlimited': True
        }
    
    # Get current usage
    current_usage = get_user_current_storage(db, user_id, session_id)
    
    # Calculate after upload
    after_upload = current_usage + new_file_size
    
    # Check if allowed
    allowed = after_upload <= quota_bytes
    
    # Calculate percentages
    percentage_used = (after_upload / quota_bytes) * 100
    warning = percentage_used >= settings.warn_at_percentage
    
    result = {
        'allowed': allowed,
        'current_mb': round(current_usage / (1024 * 1024), 2),
        'quota_mb': round(quota_bytes / (1024 * 1024), 2),
        'new_file_mb': round(new_file_size / (1024 * 1024), 2),
        'after_upload_mb': round(after_upload / (1024 * 1024), 2),
        'percentage_used': round(percentage_used, 1),
        'remaining_mb': round((quota_bytes - after_upload) / (1024 * 1024), 2) if allowed else 0,
        'warning': warning,
        'unlimited': False
    }
    
    if not allowed:
        logger.warning(
            f"Storage quota exceeded - User: {user_id or 'guest'}, "
            f"Current: {result['current_mb']}MB, "
            f"Quota: {result['quota_mb']}MB, "
            f"Attempted: {result['new_file_mb']}MB"
        )
    elif warning:
        logger.info(
            f"Storage warning - User: {user_id or 'guest'} at {percentage_used:.1f}% of quota"
        )
    
    return result


def get_user_storage_stats(db: Session, user_id: Optional[int], session_id: str, is_admin: bool = False) -> Dict:
    """Get storage statistics for a user"""
    quota_bytes = get_user_storage_quota(db, user_id, is_admin)
    current_usage = get_user_current_storage(db, user_id, session_id)
    
    # Count images
    if user_id is not None:
        image_count = db.query(func.count(UploadedImage.id)).filter(
            UploadedImage.user_id == user_id
        ).scalar() or 0
    else:
        image_count = db.query(func.count(UploadedImage.id)).filter(
            UploadedImage.session_id == session_id
        ).scalar() or 0
    
    return {
        'used_mb': round(current_usage / (1024 * 1024), 2),
        'quota_mb': round(quota_bytes / (1024 * 1024), 2) if quota_bytes != float('inf') else None,
        'percentage_used': round((current_usage / quota_bytes) * 100, 1) if quota_bytes != float('inf') else 0,
        'remaining_mb': round((quota_bytes - current_usage) / (1024 * 1024), 2) if quota_bytes != float('inf') else None,
        'image_count': image_count,
        'unlimited': quota_bytes == float('inf')
    }
