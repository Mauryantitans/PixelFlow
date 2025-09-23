"""
Main image processing service for PixelFlow backend.
"""

from PIL import Image
from services.operations import OPERATIONS
from utils.monitoring import monitor_memory, cleanup_image_objects


def validate_pipeline(pipeline):
    """
    Validate a pipeline array to ensure all operations exist and parameters are valid.
    
    Args:
        pipeline (list): List of operation objects with 'name' and 'params' keys
        
    Returns:
        bool: True if pipeline is valid
        
    Raises:
        ValueError: If pipeline format is invalid or contains unsupported operations
    """
    if not isinstance(pipeline, list):
        raise ValueError("Pipeline must be a list")
    
    # Handle empty pipeline
    if len(pipeline) == 0:
        return True
    
    for i, operation in enumerate(pipeline):
        # Validate operation structure
        if not isinstance(operation, dict):
            raise ValueError(f"Operation at index {i} must be a dictionary")
        
        if 'name' not in operation:
            raise ValueError(f"Operation at index {i} missing 'name' key")
        
        if 'params' not in operation:
            raise ValueError(f"Operation at index {i} missing 'params' key")
        
        # Validate operation name
        operation_name = operation['name']
        if not isinstance(operation_name, str):
            raise ValueError(f"Operation name at index {i} must be a string")
        
        if operation_name not in OPERATIONS:
            raise ValueError(f"Unsupported operation '{operation_name}' at index {i}. "
                           f"Supported operations: {sorted(OPERATIONS.keys())}")
        
        # Validate params structure
        params = operation['params']
        if not isinstance(params, dict):
            raise ValueError(f"Operation params at index {i} must be a dictionary")
    
    return True


def apply_operation(image, operation_name, params):
    """
    Apply a single image processing operation to a PIL Image.
    
    Args:
        image (PIL.Image): The PIL Image object to process
        operation_name (str): Name of the operation to apply
        params (dict): Parameters for the operation
        
    Returns:
        PIL.Image: Processed PIL Image object
        
    Raises:
        ValueError: If operation name is invalid or parameters are incorrect
    """
    if not isinstance(image, Image.Image):
        raise ValueError("Invalid image object provided")
    
    if not isinstance(params, dict):
        raise ValueError("Parameters must be a dictionary")
    
    if operation_name not in OPERATIONS:
        raise ValueError(f"Unsupported operation: {operation_name}. "
                        f"Supported operations: {list(OPERATIONS.keys())}")
    
    try:
        return OPERATIONS[operation_name](image, params)
    except Exception as e:
        raise ValueError(f"Failed to apply {operation_name} operation: {str(e)}")


@monitor_memory
def process_pipeline(image, pipeline):
    """
    Apply a full pipeline of operations to a single image sequentially with memory optimization.
    
    Args:
        image (PIL.Image): The PIL Image object to process
        pipeline (list): List of operation objects with 'name' and 'params' keys
        
    Returns:
        PIL.Image: Final processed PIL Image object after applying all operations
        
    Raises:
        ValueError: If pipeline is invalid or any operation fails
    """
    if not isinstance(image, Image.Image):
        raise ValueError("Invalid image object provided")
    
    # Validate pipeline structure
    validate_pipeline(pipeline)
    
    # Handle empty pipeline - return original image
    if len(pipeline) == 0:
        return image.copy()
    
    # Apply each operation sequentially with memory management
    current_image = image.copy()  # Work with a copy to preserve original
    previous_image = None
    
    for i, operation in enumerate(pipeline):
        try:
            operation_name = operation['name']
            params = operation['params']
            
            # Store reference to previous image for cleanup
            previous_image = current_image
            
            # Apply the operation
            current_image = apply_operation(current_image, operation_name, params)
            
            # Cleanup previous image to free memory (except for first iteration)
            if i > 0:
                cleanup_image_objects(previous_image)
            
        except Exception as e:
            # Cleanup on error
            cleanup_image_objects(previous_image, current_image)
            raise ValueError(f"Failed to apply operation '{operation['name']}' at index {i}: {str(e)}")
    
    return current_image


@monitor_memory
def process_pipeline_with_steps(image, pipeline):
    """
    Apply a pipeline of operations to a single image and capture intermediate results for live mode.
    
    Args:
        image (PIL.Image): The PIL Image object to process
        pipeline (list): List of operation objects with 'name' and 'params' keys
        
    Returns:
        list: List of PIL Image objects representing the image state after each operation
        
    Raises:
        ValueError: If pipeline is invalid or any operation fails
    """
    if not isinstance(image, Image.Image):
        raise ValueError("Invalid image object provided")
    
    # Validate pipeline structure
    validate_pipeline(pipeline)
    
    # Handle empty pipeline - return empty results array
    if len(pipeline) == 0:
        return []
    
    # Apply each operation and save intermediate results with memory management
    current_image = image.copy()  # Work with a copy to preserve original
    results = []
    previous_image = None
    
    for i, operation in enumerate(pipeline):
        try:
            operation_name = operation['name']
            params = operation['params']
            
            # Store reference to previous image for cleanup
            previous_image = current_image
            
            # Apply the operation
            current_image = apply_operation(current_image, operation_name, params)
            
            # Save intermediate result (make a copy to avoid reference issues)
            results.append(current_image.copy())
            
            # Don't cleanup the first image (original copy) or current image
            if i > 0:
                cleanup_image_objects(previous_image)
            
        except Exception as e:
            # Cleanup on error
            cleanup_image_objects(previous_image, current_image)
            for result_img in results:
                cleanup_image_objects(result_img)
            raise ValueError(f"Failed to apply operation '{operation['name']}' at index {i}: {str(e)}")
    
    return results