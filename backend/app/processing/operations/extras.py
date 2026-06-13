"""
Curated batch of additional operations (Phase 5).

Each is a plain function (PIL RGB in/out) registered with typed params — the
schema-driven UI renders the right controls automatically. This batch is chosen
to exercise the full param-type system (bool, angle, color, float) and to add
commonly-requested techniques.
"""

from __future__ import annotations

import cv2
import numpy as np
from PIL import Image, ImageFilter
from skimage import filters as skfilters

from ..param_specs import AngleParam, BoolParam, ColorParam, FloatParam, IntParam, OddKernelParam
from ..registry import OperationSpec, registry


def _np(image: Image.Image) -> np.ndarray:
    return np.array(image.convert("RGB"))


def _pil(arr: np.ndarray) -> Image.Image:
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def threshold_binary(image, threshold=128, invert=False):
    gray = cv2.cvtColor(_np(image), cv2.COLOR_RGB2GRAY)
    mode = cv2.THRESH_BINARY_INV if invert else cv2.THRESH_BINARY
    _, binary = cv2.threshold(gray, int(threshold), 255, mode)
    return _pil(cv2.cvtColor(binary, cv2.COLOR_GRAY2RGB))


def pixelate(image, block_size=12):
    arr = _np(image)
    h, w = arr.shape[:2]
    bs = max(2, int(block_size))
    small = cv2.resize(arr, (max(1, w // bs), max(1, h // bs)), interpolation=cv2.INTER_LINEAR)
    return _pil(cv2.resize(small, (w, h), interpolation=cv2.INTER_NEAREST))


def emboss(image):
    return image.convert("RGB").filter(ImageFilter.EMBOSS)


def motion_blur(image, size=15, angle=0):
    size = max(3, int(size)) | 1  # force odd
    kernel = np.zeros((size, size), np.float32)
    kernel[size // 2, :] = 1.0
    rot = cv2.getRotationMatrix2D((size / 2 - 0.5, size / 2 - 0.5), float(angle), 1.0)
    kernel = cv2.warpAffine(kernel, rot, (size, size))
    total = kernel.sum()
    if total != 0:
        kernel /= total
    return _pil(cv2.filter2D(_np(image), -1, kernel))


def hue_rotate(image, degrees=0):
    hsv = cv2.cvtColor(_np(image), cv2.COLOR_RGB2HSV).astype(np.int32)
    shift = int(round(float(degrees) / 360.0 * 180)) % 180  # OpenCV hue is 0..179
    hsv[..., 0] = (hsv[..., 0] + shift) % 180
    return _pil(cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB))


def color_tint(image, color=(255, 255, 255), strength=0.3):
    arr = _np(image).astype(np.float32)
    tint = np.array(color, dtype=np.float32)
    s = float(strength)
    return _pil(arr * (1 - s) + tint * s)


def add_gaussian_noise(image, sigma=15.0):
    arr = _np(image).astype(np.float32)
    noise = np.random.normal(0, float(sigma), arr.shape)
    return _pil(arr + noise)


def pencil_sketch(image):
    gray = cv2.cvtColor(_np(image), cv2.COLOR_RGB2GRAY)
    inv = 255 - gray
    blur = cv2.GaussianBlur(inv, (21, 21), 0)
    sketch = cv2.divide(gray, 255 - blur, scale=256)
    return _pil(cv2.cvtColor(sketch, cv2.COLOR_GRAY2RGB))


def prewitt_edges(image):
    gray = cv2.cvtColor(_np(image), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
    edges = skfilters.prewitt(gray)
    edges = edges / (edges.max() or 1.0) * 255.0
    return _pil(cv2.cvtColor(edges.astype(np.uint8), cv2.COLOR_GRAY2RGB))


def cartoon(image):
    arr = _np(image)
    color = cv2.bilateralFilter(arr, 9, 250, 250)
    gray = cv2.medianBlur(cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY), 7)
    edges = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 2)
    return _pil(cv2.bitwise_and(color, cv2.cvtColor(edges, cv2.COLOR_GRAY2RGB)))


def register() -> None:
    def op(id, label, category, subcategory, description, fn, params=None):
        registry.register(
            OperationSpec(
                id=id,
                label=label,
                category=category,
                subcategory=subcategory,
                description=description,
                fn=fn,
                params=params or [],
            )
        )

    op(
        "threshold_binary",
        "Threshold Binary",
        "OpenCV",
        "Segmentation",
        "Binary threshold; optionally inverted.",
        threshold_binary,
        [
            IntParam(name="threshold", label="Threshold", default=128, min=0, max=255),
            BoolParam(name="invert", label="Invert", default=False),
        ],
    )
    op(
        "pixelate",
        "Pixelate",
        "Basic",
        "Effects",
        "Mosaic / pixelation effect.",
        pixelate,
        [IntParam(name="block_size", label="Block size", default=12, min=2, max=64)],
    )
    op("emboss", "Emboss", "Basic", "Effects", "Emboss / relief effect.", emboss)
    op(
        "motion_blur",
        "Motion Blur",
        "OpenCV",
        "Filtering",
        "Directional motion blur.",
        motion_blur,
        [
            OddKernelParam(name="size", label="Length", default=15, min=3, max=51),
            AngleParam(name="angle", label="Angle", default=0),
        ],
    )
    op(
        "hue_rotate",
        "Hue Rotate",
        "Basic",
        "Adjustments",
        "Rotate hue around the color wheel.",
        hue_rotate,
        [AngleParam(name="degrees", label="Degrees", default=0)],
    )
    op(
        "color_tint",
        "Color Tint",
        "Basic",
        "Effects",
        "Blend a solid color over the image.",
        color_tint,
        [
            ColorParam(name="color", label="Tint color", default="#ff8800"),
            FloatParam(name="strength", label="Strength", default=0.3, min=0.0, max=1.0, step=0.05),
        ],
    )
    op(
        "gaussian_noise",
        "Add Gaussian Noise",
        "Basic",
        "Effects",
        "Add random Gaussian noise.",
        add_gaussian_noise,
        [FloatParam(name="sigma", label="Sigma", default=15.0, min=0.0, max=60.0, step=1.0)],
    )
    op(
        "pencil_sketch",
        "Pencil Sketch",
        "Basic",
        "Stylize",
        "Pencil-sketch stylization.",
        pencil_sketch,
    )
    op(
        "prewitt_edges",
        "Prewitt Edges",
        "OpenCV",
        "Edge Detection",
        "Prewitt edge operator.",
        prewitt_edges,
    )
    op("cartoon", "Cartoon", "Basic", "Stylize", "Cartoon / comic stylization.", cartoon)


register()
