"""
Registers the built-in operations (the ones implemented on
``ImageProcessor``) into the central registry.

Each operation's stable ``id`` is the slug of its display label, and the legacy
display label is recorded as an alias so already-saved pipelines and the
current static-config frontend keep resolving. Operation *bodies* are untouched
— this module only declares metadata + parameter specs (ported from what used
to live in the frontend's ``types/index.ts``).
"""

from __future__ import annotations

from app.utils.image_processing import ImageProcessor as IP

from ..param_specs import (
    AngleParam,
    EnumParam,
    FloatParam,
    IntParam,
    OddKernelParam,
)
from ..registry import OperationSpec, registry, slugify


def _op(label, category, fn, subcategory=None, description="", params=None, aliases=None):
    registry.register(
        OperationSpec(
            id=slugify(label),
            label=label,
            category=category,
            subcategory=subcategory,
            description=description,
            fn=fn,
            params=params or [],
            aliases=[label] + (aliases or []),
        )
    )


_SHAPE = lambda: EnumParam(  # noqa: E731 - small inline factory
    name="shape",
    label="Kernel shape",
    default="Rectangle",
    options=["Rectangle", "Ellipse", "Cross"],
    help="Structuring-element shape",
)


def _morph(label, fn, description):
    _op(
        label,
        "OpenCV",
        fn,
        subcategory="Morphological Operations",
        description=description,
        params=[
            IntParam(
                name="kernel_size",
                label="Kernel size",
                default=5,
                min=3,
                max=15,
                help="Structuring-element size",
            ),
            _SHAPE(),
        ],
    )


def _sobel(label, fn, description):
    _op(
        label,
        "OpenCV",
        fn,
        subcategory="Edge Detection",
        description=description,
        params=[OddKernelParam(name="ksize", label="Kernel size", default=3, min=1, max=7)],
    )


# --------------------------------------------------------------------------
# Basic
# --------------------------------------------------------------------------
def _amount(label_text):
    return IntParam(name="amount", label=label_text, default=0, min=-100, max=100)


_op(
    "Brightness",
    "Basic",
    IP.apply_brightness,
    "Adjustments",
    "Adjust image brightness",
    [_amount("Brightness")],
)
_op(
    "Contrast",
    "Basic",
    IP.apply_contrast,
    "Adjustments",
    "Adjust image contrast",
    [_amount("Contrast")],
)
_op(
    "Saturation",
    "Basic",
    IP.apply_saturation,
    "Adjustments",
    "Adjust color saturation",
    [_amount("Saturation")],
)
_op(
    "Exposure",
    "Basic",
    IP.apply_exposure,
    "Adjustments",
    "Adjust image exposure",
    [_amount("Exposure")],
)

_op("Grayscale", "Basic", IP.apply_grayscale, "Filters", "Convert to grayscale")
_op("Sepia", "Basic", IP.apply_sepia, "Filters", "Apply sepia tone effect")
_op("Invert", "Basic", IP.apply_invert, "Filters", "Invert image colors")
_op("Solarize", "Basic", IP.apply_solarize, "Filters", "Apply solarization effect")
_op("Posterize", "Basic", IP.apply_posterize, "Filters", "Reduce number of colors")

_op(
    "Gaussian Blur",
    "Basic",
    IP.apply_gaussian_blur,
    "Blur & Sharpen",
    "Apply Gaussian blur effect",
    [IntParam(name="radius", label="Radius", default=5, min=0, max=50, help="Blur radius")],
)
_op(
    "Sharpen",
    "Basic",
    IP.apply_sharpen,
    "Blur & Sharpen",
    "Sharpen image details",
    [
        EnumParam(
            name="level",
            label="Level",
            default="Medium",
            options=["Low", "Medium", "High"],
            help="Sharpening intensity",
        )
    ],
)

_op(
    "Vignette",
    "Basic",
    IP.apply_vignette,
    "Effects",
    "Add vignette effect",
    [IntParam(name="strength", label="Strength", default=50, min=0, max=100)],
)
_op("Grain", "Basic", IP.apply_grain, "Effects", "Add film grain effect")

