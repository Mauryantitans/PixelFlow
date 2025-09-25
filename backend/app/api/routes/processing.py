import asyncio
import logging
import uuid
from pathlib import Path
from typing import List
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from ...models import ProcessRequest, LiveProcessRequest, ProcessResponse, LiveProcessResponse
from ...core.config import settings
from ...utils.session_manager import session_manager
from ...utils.image_processing import ImageProcessor

logger = logging.getLogger(__name__)
router = APIRouter()

async def process_single_image_pipeline(image_path: str, pipeline: List[dict], session_id: str, save_intermediates: bool = False) -> dict:
    """Process a single image through the entire pipeline with timing"""
    try:
        # Use the new timing-aware pipeline method
        processing_result = ImageProcessor.apply_pipeline_with_timing(image_path, pipeline)
        
        # Get session directories
        session_upload_dir, session_processed_dir = session_manager.create_session_directories(session_id)
        
        # Generate unique processing ID
        process_id = str(uuid.uuid4())
        
        # Save final result
        final_dir = session_processed_dir / "final"
        final_path = final_dir / f"{process_id}_final.jpg"
        ImageProcessor.save_image(processing_result.final_image, str(final_path))
        
        result = {
            "final_result": ImageProcessor.image_to_base64(processing_result.final_image),
            "final_path": str(final_path),
            "total_time": processing_result.total_time,
            "step_timings": [
                {
                    "step_name": detail["name"],
                    "duration": detail["duration"],
                    "step_index": detail["step_index"]
                }
                for detail in processing_result.step_details
            ]
        }
        
        # Save intermediate results if requested
        if save_intermediates and processing_result.intermediate_images:
            intermediate_dir = session_processed_dir / "intermediate" / process_id
            intermediate_dir.mkdir(parents=True, exist_ok=True)
            
            intermediate_base64_list = []
            intermediate_paths = []
            
            for i, img in enumerate(processing_result.intermediate_images):
                step_path = intermediate_dir / f"step_{i+1}.jpg"
                ImageProcessor.save_image(img, str(step_path))
                intermediate_base64_list.append(ImageProcessor.image_to_base64(img))
                intermediate_paths.append(str(step_path))
            
            result["intermediate_results"] = intermediate_base64_list
            result["intermediate_paths"] = intermediate_paths
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing image {image_path}: {e}")
        raise

@router.post("/process", response_model=ProcessResponse)
async def process_images(request: ProcessRequest):
    """Process multiple images through the pipeline (batch mode)"""
    try:
        # Validate session
        if not session_manager.is_session_active(request.session_id):
            raise HTTPException(status_code=400, detail="Invalid or expired session")
        
        # Update session activity
        session_manager.update_session_activity(request.session_id)
        
        if not request.image_ids:
            raise HTTPException(status_code=400, detail="No images provided")
        
        if not request.pipeline:
            raise HTTPException(status_code=400, detail="No pipeline operations provided")
        
        logger.info(f"Processing {len(request.image_ids)} images with {len(request.pipeline)} operations")
        
        # Get session directory
        session_upload_dir = settings.UPLOAD_DIR / request.session_id
        
        processed_results = []
        all_intermediate_results = []
        all_step_timings = []
        total_batch_time = 0.0
        
        # Process each image
        for image_id in request.image_ids:
            # Find the image file
            image_files = list(session_upload_dir.glob(f"{image_id}.*"))
            if not image_files:
                logger.warning(f"Image not found: {image_id}")
                continue
            
            image_path = str(image_files[0])
            
            try:
                # Process the image with timing
                result = await process_single_image_pipeline(
                    image_path, 
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
            message=f"Successfully processed {len(processed_results)} image(s)"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in batch processing: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@router.post("/process-live", response_model=LiveProcessResponse)
async def process_live(request: LiveProcessRequest):
    """Process a single image through pipeline with all intermediate steps (live mode)"""
    try:
        # Validate session
        if not session_manager.is_session_active(request.session_id):
            raise HTTPException(status_code=400, detail="Invalid or expired session")
        
        # Update session activity
        session_manager.update_session_activity(request.session_id)
        
        if not request.pipeline:
            # If no pipeline, return original image with zero timing
            session_upload_dir = settings.UPLOAD_DIR / request.session_id
            image_files = list(session_upload_dir.glob(f"{request.image_id}.*"))
            
            if not image_files:
                raise HTTPException(status_code=404, detail="Image not found")
            
            original_image = ImageProcessor.load_image(str(image_files[0]))
            original_base64 = ImageProcessor.image_to_base64(original_image)
            
            return LiveProcessResponse(
                success=True,
                results=[original_base64],
                total_time=0.0,
                step_timings=[],
                message="No operations applied - returning original image"
            )
        
        logger.info(f"Live processing image {request.image_id} with {len(request.pipeline)} operations")
        
        # Get session directory
        session_upload_dir = settings.UPLOAD_DIR / request.session_id
        
        # Find the image file
        image_files = list(session_upload_dir.glob(f"{request.image_id}.*"))
        if not image_files:
            raise HTTPException(status_code=404, detail="Image not found")
        
        image_path = str(image_files[0])
        
        # Process with intermediate results and timing
        result = await process_single_image_pipeline(
            image_path, 
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
            message=f"Live processing completed with {len(results)} steps"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in live processing: {e}")
        raise HTTPException(status_code=500, detail=f"Live processing failed: {str(e)}")

@router.get("/operations")
async def get_available_operations():
    """Get list of available image processing operations"""
    try:
        # Return the complete operations list from the ImageProcessor
        operations_list = list(ImageProcessor.OPERATIONS.keys())
        
        return JSONResponse(content={
            "success": True,
            "operations": operations_list,
            "total_count": len(operations_list)
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
