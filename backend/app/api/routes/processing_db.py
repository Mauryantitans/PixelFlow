"""
Updated processing routes that handle both filesystem and database image storage
"""

import asyncio
import logging
import uuid
import io
from pathlib import Path
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from PIL import Image as PILImage

from ...models import ProcessRequest, LiveProcessRequest, ProcessResponse, LiveProcessResponse
from ...core.config import settings
from ...core.database import get_db
from ...models.db_models import UploadedImage
from ...utils.session_manager import session_manager
from ...utils.image_processing import ImageProcessor
from ...processing.registry import registry

logger = logging.getLogger(__name__)
router = APIRouter()


def _flatten_to_rgb(img: PILImage.Image) -> PILImage.Image:
    """Composite any alpha channel onto white and return an RGB image.

    Image-processing operations assume 3-channel RGB; stored originals may now
    be RGBA (transparency is preserved on upload), so flatten before processing.
    """
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        rgba = img.convert('RGBA')
        background = PILImage.new('RGB', rgba.size, (255, 255, 255))
        background.paste(rgba, mask=rgba.split()[-1])
        return background
    if img.mode != 'RGB':
        return img.convert('RGB')
    return img


def load_image_from_db_or_filesystem(image_id: str, session_id: str, db: Session) -> PILImage.Image:
    """Load image from database or filesystem based on configuration"""
    
    if settings.IMAGE_STORAGE == "database":
        # Load from database
        uploaded_img = db.query(UploadedImage).filter(UploadedImage.id == image_id).first()
        
        if not uploaded_img:
            raise HTTPException(status_code=404, detail=f"Image {image_id} not found in database")
        
        # Convert bytes to PIL Image. Stored originals may be RGBA (transparent
        # PNGs are preserved on upload), but the processing operations expect a
        # 3-channel RGB image, so flatten alpha onto white here.
        img = PILImage.open(io.BytesIO(uploaded_img.image_data))
        img = _flatten_to_rgb(img)
        logger.info(f"Loaded image from database: {image_id}")
        return img
    else:
        # Load from filesystem
        session_upload_dir = settings.UPLOAD_DIR / session_id
        image_files = list(session_upload_dir.glob(f"{image_id}.*"))
        
        if not image_files:
            raise HTTPException(status_code=404, detail=f"Image {image_id} not found in filesystem")
        
        img = ImageProcessor.load_image(str(image_files[0]))
        logger.info(f"Loaded image from filesystem: {image_id}")
        return img


async def process_single_image_pipeline(
    image: PILImage.Image, 
    pipeline: List[dict], 
    session_id: str, 
    save_intermediates: bool = False
) -> dict:
    """Process a PIL Image through the pipeline with timing"""
    try:
        # Process the image with timing
        processing_result = ImageProcessor.apply_pipeline_with_timing_from_image(image, pipeline)
        
        result = {
            "final_result": ImageProcessor.image_to_base64(processing_result.final_image),
            "total_time": processing_result.total_time,
            "step_timings": [
                {
                    "step_name": detail["name"],
                    "duration": detail["duration"],
                    "step_index": detail["step_index"]
                }
                for detail in processing_result.step_details
            ],
            # Per-step validation/execution errors (None when the step succeeded),
            # index-aligned with the pipeline. Frontends that don't know the field
            # simply ignore it.
            "step_errors": [
                err.to_dict() if err else None
                for err in processing_result.step_errors
            ],
        }
        
        # Include intermediate results
        if save_intermediates and processing_result.intermediate_images:
            intermediate_base64_list = []
            
            for img in processing_result.intermediate_images:
                intermediate_base64_list.append(ImageProcessor.image_to_base64(img))
            
            result["intermediate_results"] = intermediate_base64_list
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing image pipeline: {e}")
        raise


