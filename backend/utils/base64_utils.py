"""
Base64 image conversion utilities for PixelFlow backend.
"""

import base64
import io
from PIL import Image
from utils.monitoring import monitor_memory, cleanup_image_objects


@monitor_memory
def decode_base64_image(base64_string):
    """
    Convert Base64 string to PIL Image object with optimized memory usage.
    
    Args:
        base64_string (str): Base64 encoded image string, optionally with data URI header
        
    Returns:
        PIL.Image: Decoded PIL Image object
        
    Raises:
        ValueError: If Base64 data is invalid or image format is unsupported
    """
    image_buffer = None
    try:
        # Validate input type
        if not isinstance(base64_string, str):
            raise ValueError("Base64 string must be a string")
        
        # Strip data URI header if present (e.g., "data:image/png;base64,")
        if base64_string.startswith('data:'):
            # Find the comma that separates header from data
            comma_index = base64_string.find(',')
            if comma_index == -1:
                raise ValueError("Invalid data URI format: missing comma separator")
            base64_data = base64_string[comma_index + 1:]
        else:
            base64_data = base64_string
        
        # Validate Base64 data is not empty
        if not base64_data.strip():
            raise ValueError("Invalid Base64 data: empty data")
        
        # Optimized Base64 decoding with memory efficiency
        try:
            # Use altchars parameter for better performance with URL-safe Base64
            image_data = base64.b64decode(base64_data, validate=True)
        except Exception as e:
            raise ValueError(f"Invalid Base64 data: {str(e)}")
        
        # Validate decoded data is not empty
        if len(image_data) == 0:
            raise ValueError("Invalid Base64 data: decoded data is empty")
        
        # Create PIL Image from decoded data with optimized buffer handling
        try:
            image_buffer = io.BytesIO(image_data)
            image = Image.open(image_buffer)
            # Load the image to ensure it's valid and close buffer connection
            image.load()
            
            # Optimize image mode for processing
            if image.mode not in ('RGB', 'RGBA', 'L'):
                image = image.convert('RGB')
            
            return image
        except Exception as e:
            raise ValueError(f"Unsupported image format or corrupted data: {str(e)}")
            
    except ValueError:
        # Re-raise ValueError as-is
        raise
    except Exception as e:
        # Catch any other unexpected errors
        raise ValueError(f"Failed to decode Base64 image: {str(e)}")
    finally:
        # Cleanup buffer
        if image_buffer:
            image_buffer.close()


@monitor_memory
def encode_image_to_base64(image, format='PNG', quality=95):
    """
    Convert PIL Image object to Base64 string with data URI header and optimized encoding.
    
    Args:
        image (PIL.Image): PIL Image object to encode
        format (str): Image format for encoding (default: 'PNG')
        quality (int): JPEG quality (1-100, only used for JPEG format)
        
    Returns:
        str: Base64 encoded image string with data URI header
        
    Raises:
        ValueError: If image encoding fails
    """
    buffer = None
    temp_image = None
    try:
        # Create buffer to hold image data
        buffer = io.BytesIO()
        
        # Convert image to RGB if it's in RGBA mode and format doesn't support transparency
        if format.upper() == 'JPEG' and image.mode in ('RGBA', 'LA'):
            # Create white background for JPEG
            temp_image = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'RGBA':
                temp_image.paste(image, mask=image.split()[-1])  # Use alpha channel as mask
            else:
                temp_image.paste(image)
            image_to_save = temp_image
        else:
            image_to_save = image
        
        # Save image to buffer with optimized settings
        try:
            save_kwargs = {'format': format.upper()}
            if format.upper() == 'JPEG':
                save_kwargs.update({
                    'quality': quality,
                    'optimize': True,
                    'progressive': True
                })
            elif format.upper() == 'PNG':
                save_kwargs.update({
                    'optimize': True,
                    'compress_level': 6  # Good balance between speed and compression
                })
            
            image_to_save.save(buffer, **save_kwargs)
        except Exception as e:
            raise ValueError(f"Failed to save image in {format} format: {str(e)}")
        
        # Get image data and encode to Base64 with optimized encoding
        image_data = buffer.getvalue()
        
        # Use optimized Base64 encoding
        base64_data = base64.b64encode(image_data).decode('ascii')
        
        # Create data URI with appropriate MIME type
        mime_type = f"image/{format.lower()}"
        data_uri = f"data:{mime_type};base64,{base64_data}"
        
        return data_uri
        
    except ValueError:
        # Re-raise ValueError as-is
        raise
    except Exception as e:
        # Catch any other unexpected errors
        raise ValueError(f"Failed to encode image to Base64: {str(e)}")
    finally:
        # Cleanup resources
        if buffer:
            buffer.close()
        cleanup_image_objects(temp_image)