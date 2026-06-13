"""
Curated op batch 2 (Phase 5).

More famous techniques across photo enhancement, restoration, stylization,
segmentation and morphology — plus another interactive op (Inpaint Region, ROI)
and a two-color op (Duotone). Same pattern: plain PIL-in/PIL-out functions
registered with typed params.
"""

from __future__ import annotations

import cv2
import numpy as np
from PIL import Image
from skimage import filters as skfilters
from skimage import morphology, restoration

from ..param_specs import ColorParam, EnumParam, FloatParam, IntParam, RectParam
from ..registry import OperationSpec, registry


def _np(image: Image.Image) -> np.ndarray:
    return np.array(image.convert("RGB"))


def _pil(arr: np.ndarray) -> Image.Image:
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def detail_enhance(image, sigma_s=10.0, sigma_r=0.15):
    return _pil(cv2.detailEnhance(_np(image), sigma_s=float(sigma_s), sigma_r=float(sigma_r)))


def stylization(image, sigma_s=60.0, sigma_r=0.45):
    return _pil(cv2.stylization(_np(image), sigma_s=float(sigma_s), sigma_r=float(sigma_r)))


def edge_preserving(image, flavor="1", sigma_s=60.0, sigma_r=0.4):
    return _pil(
        cv2.edgePreservingFilter(
            _np(image), flags=int(flavor), sigma_s=float(sigma_s), sigma_r=float(sigma_r)
        )
    )


def color_sketch(image):
    _, color = cv2.pencilSketch(_np(image), sigma_s=60, sigma_r=0.07, shade_factor=0.05)
    return _pil(color)


def tv_denoise(image, weight=0.1):
    arr = _np(image).astype(np.float32) / 255.0
    den = restoration.denoise_tv_chambolle(arr, weight=float(weight), channel_axis=-1)
    return _pil(den * 255)


def skeletonize(image):
    gray = cv2.cvtColor(_np(image), cv2.COLOR_RGB2GRAY)
    binary = gray > skfilters.threshold_otsu(gray)
    skel = morphology.skeletonize(binary)
    return _pil(cv2.cvtColor((skel * 255).astype(np.uint8), cv2.COLOR_GRAY2RGB))


def salt_pepper(image, amount=0.05):
    arr = _np(image).copy()
    a = float(amount)
    rnd = np.random.random(arr.shape[:2])
    arr[rnd < a / 2] = 0
    arr[rnd > 1 - a / 2] = 255
    return _pil(arr)


def temperature(image, amount=0):
    arr = _np(image).astype(np.int32)
    a = int(amount)
    arr[..., 0] += a  # warmer -> more red
    arr[..., 2] -= a  # ... less blue
    return _pil(arr)


def threshold_triangle(image):
    gray = cv2.cvtColor(_np(image), cv2.COLOR_RGB2GRAY)
    t = skfilters.threshold_triangle(gray)
    binary = (gray > t).astype(np.uint8) * 255
    return _pil(cv2.cvtColor(binary, cv2.COLOR_GRAY2RGB))


def sato_ridges(image):
    gray = cv2.cvtColor(_np(image), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
    ridges = skfilters.sato(gray, black_ridges=False)
    ridges = ridges / (ridges.max() or 1.0) * 255.0
    return _pil(cv2.cvtColor(ridges.astype(np.uint8), cv2.COLOR_GRAY2RGB))


def inpaint_region(image, roi=None):
    if roi is None:
        return image
    arr = _np(image)
    x, y, w, h = (int(v) for v in roi)
    mask = np.zeros(arr.shape[:2], np.uint8)
    mask[y : y + h, x : x + w] = 255
    out = cv2.inpaint(arr, mask, 3, cv2.INPAINT_TELEA)
    return _pil(out)


def duotone(image, shadow=(26, 26, 78), highlight=(255, 210, 127)):
    gray = (cv2.cvtColor(_np(image), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0)[..., None]
    lo = np.array(shadow, dtype=np.float32)
    hi = np.array(highlight, dtype=np.float32)
    return _pil(lo * (1 - gray) + hi * gray)


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

    def _ss(d=60.0):
        return FloatParam(
            name="sigma_s", label="Spatial sigma", default=d, min=0.0, max=200.0, step=1.0
        )

    def _sr(d=0.4):
        return FloatParam(
            name="sigma_r", label="Range sigma", default=d, min=0.0, max=1.0, step=0.01
        )

    op(
        "detail_enhance",
        "Detail Enhance",
        "Basic",
        "Adjustments",
        "Enhance fine detail (edge-aware).",
        detail_enhance,
        [_ss(10.0), _sr(0.15)],
    )
    op(
        "stylization",
        "Stylization",
        "Basic",
        "Stylize",
        "Watercolor-like stylization.",
        stylization,
        [_ss(60.0), _sr(0.45)],
    )
    op(
        "edge_preserving",
        "Edge-Preserving Smooth",
        "OpenCV",
        "Filtering",
        "Edge-preserving smoothing.",
        edge_preserving,
        [
            EnumParam(
                name="flavor",
                label="Filter",
                default="1",
                options=[("1", "Recursive"), ("2", "Normalized conv")],
            ),
            _ss(60.0),
            _sr(0.4),
        ],
    )
    op(
        "color_sketch",
        "Color Sketch",
        "Basic",
        "Stylize",
        "Colored pencil-sketch stylization.",
        color_sketch,
    )
    op(
        "tv_denoise",
        "TV Denoise",
        "Scikit-Image",
        "Restoration",
        "Total-variation denoising.",
        tv_denoise,
        [FloatParam(name="weight", label="Weight", default=0.1, min=0.01, max=0.5, step=0.01)],
    )
    op(
        "skeletonize",
        "Skeletonize",
        "Scikit-Image",
        "Morphology",
        "Morphological skeleton of the thresholded image.",
        skeletonize,
    )
    op(
        "salt_pepper",
        "Salt & Pepper Noise",
        "Basic",
        "Effects",
        "Add impulse (salt & pepper) noise.",
        salt_pepper,
        [FloatParam(name="amount", label="Amount", default=0.05, min=0.0, max=0.2, step=0.01)],
    )
    op(
        "temperature",
        "Temperature",
        "Basic",
        "Adjustments",
        "Warm/cool color temperature shift.",
        temperature,
        [IntParam(name="amount", label="Warmth", default=0, min=-100, max=100)],
    )
    op(
        "threshold_triangle",
        "Threshold Triangle",
        "Scikit-Image",
        "Segmentation",
        "Triangle-method automatic threshold.",
        threshold_triangle,
    )
    op(
        "sato_ridges",
        "Sato Ridges",
        "Scikit-Image",
        "Filters",
        "Sato tubeness / ridge filter (vessel-like structures).",
        sato_ridges,
    )
    op(
        "inpaint_region",
        "Inpaint Region",
        "OpenCV",
        "Restoration",
        "Remove a drawn region by inpainting from its surroundings.",
        inpaint_region,
        [RectParam(name="roi", label="Region", help="Drag a rectangle to remove/fill")],
    )
    op(
        "duotone",
        "Duotone",
        "Basic",
        "Stylize",
        "Map luminance between two colors.",
        duotone,
        [
            ColorParam(name="shadow", label="Shadows", default="#1a1a4e"),
            ColorParam(name="highlight", label="Highlights", default="#ffd27f"),
        ],
    )


register()
