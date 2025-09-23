"""
API routes for PixelFlow backend image processing.
"""

from flask import Blueprint, request, jsonify, current_app
from services.image_processor import process_pipeline, process_pipeline_with_steps
from utils.base64_utils import decode_base64_image, encode_image_to_base64
from utils.monitoring import monitor_memory, cleanup_image_objects
import gc

api_bp = Blueprint('api', __name__)


@api_bp.route('/process', methods=['POST'])
@monitor_memory
def process_batch():
    """
    Process multiple images with a pipeline of operations.
    
    Expected JSON payload:
    {
        "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...", "..."],
        "pipeline": [
            {"name": "Brightness", "params": {"amount": 25}},
            {"name": "Grayscale", "params": {}}
        ]
    }
    
    Returns:
    {
        "processed_images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...", "..."]
    }
    """
    try:
        # Validate request content type
        if not request.is_json:
            current_app.logger.error("Batch processing request missing JSON content-type")
            return jsonify({
                'error': 'Invalid request format',
                'details': 'Request must have Content-Type: application/json'
            }), 400
        
        # Get JSON payload
        try:
            data = request.get_json()
        except Exception as e:
            current_app.logger.error(f"Failed to parse JSON payload: {str(e)}")
            return jsonify({
                'error': 'Invalid JSON payload',
                'details': f'Failed to parse JSON: {str(e)}'
            }), 400
        
        if data is None:
            current_app.logger.error("Batch processing request with empty JSON payload")
            return jsonify({
                'error': 'Empty JSON payload',
                'details': 'Request body must contain valid JSON data'
            }), 400
        
        # Validate required keys
        if 'images' not in data:
            current_app.logger.error("Batch processing request missing 'images' key")
            return jsonify({
                'error': 'Missing required field',
                'details': "Request must include 'images' array"
            }), 400
        
        if 'pipeline' not in data:
            current_app.logger.error("Batch processing request missing 'pipeline' key")
            return jsonify({
                'error': 'Missing required field',
                'details': "Request must include 'pipeline' array"
            }), 400
        
        images = data['images']
        pipeline = data['pipeline']
        
        # Validate images array
        if not isinstance(images, list):
            current_app.logger.error("Batch processing 'images' field is not an array")
            return jsonify({
                'error': 'Invalid images format',
                'details': "'images' must be an array of Base64 encoded image strings"
            }), 400
        
        # Validate pipeline array
        if not isinstance(pipeline, list):
            current_app.logger.error("Batch processing 'pipeline' field is not an array")
            return jsonify({
                'error': 'Invalid pipeline format',
                'details': "'pipeline' must be an array of operation objects"
            }), 400
        
        # Handle empty images array after validation
        if len(images) == 0:
            current_app.logger.warning("Batch processing request with empty images array")
            return jsonify({'processed_images': []}), 200
        
        current_app.logger.info(f"Starting batch processing of {len(images)} images with {len(pipeline)} operations")
        
        # Process each image with the pipeline
        processed_images = []
        
        for i, image_data in enumerate(images):
            image = None
            processed_image = None
            try:
                # Validate image data type
                if not isinstance(image_data, str):
                    current_app.logger.error(f"Image at index {i} is not a string")
                    return jsonify({
                        'error': 'Invalid image format',
                        'details': f'Image at index {i} must be a Base64 encoded string'
                    }), 400
                
                # Decode Base64 image
                try:
                    image = decode_base64_image(image_data)
                    current_app.logger.debug(f"Successfully decoded image {i+1}/{len(images)}")
                except ValueError as e:
                    current_app.logger.error(f"Failed to decode image at index {i}: {str(e)}")
                    return jsonify({
                        'error': 'Image decoding failed',
                        'details': f'Failed to decode image at index {i}: {str(e)}'
                    }), 400
                
                # Apply pipeline to image
                try:
                    processed_image = process_pipeline(image, pipeline)
                    current_app.logger.debug(f"Successfully processed image {i+1}/{len(images)}")
                except ValueError as e:
                    current_app.logger.error(f"Failed to process image at index {i}: {str(e)}")
                    cleanup_image_objects(image, processed_image)
                    return jsonify({
                        'error': 'Image processing failed',
                        'details': f'Failed to process image at index {i}: {str(e)}'
                    }), 500
                
                # Encode processed image back to Base64
                try:
                    processed_base64 = encode_image_to_base64(processed_image)
                    processed_images.append(processed_base64)
                    current_app.logger.debug(f"Successfully encoded processed image {i+1}/{len(images)}")
                except ValueError as e:
                    current_app.logger.error(f"Failed to encode processed image at index {i}: {str(e)}")
                    cleanup_image_objects(image, processed_image)
                    return jsonify({
                        'error': 'Image encoding failed',
                        'details': f'Failed to encode processed image at index {i}: {str(e)}'
                    }), 500
                
                # Cleanup images after successful processing
                cleanup_image_objects(image, processed_image)
                
                # Force garbage collection every 5 images to manage memory
                if (i + 1) % 5 == 0:
                    gc.collect()
                    current_app.logger.debug(f"Performed garbage collection after processing {i+1} images")
                
            except Exception as e:
                # Catch any unexpected errors during image processing
                current_app.logger.error(f"Unexpected error processing image at index {i}: {str(e)}")
                cleanup_image_objects(image, processed_image)
                return jsonify({
                    'error': 'Unexpected processing error',
                    'details': f'Unexpected error processing image at index {i}: {str(e)}'
                }), 500
        
        current_app.logger.info(f"Successfully completed batch processing of {len(images)} images")
        
        # Return processed images in same order as input
        return jsonify({
            'processed_images': processed_images
        }), 200
        
    except Exception as e:
        # Catch any unexpected errors at the endpoint level
        current_app.logger.error(f"Unexpected error in batch processing endpoint: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'details': f'Unexpected error: {str(e)}'
        }), 500


