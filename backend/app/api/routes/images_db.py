"""
Database-backed image storage routes for PixelFlow

Stores images in PostgreSQL database instead of filesystem.
"""

import uuid
import logging
import base64
import io
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Request, Body
from fastapi.responses import JSONResponse, Response
from PIL import Image as PILImage
from sqlalchemy.orm import Session
from sqlalchemy import func

from ...models import ImageData, UploadResponse
from ...core.config import settings
from ...core.database import get_db
from ...core.business_rules import UserLimits
from ...models.db_models import Session as DBSession, UploadedImage, ProcessedImage, SystemSettings
from ...utils.session_db import create_or_update_session, get_session_images, cleanup_expired_sessions
from ...utils.quota_manager import check_storage_quota
from ...utils.image_processing import ImageProcessor
from ...utils.auth import get_current_user_optional
from ...models.db_models import User

logger = logging.getLogger(__name__)
router = APIRouter()


def image_to_base64(image: PILImage.Image, format: str = 'JPEG') -> str:
    """Convert PIL Image to base64 string"""
    buffered = io.BytesIO()
    image.save(buffered, format=format)
    img_bytes = buffered.getvalue()
    return base64.b64encode(img_bytes).decode('utf-8')


def bytes_to_base64_dataurl(image_bytes: bytes, mime_type: str) -> str:
    """Convert image bytes to base64 data URL"""
    b64 = base64.b64encode(image_bytes).decode('utf-8')
    return f"data:{mime_type};base64,{b64}"