# --------------------------------------------------------------------------
# OpenCV — Filtering
# --------------------------------------------------------------------------
_op(
    "Bilateral Filter",
    "OpenCV",
    IP.apply_bilateral_filter,
    "Filtering",
    "Edge-preserving smoothing filter",
    [
        IntParam(
            name="d",
            label="Diameter",
            default=9,
            min=5,
            max=25,
            help="Diameter of pixel neighborhood",
        ),
        IntParam(name="sigmaColor", label="Sigma color", default=75, min=10, max=150),
        IntParam(name="sigmaSpace", label="Sigma space", default=75, min=10, max=150),
    ],
)
_op(
    "Median Filter",
    "OpenCV",
    IP.apply_median_filter,
    "Filtering",
    "Median filtering for noise reduction",
    [OddKernelParam(name="ksize", label="Kernel size", default=5, min=3, max=15)],
)
_op(
    "Box Filter",
    "OpenCV",
    IP.apply_box_filter,
    "Filtering",
    "Simple box blur filter",
    [OddKernelParam(name="ksize", label="Kernel size", default=5, min=3, max=15)],
)
_op(
    "Non-Local Means Denoising",
    "OpenCV",
    IP.apply_non_local_means_denoising,
    "Filtering",
    "Advanced noise reduction using non-local means",
    [
        IntParam(name="h", label="Filter strength", default=10, min=3, max=20),
        OddKernelParam(
            name="template_window_size", label="Template window", default=7, min=7, max=21
        ),
        OddKernelParam(
            name="search_window_size", label="Search window", default=21, min=15, max=35
        ),
    ],
)

# --------------------------------------------------------------------------
# OpenCV — Morphological
# --------------------------------------------------------------------------
_morph("Morphological Opening", IP.apply_morphological_opening, "Erosion followed by dilation")
_morph("Morphological Closing", IP.apply_morphological_closing, "Dilation followed by erosion")
_morph("Dilate", IP.apply_dilate, "Morphological dilation")
_morph("Erode", IP.apply_erode, "Morphological erosion")
_morph(
    "Morphological Gradient",
    IP.apply_morphological_gradient,
    "Difference between dilation and erosion",
)
_morph("Top Hat", IP.apply_top_hat, "Difference between original and opening")
_morph("Black Hat", IP.apply_black_hat, "Difference between closing and original")

# --------------------------------------------------------------------------
# OpenCV — Edge Detection
# --------------------------------------------------------------------------
_op(
    "Canny Edge Detection",
    "OpenCV",
    IP.apply_canny_edge_detection,
    "Edge Detection",
    "Canny edge detector",
    [
        IntParam(name="threshold1", label="Threshold 1", default=100, min=50, max=200),
        IntParam(name="threshold2", label="Threshold 2", default=200, min=100, max=300),
    ],
)
_sobel("Sobel X", IP.apply_sobel_x, "Sobel edge detection (X direction)")
_sobel("Sobel Y", IP.apply_sobel_y, "Sobel edge detection (Y direction)")
_sobel("Sobel Combined", IP.apply_sobel_combined, "Combined Sobel edge detection (magnitude)")
_sobel("Laplacian", IP.apply_laplacian, "Laplacian edge detection")
_op("Scharr X", "OpenCV", IP.apply_scharr_x, "Edge Detection", "Scharr edge detection (X)")
_op("Scharr Y", "OpenCV", IP.apply_scharr_y, "Edge Detection", "Scharr edge detection (Y)")

# --------------------------------------------------------------------------
# OpenCV — Color Space Conversions
# --------------------------------------------------------------------------
_op(
    "RGB to HSV",
    "OpenCV",
    IP.apply_rgb_to_hsv,
    "Color Space Conversions",
    "Convert RGB to HSV color space",
)
_op(
    "RGB to LAB",
    "OpenCV",
    IP.apply_rgb_to_lab,
    "Color Space Conversions",
    "Convert RGB to LAB color space",
)
_op(
    "RGB to YUV",
    "OpenCV",
    IP.apply_rgb_to_yuv,
    "Color Space Conversions",
    "Convert RGB to YUV color space",
)

# --------------------------------------------------------------------------
# OpenCV — Geometric Transformations
# --------------------------------------------------------------------------
_op(
    "Resize",
    "OpenCV",
    IP.apply_resize,
    "Geometric Transformations",
    "Resize by scale factor",
    [
        FloatParam(
            name="scale_factor", label="Scale factor", default=1.0, min=0.1, max=3.0, step=0.1
        )
    ],
)
_op(
    "Rotation",
    "OpenCV",
    IP.apply_rotation,
    "Geometric Transformations",
    "Rotate image",
    [AngleParam(name="angle", label="Angle", default=0, min=-180, max=180)],
)
_op(
    "Flip Horizontal",
    "OpenCV",
    IP.apply_flip_horizontal,
    "Geometric Transformations",
    "Flip image horizontally",
)
_op(
    "Flip Vertical",
    "OpenCV",
    IP.apply_flip_vertical,
    "Geometric Transformations",
    "Flip image vertically",
)

