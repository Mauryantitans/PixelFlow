"""
Memory monitoring and performance utilities for PixelFlow backend.
"""

import psutil
import gc
import time
from functools import wraps
from flask import current_app


def get_memory_usage():
    """Get current memory usage in MB"""
    process = psutil.Process()
    return process.memory_info().rss / 1024 / 1024


def monitor_memory(func):
    """Decorator to monitor memory usage during function execution"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_memory = get_memory_usage()
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            end_memory = get_memory_usage()
            end_time = time.time()
            memory_delta = end_memory - start_memory
            execution_time = end_time - start_time
            
            current_app.logger.info(
                f"{func.__name__} - Memory: {start_memory:.1f}MB -> {end_memory:.1f}MB "
                f"(Δ{memory_delta:+.1f}MB), Time: {execution_time:.2f}s"
            )
            
            # Force garbage collection if memory usage increased significantly
            if memory_delta > 50:  # More than 50MB increase
                gc.collect()
                current_app.logger.info(f"Forced garbage collection after {func.__name__}")
    
    return wrapper


def cleanup_image_objects(*images):
    """Explicitly cleanup PIL Image objects to free memory"""
    for img in images:
        if img and hasattr(img, 'close'):
            try:
                img.close()
            except:
                pass