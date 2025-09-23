"""
Individual image processing operations for PixelFlow backend.
"""

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps


def apply_brightness(image, params):
    """Apply brightness adjustment to an image."""
    if 'amount' not in params:
        raise ValueError("Brightness operation requires 'amount' parameter")
    
    amount = params['amount']
    
    # Validate amount parameter
    if not isinstance(amount, (int, float)):
        raise ValueError("Brightness amount must be a number")
    
    if amount < -100 or amount > 100:
        raise ValueError("Brightness amount must be between -100 and 100")
    
    # Convert amount (-100 to 100) to Pillow factor
    factor = 1 + (amount / 100.0)
    
    # Apply brightness enhancement
    enhancer = ImageEnhance.Brightness(image)
    return enhancer.enhance(factor)


def apply_contrast(image, params):
    """Apply contrast adjustment to an image."""
    if 'amount' not in params:
        raise ValueError("Contrast operation requires 'amount' parameter")
    
    amount = params['amount']
    
    # Validate amount parameter
    if not isinstance(amount, (int, float)):
        raise ValueError("Contrast amount must be a number")
    
    if amount < -100 or amount > 100:
        raise ValueError("Contrast amount must be between -100 and 100")
    
    # Convert amount (-100 to 100) to Pillow factor
    factor = 1 + (amount / 100.0)
    
    # Apply contrast enhancement
    enhancer = ImageEnhance.Contrast(image)
    return enhancer.enhance(factor)


def apply_grayscale(image, params):
    """Convert an image to grayscale."""
    if not isinstance(params, dict):
        raise ValueError("Parameters must be a dictionary")
    
    # Convert to grayscale using ImageOps
    return ImageOps.grayscale(image)


def apply_saturation(image, params):
    """Apply saturation adjustment to an image."""
    if 'amount' not in params:
        raise ValueError("Saturation operation requires 'amount' parameter")
    
    amount = params['amount']
    
    # Validate amount parameter
    if not isinstance(amount, (int, float)):
        raise ValueError("Saturation amount must be a number")
    
    if amount < -100 or amount > 100:
        raise ValueError("Saturation amount must be between -100 and 100")
    
    # Convert amount (-100 to 100) to Pillow factor
    factor = 1 + (amount / 100.0)
    
    # Apply saturation enhancement
    enhancer = ImageEnhance.Color(image)
    return enhancer.enhance(factor)


def apply_exposure(image, params):
    """Apply exposure adjustment to an image."""
    if 'amount' not in params:
        raise ValueError("Exposure operation requires 'amount' parameter")
    
    amount = params['amount']
    
    # Validate amount parameter
    if not isinstance(amount, (int, float)):
        raise ValueError("Exposure amount must be a number")
    
    if amount < -100 or amount > 100:
        raise ValueError("Exposure amount must be between -100 and 100")
    
    # Convert amount (-100 to 100) to Pillow factor
    factor = 1 + (amount / 100.0)
    
    # Apply exposure adjustment using brightness enhancement
    enhancer = ImageEnhance.Brightness(image)
    return enhancer.enhance(factor)


def apply_sharpen(image, params):
    """Apply sharpening to an image."""
    if 'level' not in params:
        raise ValueError("Sharpen operation requires 'level' parameter")
    
    level = params['level']
    
    # Validate level parameter
    if not isinstance(level, str):
        raise ValueError("Sharpen level must be a string")
    
    # Map level to sharpening factor
    level_mapping = {
        'Low': 1.5,
        'Medium': 2.0,
        'High': 3.0
    }
    
    if level not in level_mapping:
        raise ValueError(f"Invalid sharpen level: {level}. Must be one of: {list(level_mapping.keys())}")
    
    factor = level_mapping[level]
    
    # Apply sharpening enhancement
    enhancer = ImageEnhance.Sharpness(image)
    return enhancer.enhance(factor)


