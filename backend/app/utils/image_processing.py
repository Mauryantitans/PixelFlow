from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import cv2
import numpy as np
from skimage import filters, exposure, transform
import io
import base64
from pathlib import Path
from typing import Dict, Any, List, Tuple
import logging

logger = logging.getLogger(__name__)

class ImageProcessor:
    """Handles all image processing operations"""
    
    @staticmethod
    def load_image(file_path: str) -> Image.Image:
        """Load image from file path"""
        try:
            return Image.open(file_path).convert('RGB')
        except Exception as e:
            logger.error(f"Error loading image {file_path}: {e}")
            raise ValueError(f"Could not load image: {e}")
    
    @staticmethod
    def save_image(image: Image.Image, file_path: str, quality: int = 95) -> None:
        """Save image to file path"""
        try:
            image.save(file_path, quality=quality, optimize=True)
        except Exception as e:
            logger.error(f"Error saving image {file_path}: {e}")
            raise ValueError(f"Could not save image: {e}")
    
    @staticmethod
    def image_to_base64(image: Image.Image, format: str = 'JPEG') -> str:
        """Convert PIL Image to base64 string"""
        try:
            # Handle RGBA images by converting to RGB for JPEG
            if image.mode == 'RGBA' and format.upper() == 'JPEG':
                # Create a white background
                background = Image.new('RGB', image.size, (255, 255, 255))
                background.paste(image, mask=image.split()[-1])  # Use alpha channel as mask
                image = background
            elif image.mode not in ('RGB', 'L'):
                # Convert other modes to RGB
                image = image.convert('RGB')
                
            buffer = io.BytesIO()
            image.save(buffer, format=format, quality=95)
            img_str = base64.b64encode(buffer.getvalue()).decode()
            return f"data:image/{format.lower()};base64,{img_str}"
        except Exception as e:
            logger.error(f"Error converting image to base64: {e}")
            raise ValueError(f"Could not convert image to base64: {e}")
    
    @staticmethod
    def create_thumbnail(image: Image.Image, size: Tuple[int, int] = (150, 150)) -> str:
        """Create thumbnail and return as base64"""
        try:
            thumbnail = image.copy()
            
            # Handle RGBA images by converting to RGB
            if thumbnail.mode == 'RGBA':
                background = Image.new('RGB', thumbnail.size, (255, 255, 255))
                background.paste(thumbnail, mask=thumbnail.split()[-1])
                thumbnail = background
            elif thumbnail.mode not in ('RGB', 'L'):
                thumbnail = thumbnail.convert('RGB')
                
            thumbnail.thumbnail(size, Image.Resampling.LANCZOS)
            return ImageProcessor.image_to_base64(thumbnail, 'JPEG')
        except Exception as e:
            logger.error(f"Error creating thumbnail: {e}")
            raise ValueError(f"Could not create thumbnail: {e}")
    
    @staticmethod
    def apply_brightness(image: Image.Image, amount: int) -> Image.Image:
        """Apply brightness adjustment (-100 to 100)"""
        try:
            # Convert amount to enhancer factor
            factor = 1.0 + (amount / 100.0)
            factor = max(0.1, min(factor, 3.0))  # Clamp between 0.1 and 3.0
            enhancer = ImageEnhance.Brightness(image)
            return enhancer.enhance(factor)
        except Exception as e:
            logger.error(f"Error applying brightness: {e}")
            return image
    
    @staticmethod
    def apply_contrast(image: Image.Image, amount: int) -> Image.Image:
        """Apply contrast adjustment (-100 to 100)"""
        try:
            factor = 1.0 + (amount / 100.0)
            factor = max(0.1, min(factor, 3.0))
            enhancer = ImageEnhance.Contrast(image)
            return enhancer.enhance(factor)
        except Exception as e:
            logger.error(f"Error applying contrast: {e}")
            return image
    
    @staticmethod
    def apply_saturation(image: Image.Image, amount: int) -> Image.Image:
        """Apply saturation adjustment (-100 to 100)"""
        try:
            factor = 1.0 + (amount / 100.0)
            factor = max(0.0, min(factor, 3.0))
            enhancer = ImageEnhance.Color(image)
            return enhancer.enhance(factor)
        except Exception as e:
            logger.error(f"Error applying saturation: {e}")
            return image
    
    @staticmethod
    def apply_exposure(image: Image.Image, amount: int) -> Image.Image:
        """Apply exposure adjustment (-100 to 100)"""
        try:
            # Convert to numpy array for exposure adjustment
            img_array = np.array(image)
            # Apply gamma correction for exposure effect
            gamma = 1.0 + (amount / 200.0)  # More subtle than brightness
            gamma = max(0.3, min(gamma, 2.5))
            corrected = exposure.adjust_gamma(img_array, gamma)
            return Image.fromarray((corrected * 255).astype(np.uint8))
        except Exception as e:
            logger.error(f"Error applying exposure: {e}")
            return image
    
    @staticmethod
    def apply_grayscale(image: Image.Image, **kwargs) -> Image.Image:
        """Convert to grayscale"""
        try:
            return ImageOps.grayscale(image).convert('RGB')
        except Exception as e:
            logger.error(f"Error applying grayscale: {e}")
            return image
    
    @staticmethod
    def apply_sepia(image: Image.Image, **kwargs) -> Image.Image:
        """Apply sepia tone effect"""
        try:
            # Convert to grayscale first
            grayscale = ImageOps.grayscale(image)
            # Apply sepia tone
            sepia = ImageOps.colorize(grayscale, '#704214', '#C0A882')
            return sepia.convert('RGB')
        except Exception as e:
            logger.error(f"Error applying sepia: {e}")
            return image
    
    @staticmethod
    def apply_invert(image: Image.Image, **kwargs) -> Image.Image:
        """Invert image colors"""
        try:
            return ImageOps.invert(image)
        except Exception as e:
            logger.error(f"Error applying invert: {e}")
            return image
    
    @staticmethod
    def apply_solarize(image: Image.Image, **kwargs) -> Image.Image:
        """Apply solarization effect"""
        try:
            return ImageOps.solarize(image, threshold=128)
        except Exception as e:
            logger.error(f"Error applying solarize: {e}")
            return image
    
    @staticmethod
    def apply_posterize(image: Image.Image, **kwargs) -> Image.Image:
        """Apply posterization effect"""
        try:
            return ImageOps.posterize(image, bits=4)
        except Exception as e:
            logger.error(f"Error applying posterize: {e}")
            return image
    
    @staticmethod
    def apply_gaussian_blur(image: Image.Image, radius: int) -> Image.Image:
        """Apply Gaussian blur"""
        try:
            # Clamp radius
            radius = max(0, min(radius, 50))
            if radius == 0:
                return image
            return image.filter(ImageFilter.GaussianBlur(radius=radius))
        except Exception as e:
            logger.error(f"Error applying gaussian blur: {e}")
            return image
    
    @staticmethod
    def apply_sharpen(image: Image.Image, level: str) -> Image.Image:
        """Apply sharpening filter"""
        try:
            if level == 'Low':
                kernel = ImageFilter.Kernel((3, 3), [0, -1, 0, -1, 5, -1, 0, -1, 0])
            elif level == 'Medium':
                kernel = ImageFilter.Kernel((3, 3), [-1, -1, -1, -1, 9, -1, -1, -1, -1])
            else:  # High
                kernel = ImageFilter.Kernel((3, 3), [-2, -2, -2, -2, 17, -2, -2, -2, -2])
            return image.filter(kernel)
        except Exception as e:
            logger.error(f"Error applying sharpen: {e}")
            return image
    
    @staticmethod
    def apply_vignette(image: Image.Image, strength: int) -> Image.Image:
        """Apply vignette effect"""
        try:
            width, height = image.size
            # Create vignette mask
            center_x, center_y = width // 2, height // 2
            max_radius = min(center_x, center_y)
            
            # Create gradient
            mask = Image.new('L', (width, height), 255)
            mask_array = np.array(mask)
            
            for y in range(height):
                for x in range(width):
                    distance = np.sqrt((x - center_x) ** 2 + (y - center_y) ** 2)
                    normalized_distance = min(distance / max_radius, 1.0)
                    
                    # Apply strength
                    vignette_factor = 1.0 - (normalized_distance * (strength / 100.0))
                    vignette_factor = max(0.2, vignette_factor)
                    mask_array[y, x] = int(255 * vignette_factor)
            
            mask = Image.fromarray(mask_array)
            
            # Apply mask to each channel
            r, g, b = image.split()
            r = Image.composite(Image.new('L', image.size, 0), r, mask)
            g = Image.composite(Image.new('L', image.size, 0), g, mask)
            b = Image.composite(Image.new('L', image.size, 0), b, mask)
            
            return Image.merge('RGB', (r, g, b))
        except Exception as e:
            logger.error(f"Error applying vignette: {e}")
            return image
    
    @staticmethod
    def apply_grain(image: Image.Image, **kwargs) -> Image.Image:
        """Add film grain effect"""
        try:
            width, height = image.size
            # Create noise
            noise = np.random.randint(0, 50, (height, width, 3), dtype=np.uint8)
            noise_image = Image.fromarray(noise)
            
            # Blend with original
            return Image.blend(image, noise_image, alpha=0.1)
        except Exception as e:
            logger.error(f"Error applying grain: {e}")
            return image
    
    # Operation mapping
    OPERATIONS = {
        'Brightness': apply_brightness.__func__,
        'Contrast': apply_contrast.__func__,
        'Saturation': apply_saturation.__func__,
        'Exposure': apply_exposure.__func__,
        'Grayscale': apply_grayscale.__func__,
        'Sepia': apply_sepia.__func__,
        'Invert': apply_invert.__func__,
        'Solarize': apply_solarize.__func__,
        'Posterize': apply_posterize.__func__,
        'Gaussian Blur': apply_gaussian_blur.__func__,
        'Sharpen': apply_sharpen.__func__,
        'Vignette': apply_vignette.__func__,
        'Grain': apply_grain.__func__,
    }
    
    @classmethod
    def apply_operation(cls, image: Image.Image, operation_name: str, params: Dict[str, Any]) -> Image.Image:
        """Apply a single operation to an image"""
        if operation_name not in cls.OPERATIONS:
            logger.warning(f"Unknown operation: {operation_name}")
            return image
        
        operation_func = cls.OPERATIONS[operation_name]
        try:
            return operation_func(image, **params)
        except Exception as e:
            logger.error(f"Error applying operation {operation_name}: {e}")
            return image
    
    @classmethod
    def apply_pipeline(cls, image_path: str, pipeline: List[Dict[str, Any]]) -> Tuple[Image.Image, List[Image.Image]]:
        """Apply a complete pipeline to an image, returning final result and intermediate steps"""
        try:
            current_image = cls.load_image(image_path)
            intermediate_results = []
            
            for step in pipeline:
                operation_name = step.get('name')
                params = step.get('params', {})
                
                current_image = cls.apply_operation(current_image, operation_name, params)
                intermediate_results.append(current_image.copy())
            
            return current_image, intermediate_results
        except Exception as e:
            logger.error(f"Error applying pipeline: {e}")
            raise ValueError(f"Pipeline processing failed: {e}")