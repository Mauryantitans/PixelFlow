"""Behavior tests for op batch 2 (Phase 5)."""

import numpy as np
from PIL import Image

from app.processing.executor import execute_step
from app.processing.registry import registry


def _img(w=80, h=60):
    arr = np.tile(np.linspace(0, 255, w, dtype="uint8"), (h, 1))
    return Image.fromarray(np.stack([arr, np.roll(arr, 7, axis=1), 255 - arr], axis=-1), "RGB")


def test_batch2_registered():
    for op_id in [
        "detail_enhance",
        "stylization",
        "edge_preserving",
        "color_sketch",
        "tv_denoise",
        "skeletonize",
        "salt_pepper",
        "temperature",
        "threshold_triangle",
        "sato_ridges",
        "inpaint_region",
        "duotone",
    ]:
        assert registry.resolve(op_id) is not None, op_id


def test_inpaint_region_noop_without_roi_and_changes_with_roi():
    img = _img()
    out, err = execute_step(img, {"name": "inpaint_region", "params": {}})
    assert err is None and np.array_equal(np.array(out), np.array(img))  # pending = no-op

    out2, err2 = execute_step(
        img, {"name": "inpaint_region", "params": {"roi": {"x": 0.3, "y": 0.3, "w": 0.4, "h": 0.4}}}
    )
    assert err2 is None
    assert not np.array_equal(np.array(out2), np.array(img))  # region was inpainted
    assert out2.size == img.size  # inpaint preserves dimensions


def test_duotone_maps_extremes_to_the_two_colors():
    # black -> shadow color, white -> highlight color
    img = Image.new("RGB", (4, 2))
    img.putpixel((0, 0), (0, 0, 0))
    img.putpixel((1, 0), (255, 255, 255))
    out, err = execute_step(
        img, {"name": "duotone", "params": {"shadow": "#000080", "highlight": "#ffffff"}}
    )
    assert err is None
    arr = np.array(out)
    assert tuple(arr[0, 0]) == (0, 0, 128)  # shadow
    assert tuple(arr[0, 1]) == (255, 255, 255)  # highlight


def test_temperature_warms_red_cools_blue():
    img = Image.new("RGB", (4, 4), (100, 100, 100))
    out, err = execute_step(img, {"name": "temperature", "params": {"amount": 40}})
    assert err is None
    r, g, b = np.array(out)[0, 0]
    assert r == 140 and g == 100 and b == 60