def apply_gaussian_blur(image, params):
    """Apply Gaussian blur to an image."""
    if 'radius' not in params:
        raise ValueError("Gaussian Blur operation requires 'radius' parameter")
    
    radius = params['radius']
    
    # Validate radius parameter
    if not isinstance(radius, (int, float)):
        raise ValueError("Gaussian Blur radius must be a number")
    
    if radius < 0 or radius > 50:
        raise ValueError("Gaussian Blur radius must be between 0 and 50")
    
    # Apply Gaussian blur filter
    return image.filter(ImageFilter.GaussianBlur(radius=radius))


def apply_sepia(image, params):
    """Apply sepia tone effect to an image."""
    if not isinstance(params, dict):
        raise ValueError("Parameters must be a dictionary")
    
    # Convert image to RGB if it's not already
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Convert to numpy array for matrix operations
    img_array = np.array(image)
    
    # Sepia transformation matrix
    sepia_matrix = np.array([
        [0.393, 0.769, 0.189],
        [0.349, 0.686, 0.168],
        [0.272, 0.534, 0.131]
    ])
    
    # Apply sepia transformation
    sepia_img = img_array @ sepia_matrix.T
    
    # Clip values to valid range
    sepia_img = np.clip(sepia_img, 0, 255)
    
    # Convert back to PIL Image
    return Image.fromarray(sepia_img.astype(np.uint8))


def apply_invert(image, params):
    """Invert the colors of an image."""
    if not isinstance(params, dict):
        raise ValueError("Parameters must be a dictionary")
    
    # Invert the image colors
    return ImageOps.invert(image)


def apply_solarize(image, params):
    """Apply solarization effect to an image."""
    if not isinstance(params, dict):
        raise ValueError("Parameters must be a dictionary")
    
    # Apply solarization with default threshold
    return ImageOps.solarize(image, threshold=128)


def apply_posterize(image, params):
    """Apply posterization effect to an image."""
    if not isinstance(params, dict):
        raise ValueError("Parameters must be a dictionary")
    
    # Apply posterization with default bits (4 bits per channel)
    return ImageOps.posterize(image, bits=4)


def apply_vignette(image, params):
    """Apply vignette effect to an image."""
    if 'strength' not in params:
        raise ValueError("Vignette operation requires 'strength' parameter")
    
    strength = params['strength']
    
    # Validate strength parameter
    if not isinstance(strength, (int, float)):
        raise ValueError("Vignette strength must be a number")
    
    if strength < 0 or strength > 100:
        raise ValueError("Vignette strength must be between 0 and 100")
    
    # Convert image to RGB if it's not already
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Get image dimensions
    width, height = image.size
    
    # Create vignette mask
    center_x, center_y = width // 2, height // 2
    max_distance = np.sqrt(center_x**2 + center_y**2)
    
    # Create coordinate arrays
    x, y = np.meshgrid(np.arange(width), np.arange(height))
    
    # Calculate distance from center
    distance = np.sqrt((x - center_x)**2 + (y - center_y)**2)
    
    # Normalize distance and apply vignette strength
    normalized_distance = distance / max_distance
    vignette_factor = 1 - (strength / 100.0) * normalized_distance
    vignette_factor = np.clip(vignette_factor, 0, 1)
    
    # Convert image to numpy array
    img_array = np.array(image)
    
    # Apply vignette effect
    for channel in range(3):  # RGB channels
        img_array[:, :, channel] = img_array[:, :, channel] * vignette_factor
    
    # Convert back to PIL Image
    return Image.fromarray(img_array.astype(np.uint8))


# Operation registry
OPERATIONS = {
    'Brightness': apply_brightness,
    'Contrast': apply_contrast,
    'Grayscale': apply_grayscale,
    'Saturation': apply_saturation,
    'Exposure': apply_exposure,
    'Sharpen': apply_sharpen,
    'Gaussian Blur': apply_gaussian_blur,
    'Sepia': apply_sepia,
    'Invert': apply_invert,
    'Solarize': apply_solarize,
    'Posterize': apply_posterize,
    'Vignette': apply_vignette
}