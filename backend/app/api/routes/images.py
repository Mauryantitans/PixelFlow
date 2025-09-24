import uuid
import logging
from pathlib import Path
from typing import List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from PIL import Image

from ...models import ImageData, UploadResponse, SessionCleanupRequest
from ...core.config import settings
from ...utils.session_manager import session_manager
from ...utils.image_processing import ImageProcessor

logger = logging.getLogger(__name__)
router = APIRouter()

def validate_image_file(file: UploadFile) -> None:
    """Validate uploaded image file"""
    # Check file size
    if hasattr(file, 'size') and file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")
    
    # Check file extension
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not supported. Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

@router.post("/upload", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    session_id: str = Form(...)
):
    """Upload an image file"""
    try:
        # Validate the uploaded file
        validate_image_file(file)
        
        # Register session if not exists
        if not session_manager.is_session_active(session_id):
            session_manager.register_session(session_id)
        else:
            session_manager.update_session_activity(session_id)
        
        # Generate unique image ID
        image_id = str(uuid.uuid4())
        
        # Get session directories
        session_upload_dir, _ = session_manager.create_session_directories(session_id)
        
        # Create file path
        file_extension = Path(file.filename).suffix.lower()
        file_path = session_upload_dir / f"{image_id}{file_extension}"
        
        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Load image to get dimensions and create thumbnail
        try:
            with Image.open(file_path) as img:
                # Convert problematic modes early
                if img.mode == 'RGBA':
                    logger.info(f"Converting RGBA image to RGB: {file.filename}")
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[-1])
                    img = background
                elif img.mode not in ('RGB', 'L'):
                    logger.info(f"Converting {img.mode} image to RGB: {file.filename}")
                    img = img.convert('RGB')
                    
                width, height = img.size
                image_format = 'JPEG'  # Force JPEG for consistency
                
                # Create thumbnail
                thumbnail_base64 = ImageProcessor.create_thumbnail(img, settings.THUMBNAIL_SIZE)
                
        except Exception as e:
            logger.error(f"Error processing uploaded image: {e}")
            # Clean up the file if image processing failed
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=400, detail=f"Unable to process image file: {str(e)}")
        
        # Create image data object
        image_data = ImageData(
            id=image_id,
            filename=file.filename,
            file_path=str(file_path),
            session_id=session_id,
            size_bytes=len(content),
            width=width,
            height=height,
            format=image_format
        )
        
        logger.info(f"Image uploaded successfully: {image_id} ({file.filename})")
        
        return UploadResponse(
            success=True,
            image=image_data,
            thumbnail=thumbnail_base64,
            message=f"Image '{file.filename}' uploaded successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during upload: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    
@router.post("/upload-multiple")
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    session_id: str = Form(...)
):
    """Upload multiple image files"""
    try:
        if len(files) > 20:  # Reasonable limit
            raise HTTPException(status_code=400, detail="Too many files. Maximum 20 files allowed.")
        
        # Register session if not exists
        if not session_manager.is_session_active(session_id):
            session_manager.register_session(session_id)
        else:
            session_manager.update_session_activity(session_id)
        
        uploaded_images = []
        failed_uploads = []
        
        for file in files:
            try:
                # Validate each file
                validate_image_file(file)
                
                # Generate unique image ID
                image_id = str(uuid.uuid4())
                
                # Get session directories
                session_upload_dir, _ = session_manager.create_session_directories(session_id)
                
                # Create file path
                file_extension = Path(file.filename).suffix.lower()
                file_path = session_upload_dir / f"{image_id}{file_extension}"
                
                # Save the uploaded file
                with open(file_path, "wb") as buffer:
                    content = await file.read()
                    buffer.write(content)
                
                # Load image to get dimensions and create thumbnail
                with Image.open(file_path) as img:
                    width, height = img.size
                    image_format = img.format or 'JPEG'
                    
                    # Create thumbnail
                    thumbnail_base64 = ImageProcessor.create_thumbnail(img, settings.THUMBNAIL_SIZE)
                
                # Create image data object
                image_data = ImageData(
                    id=image_id,
                    filename=file.filename,
                    file_path=str(file_path),
                    session_id=session_id,
                    size_bytes=len(content),
                    width=width,
                    height=height,
                    format=image_format
                )
                
                uploaded_images.append({
                    "image": image_data,
                    "thumbnail": thumbnail_base64
                })
                
                logger.info(f"Image uploaded successfully: {image_id} ({file.filename})")
                
            except Exception as e:
                logger.error(f"Failed to upload {file.filename}: {e}")
                failed_uploads.append({
                    "filename": file.filename,
                    "error": str(e)
                })
        
        return JSONResponse(content={
            "success": True,
            "uploaded_count": len(uploaded_images),
            "failed_count": len(failed_uploads),
            "uploaded_images": uploaded_images,
            "failed_uploads": failed_uploads,
            "message": f"Uploaded {len(uploaded_images)} of {len(files)} images successfully"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during multiple upload: {e}")
        raise HTTPException(status_code=500, detail=f"Multiple upload failed: {str(e)}")

@router.post("/cleanup-session")
async def cleanup_session(request: SessionCleanupRequest):
    """Clean up session files"""
    try:
        success = session_manager.cleanup_session_files(request.session_id)
        
        if success:
            return JSONResponse(content={
                "success": True,
                "message": f"Session {request.session_id} cleaned up successfully"
            })
        else:
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": f"Failed to clean up session {request.session_id}"
                }
            )
            
    except Exception as e:
        logger.error(f"Error cleaning up session {request.session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")

@router.get("/session-stats")
async def get_session_stats():
    """Get session statistics (for debugging)"""
    try:
        stats = session_manager.get_session_stats()
        return JSONResponse(content={
            "success": True,
            "stats": stats
        })
    except Exception as e:
        logger.error(f"Error getting session stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get session stats")

@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Manually delete a specific session"""
    try:
        success = session_manager.cleanup_session_files(session_id)
        
        return JSONResponse(content={
            "success": success,
            "message": f"Session {session_id} {'deleted' if success else 'not found or failed to delete'}"
        })
        
    except Exception as e:
        logger.error(f"Error deleting session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Session deletion failed: {str(e)}")