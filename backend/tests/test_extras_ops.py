"""Behavior tests for the Phase 5 op batch + the two fixed ops."""

import numpy as np
from PIL import Image

from app.processing.executor import execute_step
from app.processing.registry import registry


def _gradient(w=80, h=60):
    arr = np.tile(np.linspace(0, 255, w, dtype="uint8"), (h, 1))
    return Image.fromarray(np.stack([arr, np.roll(arr, 10, axis=1), 255 - arr], axis=-1), "RGB")


def test_extras_registered():
    for op_id in [
        "threshold_binary",
        "pixelate",
        "emboss",
        "motion_blur",
        "hue_rotate",
        "color_tint",
        "gaussian_noise",
        "pencil_sketch",
        "prewitt_edges",
        "cartoon",
    ]:
        assert registry.resolve(op_id) is not None, op_id


def test_threshold_binary_is_two_valued_and_invert_flips():
    img = _gradient()
    out, err = execute_step(
        img, {"name": "threshold_binary", "params": {"threshold": 128, "invert": False}}
    )
    assert err is None
    vals = set(np.unique(np.array(out)))
    assert vals <= {0, 255}  # binary

    inv, err2 = execute_step(
        img, {"name": "threshold_binary", "params": {"threshold": 128, "invert": True}}
    )
    assert err2 is None
    # inverted result is the complement of the non-inverted one
    assert np.array_equal(255 - np.array(out), np.array(inv))


def test_hue_rotate_changes_colors():
    img = _gradient()
    out, err = execute_step(img, {"name": "hue_rotate", "params": {"degrees": 120}})
    assert err is None
    assert not np.array_equal(np.array(out), np.array(img))


def test_color_tint_blends_toward_color():
    img = Image.new("RGB", (20, 20), (0, 0, 0))
    out, err = execute_step(
        img, {"name": "color_tint", "params": {"color": "#ffffff", "strength": 0.5}}
    )
    assert err is None
    # black blended 50% toward white -> mid grey
    assert tuple(np.array(out)[0, 0]) == (128, 128, 128) or tuple(np.array(out)[0, 0]) == (
        127,
        127,
        127,
    )


def test_fixed_ops_execute_and_transform():
    arr = np.zeros((80, 80, 3), dtype="uint8")
    import cv2

    cv2.circle(arr, (25, 25), 14, (210, 210, 210), -1)
    cv2.circle(arr, (55, 55), 14, (210, 210, 210), -1)
    img = Image.fromarray(arr, "RGB")
    for op_id, params in [("watershed", {}), ("denoise_wavelet", {"sigma": 0.1})]:
        out, err = execute_step(img, {"name": op_id, "params": params})
        assert err is None, (op_id, err)
        assert not np.array_equal(np.array(out), arr), op_id