# --------------------------------------------------------------------------
# OpenCV — Feature Detection
# --------------------------------------------------------------------------
_op(
    "FAST Corner Detection",
    "OpenCV",
    IP.apply_fast_corner_detection,
    "Feature Detection",
    "FAST corner detection",
    [IntParam(name="threshold", label="Threshold", default=50, min=10, max=100)],
)
_op(
    "ORB Features",
    "OpenCV",
    IP.apply_orb_features,
    "Feature Detection",
    "ORB feature detection",
    [IntParam(name="n_features", label="Max features", default=500, min=50, max=1000)],
)

# --------------------------------------------------------------------------
# Scikit-Image — Enhancement
# --------------------------------------------------------------------------
_op(
    "Histogram Equalization",
    "Scikit-Image",
    IP.apply_histogram_equalization,
    "Enhancement",
    "Improve contrast using histogram equalization",
)
_op(
    "Adaptive Histogram Equalization",
    "Scikit-Image",
    IP.apply_adaptive_histogram_equalization,
    "Enhancement",
    "CLAHE",
    [IntParam(name="clip_limit", label="Clip limit", default=3, min=1, max=10)],
)
_op(
    "Gamma Correction",
    "Scikit-Image",
    IP.apply_gamma_correction,
    "Enhancement",
    "Apply gamma correction",
    [FloatParam(name="gamma", label="Gamma", default=1.0, min=0.1, max=3.0, step=0.1)],
)
_op(
    "Contrast Stretching",
    "Scikit-Image",
    IP.apply_contrast_stretching,
    "Enhancement",
    "Stretch contrast to full range",
    [EnumParam(name="in_range", label="Input range", default="image", options=["image", "dtype"])],
)
_op(
    "Adjust Log",
    "Scikit-Image",
    IP.apply_adjust_log,
    "Enhancement",
    "Apply logarithmic adjustment",
    [FloatParam(name="gain", label="Gain", default=1.0, min=0.1, max=3.0, step=0.1)],
)
_op(
    "Adjust Sigmoid",
    "Scikit-Image",
    IP.apply_adjust_sigmoid,
    "Enhancement",
    "Apply sigmoid correction",
    [
        FloatParam(name="cutoff", label="Cutoff", default=0.5, min=0.1, max=0.9, step=0.05),
        IntParam(name="gain", label="Gain", default=10, min=5, max=20),
    ],
)

# --------------------------------------------------------------------------
# Scikit-Image — Restoration
# --------------------------------------------------------------------------
_op(
    "Denoise Wavelet",
    "Scikit-Image",
    IP.apply_denoise_wavelet,
    "Restoration",
    "Wavelet denoising",
    [FloatParam(name="sigma", label="Sigma", default=0.1, min=0.01, max=0.3, step=0.01)],
)
_op(
    "Unsharp Mask",
    "Scikit-Image",
    IP.apply_unsharp_mask,
    "Restoration",
    "Sharpen using unsharp masking",
    [
        IntParam(name="radius", label="Radius", default=3, min=1, max=10),
        FloatParam(name="amount", label="Amount", default=1.0, min=0.5, max=3.0, step=0.1),
    ],
)

# --------------------------------------------------------------------------
# Scikit-Image — Segmentation
# --------------------------------------------------------------------------
_op(
    "Threshold Otsu",
    "Scikit-Image",
    IP.apply_threshold_otsu,
    "Segmentation",
    "Otsu's automatic thresholding",
)
_op(
    "Threshold Adaptive",
    "Scikit-Image",
    IP.apply_threshold_adaptive,
    "Segmentation",
    "Adaptive thresholding",
    [OddKernelParam(name="block_size", label="Block size", default=11, min=3, max=21)],
)
_op("Watershed", "Scikit-Image", IP.apply_watershed, "Segmentation", "Watershed segmentation")
_op(
    "SLIC Superpixels",
    "Scikit-Image",
    IP.apply_slic_superpixels,
    "Segmentation",
    "SLIC superpixels",
    [
        IntParam(name="n_segments", label="Segments", default=300, min=50, max=1000),
        IntParam(name="compactness", label="Compactness", default=10, min=1, max=50),
    ],
)

# --------------------------------------------------------------------------
# Scikit-Image — Feature Detection
# --------------------------------------------------------------------------
_op(
    "Harris Corner Detection",
    "Scikit-Image",
    IP.apply_harris_corner_detection,
    "Feature Detection",
    "Harris corner detector",
    [FloatParam(name="threshold", label="Threshold", default=0.1, min=0.01, max=0.3, step=0.01)],
)