@router.post("/upload", response_model=UploadResponse)
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    session_id: str = Form(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Upload an image and store in database"""
    try:
        # Get user_id from authenticated user (None if guest)
        user_id = current_user.id if current_user else None
        is_admin = current_user.is_admin if current_user else False
        
        logger.info(f"Upload request from: {'User ID ' + str(user_id) if user_id else 'Guest'} (session: {session_id})")
        # Read file content first to check size
        content = await file.read()
        file_size = len(content)
        
        # Validate file size
        if file_size > settings.MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large")
        
        # Validate file extension
        file_extension = Path(file.filename or "image").suffix.lower()
        if file_extension not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type not supported. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        
        # Get client info
        ip_address = request.client.host if request.client else None
        device_info = request.headers.get("user-agent")
        
        # Create or update session
        create_or_update_session(db, session_id, user_id, device_info, ip_address)
        
        # Get settings from database
        db_settings = db.query(SystemSettings).first()
        
        if not db_settings:
            # Create default settings inline
            db_settings = SystemSettings(
                id=1,
                free_user_max_pipelines=3,
                guest_storage_quota_mb=50,
                free_user_storage_quota_mb=500,
                guest_max_images_per_session=50,
                free_user_max_images_per_session=100,
                max_images_per_upload=20,
                warn_at_percentage=80
            )
            db.add(db_settings)
            db.commit()
            db.refresh(db_settings)
        
        # CHECK IMAGE COUNT LIMIT FOR SESSION
        current_image_count = db.query(func.count(UploadedImage.id)).filter(
            UploadedImage.session_id == session_id
        ).scalar() or 0
        
        # Determine max images based on user type
        max_images = db_settings.free_user_max_images_per_session if user_id else db_settings.guest_max_images_per_session
        
        if current_image_count >= max_images:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Image limit reached",
                    "message": f"You've reached the maximum of {max_images} images per session. Please delete some images or clear your session.",
                    "current_count": current_image_count,
                    "max_count": max_images
                }
            )
        
        # CHECK STORAGE QUOTA BEFORE UPLOAD
        quota_check = check_storage_quota(
            db, 
            user_id=user_id,
            session_id=session_id,
            new_file_size=file_size,
            is_admin=is_admin
        )
        
        if not quota_check['allowed']:
            # Quota exceeded - throw error with details
            raise HTTPException(
                status_code=507,  # Insufficient Storage
                detail={
                    "error": "Storage quota exceeded",
                    "message": f"Upload would exceed your storage quota. You're using {quota_check['current_mb']}MB of {quota_check['quota_mb']}MB. This file is {quota_check['new_file_mb']}MB.",
                    "current_mb": quota_check['current_mb'],
                    "quota_mb": quota_check['quota_mb'],
                    "file_size_mb": quota_check['new_file_mb'],
                    "percentage_used": quota_check['percentage_used']
                }
            )
        
        # Log warning if near quota
        if quota_check['warning']:
            logger.warning(
                f"User near quota: {quota_check['percentage_used']}% used "
                f"({quota_check['current_mb']}MB / {quota_check['quota_mb']}MB)"
            )
        
        # Generate unique image ID
        image_id = str(uuid.uuid4())
        
        # Load image to get metadata and create thumbnail
        try:
            img = PILImage.open(io.BytesIO(content))
            
            # Convert problematic modes
            if img.mode == 'RGBA':
                background = PILImage.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1])
                img = background
            elif img.mode not in ('RGB', 'L'):
                img = img.convert('RGB')
            
            width, height = img.size
            image_format = 'JPEG'
            
            # Save processed image back to bytes
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format=image_format, quality=95)
            img_bytes = img_byte_arr.getvalue()
            
            # Create thumbnail
            thumbnail_img = img.copy()
            thumbnail_img.thumbnail(settings.THUMBNAIL_SIZE, PILImage.Resampling.LANCZOS)
            thumb_byte_arr = io.BytesIO()
            thumbnail_img.save(thumb_byte_arr, format=image_format, quality=85)
            thumbnail_bytes = thumb_byte_arr.getvalue()
            
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            raise HTTPException(status_code=400, detail=f"Unable to process image: {str(e)}")
        
        # Store in database
        uploaded_image = UploadedImage(
            id=image_id,
            session_id=session_id,
            user_id=user_id,  # Associate with authenticated user
            filename=file.filename or "image.jpg",
            image_data=img_bytes,
            thumbnail_data=thumbnail_bytes,
            width=width,
            height=height,
            format=image_format,
            size_bytes=len(img_bytes),
            mime_type=file.content_type or "image/jpeg"
        )
        
        db.add(uploaded_image)
        db.commit()
        db.refresh(uploaded_image)
        
        # Create thumbnail base64 for immediate display
        thumbnail_base64 = f"data:image/jpeg;base64,{base64.b64encode(thumbnail_bytes).decode('utf-8')}"
        
        logger.info(f"Image uploaded to database: {image_id} ({file.filename}) - User: {user_id or 'Guest'}")
        
        # Return image metadata
        return UploadResponse(
            success=True,
            image=ImageData(
                id=image_id,
                filename=file.filename or "image.jpg",
                file_path=f"db://{image_id}",  # Virtual path to indicate DB storage
                session_id=session_id,
                size_bytes=len(img_bytes),
                width=width,
                height=height,
                format=image_format
            ),
            thumbnail=thumbnail_base64,
            message=f"Image uploaded successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during upload: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/session/{session_id}/images")
async def get_session_images_list(
    session_id: str,
    include_data: bool = False,
    db: Session = Depends(get_db)
):
    """Get all images for a session"""
    try:
        images = get_session_images(db, session_id)
        
        result = []
        for img in images:
            image_data = {
                "id": img.id,
                "filename": img.filename,
                "file_path": f"db://{img.id}",
                "session_id": img.session_id,
                "size_bytes": img.size_bytes,
                "width": img.width,
                "height": img.height,
                "format": img.format,
                "uploaded_at": img.uploaded_at.isoformat()
            }
            
            if include_data:
                # Include base64 encoded image and thumbnail
                image_data["thumbnail"] = bytes_to_base64_dataurl(img.thumbnail_data, "image/jpeg")
                image_data["image"] = bytes_to_base64_dataurl(img.image_data, img.mime_type)
            
            result.append(image_data)
        
        return JSONResponse(content={
            "success": True,
            "count": len(result),
            "images": result
        })
        
    except Exception as e:
        logger.error(f"Error getting session images: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/image/{image_id}")
async def get_image(
    image_id: str,
    thumbnail: bool = False,
    db: Session = Depends(get_db)
):
    """Get an image from database"""
    try:
        img = db.query(UploadedImage).filter(UploadedImage.id == image_id).first()
        
        if not img:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Update last accessed
        img.last_accessed = datetime.utcnow()
        db.commit()
        
        # Return appropriate data
        if thumbnail and img.thumbnail_data:
            return Response(content=img.thumbnail_data, media_type="image/jpeg")
        else:
            return Response(content=img.image_data, media_type=img.mime_type)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving image {image_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/image/{image_id}")
async def delete_image(
    image_id: str,
    db: Session = Depends(get_db)
):
    """Delete an image from database"""
    try:
        img = db.query(UploadedImage).filter(UploadedImage.id == image_id).first()
        
        if not img:
            raise HTTPException(status_code=404, detail="Image not found")
        
        db.delete(img)
        db.commit()
        
        logger.info(f"Image deleted from database: {image_id}")
        
        return JSONResponse(content={
            "success": True,
            "message": "Image deleted successfully"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting image {image_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup-session")
async def cleanup_session(
    request: Request,
    db: Session = Depends(get_db)
):
    """Clean up a session and all its images - handles both JSON and beacon requests"""
    try:
        # Try to parse JSON body
        try:
            body = await request.json()
            session_id = body.get('session_id')
        except Exception:
            # If JSON parsing fails, try form data
            form = await request.form()
            session_id = form.get('session_id')
        
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id required")
        
        logger.info(f"Cleanup session request for: {session_id}")
        
        session = db.query(DBSession).filter(DBSession.id == session_id).first()
        
        if session:
            # Count images before deleting
            image_count = db.query(func.count(UploadedImage.id)).filter(
                UploadedImage.session_id == session_id
            ).scalar()
            
            db.delete(session)  # Cascades to delete images
            db.commit()
            logger.info(f"Session cleaned up: {session_id} - Deleted session and {image_count} images")
            return JSONResponse(content={
                "success": True,
                "message": f"Session cleaned up successfully",
                "deleted_images": image_count
            })
        else:
            logger.info(f"Session not found (already cleaned): {session_id}")
            return JSONResponse(content={
                "success": True,
                "message": "Session not found (already cleaned)"
            })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cleaning up session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/heartbeat")
async def session_heartbeat(
    body: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Heartbeat endpoint to keep session alive and track active sessions"""
    try:
        session_id = body.get('session_id')
        
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id required")
        
        session = db.query(DBSession).filter(DBSession.id == session_id).first()
        was_created = False
        
        if session:
            # Update last active timestamp (timezone-aware)
            session.last_active = datetime.now(timezone.utc)
            
            # Update user_id if user is now logged in and session doesn't have it
            if current_user and session.user_id is None:
                session.user_id = current_user.id
                logger.info(f"Heartbeat: Linked session {session_id} to user {current_user.id}")
            
            db.commit()
            logger.debug(f"Heartbeat: Updated session {session_id}")
        else:
            # Session doesn't exist - CREATE IT!
            current_time = datetime.now(timezone.utc)
            expires_at = current_time + timedelta(hours=24)
            
            session = DBSession(
                id=session_id,
                user_id=current_user.id if current_user else None,
                device_info=None,
                ip_address=None,
                last_active=current_time,
                expires_at=expires_at
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            was_created = True
            
            logger.info(f"Heartbeat: Created new session {session_id} (user_id: {current_user.id if current_user else None})")
        
        return JSONResponse(content={
            "success": True,
            "message": "Heartbeat received",
            "session_id": session_id,
            "last_active": session.last_active.isoformat(),
            "created": was_created
        })
    except Exception as e:
        logger.error(f"Error processing heartbeat: {e}")
        # Don't raise exception - heartbeat failures should be silent
        return JSONResponse(content={
            "success": False,
            "message": str(e)
        })


@router.get("/cleanup-expired")
async def cleanup_expired(db: Session = Depends(get_db)):
    """Cleanup expired sessions (can be called by cron job)"""
    try:
        count = cleanup_expired_sessions(db)
        
        return JSONResponse(content={
            "success": True,
            "cleaned_sessions": count,
            "message": f"Cleaned up {count} expired session(s)"
        })
        
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
        raise HTTPException(status_code=500, detail=str(e))