@router.post("/process", response_model=ProcessResponse)
async def process_images(request: ProcessRequest, db: Session = Depends(get_db)):
    """Process multiple images through the pipeline (batch mode)"""
    try:
        if not request.image_ids:
            raise HTTPException(status_code=400, detail="No images provided")
        
        if not request.pipeline:
            raise HTTPException(status_code=400, detail="No pipeline operations provided")
        
        logger.info(f"Batch processing {len(request.image_ids)} images with {len(request.pipeline)} operations")
        
        processed_results = []
        all_intermediate_results = []
        all_step_timings = []
        all_step_errors = []
        total_batch_time = 0.0
        
        # Process each image
        for image_id in request.image_ids:
            try:
                # Load image from database or filesystem
                image = load_image_from_db_or_filesystem(image_id, request.session_id, db)
                
                # Process the image
                result = await process_single_image_pipeline(
                    image, 
                    [step.dict() for step in request.pipeline], 
                    request.session_id,
                    save_intermediates=True
                )
                
                processed_results.append(result["final_result"])
                total_batch_time += result.get("total_time", 0)
                
                if "intermediate_results" in result:
                    all_intermediate_results.append(result["intermediate_results"])
                
                # Collect step timings
                if "step_timings" in result:
                    all_step_timings.extend(result["step_timings"])

                # Per-image step errors (aligned with processed_images order)
                all_step_errors.append(result.get("step_errors"))

            except Exception as e:
                logger.error(f"Failed to process image {image_id}: {e}")
                continue
        
        if not processed_results:
            raise HTTPException(status_code=500, detail="Failed to process any images")
        
        logger.info(f"Successfully processed {len(processed_results)} images in {total_batch_time:.3f}s")
        
        return ProcessResponse(
            success=True,
            processed_images=processed_results,
            intermediate_results=all_intermediate_results if all_intermediate_results else None,
            total_time=total_batch_time,
            step_timings=all_step_timings,
            step_errors=all_step_errors if any(all_step_errors) else None,
            message=f"Successfully processed {len(processed_results)} image(s)"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in batch processing: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.post("/process-live", response_model=LiveProcessResponse)
async def process_live(request: LiveProcessRequest, db: Session = Depends(get_db)):
    """Process a single image through pipeline with all intermediate steps (live mode)"""
    try:
        if not request.pipeline:
            # If no pipeline, return original image
            image = load_image_from_db_or_filesystem(request.image_id, request.session_id, db)
            original_base64 = ImageProcessor.image_to_base64(image)
            
            return LiveProcessResponse(
                success=True,
                results=[original_base64],
                total_time=0.0,
                step_timings=[],
                message="No operations applied - returning original image"
            )
        
        logger.info(f"Live processing image {request.image_id} with {len(request.pipeline)} operations")
        
        # Load image from database or filesystem
        image = load_image_from_db_or_filesystem(request.image_id, request.session_id, db)
        
        # Process with intermediate results and timing
        result = await process_single_image_pipeline(
            image, 
            [step.dict() for step in request.pipeline], 
            request.session_id,
            save_intermediates=True
        )
        
        # Prepare results - all intermediate steps plus final
        results = []
        if "intermediate_results" in result:
            results.extend(result["intermediate_results"])
        else:
            # If no intermediates, just return the final result
            results.append(result["final_result"])
        
        logger.info(f"Live processing completed with {len(results)} result steps in {result.get('total_time', 0):.3f}s")
        
        return LiveProcessResponse(
            success=True,
            results=results,
            total_time=result.get("total_time", 0),
            step_timings=result.get("step_timings", []),
            step_errors=result.get("step_errors"),
            message=f"Live processing completed with {len(results)} steps"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in live processing: {e}")
        raise HTTPException(status_code=500, detail=f"Live processing failed: {str(e)}")


@router.get("/operations")
async def get_available_operations():
    """Get available operations with full, typed parameter schemas.

    Returns the registry's grouped schema (`categories[]` → `subcategories[]` →
    `operations[]` with typed `params`) for schema-driven frontend rendering,
    plus a flat legacy `operations` list of display labels for backward
    compatibility with older clients.
    """
    try:
        schema = registry.to_schema()
        legacy_labels = [
            op["label"]
            for cat in schema["categories"]
            for sub in cat["subcategories"]
            for op in sub["operations"]
        ]

        return JSONResponse(content={
            "success": True,
            "version": schema["version"],
            "categories": schema["categories"],
            # Legacy fields (kept for one release for backward compatibility):
            "operations": legacy_labels,
            "total_count": len(legacy_labels),
        })

    except Exception as e:
        logger.error(f"Error getting operations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get available operations")


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse(content={
        "success": True,
        "message": "Processing service is healthy",
        "active_sessions": len(session_manager.active_sessions)
    })
