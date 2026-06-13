"""
Coordinate, kernel, and color helpers — the single home for converting the
schema's *logical* parameter values into the concrete values operation
callables expect.

Design decision: image-coordinate parameters (point / points / rect) are
expressed in NORMALIZED [0..1] space relative to the image the operation
receives. They are converted to pixels here, once, against the live image
size — so they survive preview downscaling and any upstream resize/rotation.
"""

from __future__ import annotations


def ensure_odd(value: int, *, minimum: int = 1) -> int:
    """Round up to the nearest odd integer >= minimum (kernel sizes must be odd)."""
    value = int(value)
    if value < minimum:
        value = minimum
    if value % 2 == 0:
        value += 1
    return value


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def parse_color(value) -> tuple[int, int, int]:
    """
    Parse a color into an (r, g, b) tuple of 0..255 ints.

    Accepts "#RRGGBB", "#RGB", or a 3/4-length list/tuple of ints.
    """
    if isinstance(value, (list, tuple)):
        if len(value) < 3:
            raise ValueError(f"color sequence needs 3 components, got {value!r}")
        r, g, b = (int(value[0]), int(value[1]), int(value[2]))
        return (_clamp_channel(r), _clamp_channel(g), _clamp_channel(b))

    if isinstance(value, str):
        s = value.strip().lstrip("#")
        if len(s) == 3:  # shorthand #RGB
            s = "".join(ch * 2 for ch in s)
        if len(s) != 6:
            raise ValueError(f"invalid hex color: {value!r}")
        try:
            r, g, b = int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16)
        except ValueError as exc:
            raise ValueError(f"invalid hex color: {value!r}") from exc
        return (r, g, b)

    raise ValueError(f"unsupported color value: {value!r}")


def _clamp_channel(v: int) -> int:
    return max(0, min(255, int(v)))


def denormalize_point(x: float, y: float, width: int, height: int) -> tuple[int, int]:
    """Convert a normalized (x, y) in [0..1] to clamped pixel coordinates."""
    px = int(round(clamp(float(x), 0.0, 1.0) * (width - 1)))
    py = int(round(clamp(float(y), 0.0, 1.0) * (height - 1)))
    return (px, py)


def denormalize_rect(
    x: float, y: float, w: float, h: float, width: int, height: int
) -> tuple[int, int, int, int]:
    """
    Convert a normalized rect {x, y, w, h} in [0..1] to a clamped pixel
    (x, y, w, h) that lies within the image bounds, with width/height >= 1.
    """
    px = int(round(clamp(float(x), 0.0, 1.0) * width))
    py = int(round(clamp(float(y), 0.0, 1.0) * height))
    pw = int(round(clamp(float(w), 0.0, 1.0) * width))
    ph = int(round(clamp(float(h), 0.0, 1.0) * height))

    # Keep the rect inside the image and non-degenerate.
    px = min(px, width - 1)
    py = min(py, height - 1)
    pw = max(1, min(pw, width - px))
    ph = max(1, min(ph, height - py))
    return (px, py, pw, ph)
