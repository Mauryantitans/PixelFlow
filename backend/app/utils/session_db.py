"""
Database Session Management for PixelFlow

Manages user sessions, image storage, and automatic cleanup.
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.db_models import Session as DBSession, UploadedImage, ProcessedImage
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Session settings
SESSION_EXPIRY_HOURS = 24  # Sessions expire after 24 hours
CLEANUP_INTERVAL_HOURS = 1  # How often to cleanup expired sessions


def create_or_update_session(
    db: Session,
    session_id: str,
    user_id: Optional[int] = None,
    device_info: Optional[str] = None,
    ip_address: Optional[str] = None
) -> DBSession:
    """
    Create a new session or update existing one
    """
    current_time = datetime.now(timezone.utc)
    
    # Check if session exists
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    
    if session:
        # Update last active time to NOW
        session.last_active = current_time
        
        # Update user_id if provided and session doesn't have one
        if user_id is not None and session.user_id is None:
            session.user_id = user_id
            logger.info(f"Linked session {session_id} to user {user_id}")
        
        logger.info(f"Updated session: {session_id} (user_id: {session.user_id}, last_active: {current_time})")
    else:
        # Create new session — lifetime comes from the editable DB settings
        # (guests vs. registered users), falling back to the module default.
        from app.utils.settings_manager import get_retention_policy
        policy = get_retention_policy(db)
        lifetime = policy["user_session_lifetime"] if user_id is not None else policy["guest_session_lifetime"]
        expires_at = current_time + (lifetime or timedelta(hours=SESSION_EXPIRY_HOURS))
        session = DBSession(
            id=session_id,
            user_id=user_id,
            device_info=device_info,
            ip_address=ip_address,
            last_active=current_time,  # Set to NOW on creation
            expires_at=expires_at
        )
        db.add(session)
        logger.info(f"Created new session: {session_id} (user_id: {user_id}, last_active: {current_time})")
    
    db.commit()
    db.refresh(session)
    return session


def get_session(db: Session, session_id: str) -> Optional[DBSession]:
    """Get session by ID"""
    return db.query(DBSession).filter(DBSession.id == session_id).first()


def cleanup_expired_sessions(db: Session) -> int:
    """
    Delete expired sessions and all their associated images
    Returns number of sessions cleaned up
    """
    current_time = datetime.now(timezone.utc)
    
    # Find expired sessions
    expired_sessions = db.query(DBSession).filter(
        DBSession.expires_at < current_time
    ).all()
    
    count = len(expired_sessions)
    
    if count > 0:
        logger.info(f"Cleaning up {count} expired sessions")
        
        for session in expired_sessions:
            logger.info(f"Deleting expired session: {session.id} (expired: {session.expires_at})")
            db.delete(session)
        
        db.commit()
        logger.info(f"Cleanup complete: {count} sessions removed")
    
    return count


def get_session_images(db: Session, session_id: str) -> list[UploadedImage]:
    """Get all images for a session"""
    return db.query(UploadedImage).filter(
        UploadedImage.session_id == session_id
    ).order_by(UploadedImage.uploaded_at).all()


def get_session_stats(db: Session, session_id: str) -> dict:
    """Get statistics for a session"""
    session = get_session(db, session_id)
    
    if not session:
        return {
            "exists": False,
            "image_count": 0,
            "total_size_mb": 0
        }
    
    images = get_session_images(db, session_id)
    total_size = sum(img.size_bytes for img in images)
    
    return {
        "exists": True,
        "session_id": session_id,
        "user_id": session.user_id,
        "created_at": session.created_at,
        "last_active": session.last_active,
        "expires_at": session.expires_at,
        "image_count": len(images),
        "total_size_mb": round(total_size / (1024 * 1024), 2)
    }


def delete_session(db: Session, session_id: str) -> bool:
    """Delete a session and all its images"""
    session = get_session(db, session_id)
    
    if session:
        logger.info(f"Deleting session: {session_id}")
        db.delete(session)
        db.commit()
        return True
    
    return False