@api_bp.route('/process-live', methods=['POST'])
@monitor_memory
def process_live():
    """
    Process a single image with a pipeline of operations and capture intermediate results.
    
    Expected JSON payload:
    {
        "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        "pipeline": [
            {"name": "Brightness", "params": {"amount": 25}},
            {"name": "Contrast", "params": {"amount": 15}}
        ]
    }
    
    Returns:
    {
        "results": [
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...", // After Brightness
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."  // After Contrast
        ]
    }
    """
    try:
        # Validate request content type
        if not request.is_json:
            current_app.logger.error("Live processing request missing JSON content-type")
            return jsonify({
                'error': 'Invalid request format',
                'details': 'Request must have Content-Type: application/json'
            }), 400
        
        # Get JSON payload
        try:
            data = request.get_json()
        except Exception as e:
            current_app.logger.error(f"Failed to parse JSON payload in live processing: {str(e)}")
            return jsonify({
                'error': 'Invalid JSON payload',
                'details': f'Failed to parse JSON: {str(e)}'
            }), 400
        
        if data is None:
            current_app.logger.error("Live processing request with empty JSON payload")
            return jsonify({
                'error': 'Empty JSON payload',
                'details': 'Request body must contain valid JSON data'
            }), 400
        
        # Validate required keys
        if 'image' not in data:
            current_app.logger.error("Live processing request missing 'image' key")
            return jsonify({
                'error': 'Missing required field',
                'details': "Request must include 'image' Base64 string"
            }), 400
        
        if 'pipeline' not in data:
            current_app.logger.error("Live processing request missing 'pipeline' key")
            return jsonify({
                'error': 'Missing required field',
                'details': "Request must include 'pipeline' array"
            }), 400
        
        image_data = data['image']
        pipeline = data['pipeline']
        
        # Validate image data
        if not isinstance(image_data, str):
            current_app.logger.error("Live processing 'image' field is not a string")
            return jsonify({
                'error': 'Invalid image format',
                'details': "'image' must be a Base64 encoded image string"
            }), 400
        
        # Validate pipeline array
        if not isinstance(pipeline, list):
            current_app.logger.error("Live processing 'pipeline' field is not an array")
            return jsonify({
                'error': 'Invalid pipeline format',
                'details': "'pipeline' must be an array of operation objects"
            }), 400
        
        # Decode Base64 image (validate image before processing)
        try:
            image = decode_base64_image(image_data)
            current_app.logger.debug("Successfully decoded image for live processing")
        except ValueError as e:
            current_app.logger.error(f"Failed to decode image in live processing: {str(e)}")
            return jsonify({
                'error': 'Image decoding failed',
                'details': f'Failed to decode image: {str(e)}'
            }), 400
        
        current_app.logger.info(f"Starting live processing with {len(pipeline)} operations")
        
        # Handle empty pipeline case
        if len(pipeline) == 0:
            current_app.logger.info("Live processing with empty pipeline, returning empty results")
            return jsonify({'results': []}), 200
        
        # Process pipeline with intermediate results
        intermediate_images = []
        try:
            intermediate_images = process_pipeline_with_steps(image, pipeline)
            current_app.logger.debug(f"Successfully processed pipeline with {len(intermediate_images)} intermediate results")
        except ValueError as e:
            current_app.logger.error(f"Failed to process pipeline in live processing: {str(e)}")
            cleanup_image_objects(image)
            return jsonify({
                'error': 'Image processing failed',
                'details': f'Failed to process pipeline: {str(e)}'
            }), 500
        
        # Ensure results array length matches pipeline length
        if len(intermediate_images) != len(pipeline):
            current_app.logger.error(f"Results array length ({len(intermediate_images)}) doesn't match pipeline length ({len(pipeline)})")
            cleanup_image_objects(image, *intermediate_images)
            return jsonify({
                'error': 'Processing inconsistency',
                'details': f'Expected {len(pipeline)} results but got {len(intermediate_images)}'
            }), 500
        
        # Encode all intermediate results to Base64
        results = []
        for i, processed_image in enumerate(intermediate_images):
            try:
                processed_base64 = encode_image_to_base64(processed_image)
                results.append(processed_base64)
                current_app.logger.debug(f"Successfully encoded intermediate result {i+1}/{len(intermediate_images)}")
            except ValueError as e:
                current_app.logger.error(f"Failed to encode intermediate result at step {i}: {str(e)}")
                cleanup_image_objects(image, *intermediate_images)
                return jsonify({
                    'error': 'Image encoding failed',
                    'details': f'Failed to encode result at step {i}: {str(e)}'
                }), 500
        
        # Cleanup all images after successful processing
        cleanup_image_objects(image, *intermediate_images)
        
        current_app.logger.info(f"Successfully completed live processing with {len(results)} results")
        
        # Return step-by-step processed images
        return jsonify({
            'results': results
        }), 200
        
    except Exception as e:
        # Catch any unexpected errors at the endpoint level
        current_app.logger.error(f"Unexpected error in live processing endpoint: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'details': f'Unexpected error: {str(e)}'
        }), 500