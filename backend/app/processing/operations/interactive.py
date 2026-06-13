"""
Interactive operations — the ones whose inputs are picked on the image
(a seed point, a region rectangle) rather than typed. They demonstrate the
point / rect / color parameter types end-to-end: the executor materializes the
normalized coordinates to pixels against the live image before calling these
functions.

Adding a new interactive technique is just: write the function, register it with
its typed params. No frontend changes are needed — the schema-driven UI renders
the right pickers automatically.
"""

from __future__ import annotations

import cv2
import numpy as np
from PIL import Image

from ..param_specs import ColorParam, IntParam, PointParam, RectParam
from ..registry import OperationSpec, registry


def apply_flood_fill(image, seed=None, fill_color=(255, 0, 0), tolerance=20):
    """Fill the connected region around a clicked seed point with a color."""
    if seed is None:  # no point picked yet — leave the image unchanged
        return image

    arr = np.array(image.convert("RGB"))
    h, w = arr.shape[:2]
    px = max(0, min(int(seed[0]), w - 1))
    py = max(0, min(int(seed[1]), h - 1))

    mask = np.zeros((h + 2, w + 2), np.uint8)
    new_val = tuple(int(c) for c in fill_color)  # (r, g, b) — array is RGB
    diff = (int(tolerance),) * 3
    flags = 4 | cv2.FLOODFILL_FIXED_RANGE
    cv2.floodFill(arr, mask, (px, py), new_val, diff, diff, flags)
    return Image.fromarray(arr)


def apply_crop(image, roi=None):
    """Crop the image to a rectangle drawn on the preview."""
    if roi is None:  # no region drawn yet
        return image
    x, y, w, h = (int(v) for v in roi)
    return image.crop((x, y, x + w, y + h))


def register() -> None:
    registry.register(
        OperationSpec(
            id="flood_fill",
            label="Flood Fill",
            category="OpenCV",
            subcategory="Segmentation",
            description="Fill the connected region around a clicked seed point with a color.",
            fn=apply_flood_fill,
            params=[
                PointParam(
                    name="seed",
                    label="Seed point",
                    help="Click the image to set where the fill starts",
                ),
                ColorParam(name="fill_color", label="Fill color", default="#ff3b30"),
                IntParam(
                    name="tolerance",
                    label="Tolerance",
                    default=20,
                    min=0,
                    max=255,
                    help="How similar neighbouring pixels must be to get filled",
                ),
            ],
        )
    )
    registry.register(
        OperationSpec(
            id="crop",
            label="Crop",
            category="OpenCV",
            subcategory="Geometric Transformations",
            description="Crop the image to a rectangular region drawn on the preview.",
            fn=apply_crop,
            params=[RectParam(name="roi", label="Region", help="Drag a rectangle on the image")],
        )
    )


register()
