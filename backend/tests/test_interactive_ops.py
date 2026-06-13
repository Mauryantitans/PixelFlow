"""Tests for the interactive ops (point/rect/color params) end-to-end through
the executor, including normalized-coordinate → pixel materialization."""

import numpy as np
from PIL import Image

from app.processing.executor import execute_step
from app.processing.registry import registry


def _img(w=80, h=60, color=(10, 20, 30)):
    return Image.new("RGB", (w, h), color)


def test_interactive_ops_registered_with_correct_param_types():
    flood = registry.resolve("flood_fill")
    crop = registry.resolve("crop")
    assert flood.interactive is True and crop.interactive is True
    assert [p.kind for p in flood.params] == ["point", "color", "int"]
    assert [p.kind for p in crop.params] == ["rect"]


def test_flood_fill_with_seed_changes_pixels():
    img = _img(color=(10, 10, 10))  # uniform → flood fills the whole image
    out, err = execute_step(
        img,
        {
            "name": "flood_fill",
            "params": {"seed": {"x": 0.5, "y": 0.5}, "fill_color": "#ff0000", "tolerance": 30},
        },
    )
    assert err is None
    # the clicked region should now be red
    arr = np.array(out)
    assert tuple(arr[30, 40]) == (255, 0, 0)


def test_flood_fill_without_seed_is_pending_noop():
    img = _img()
    out, err = execute_step(img, {"name": "flood_fill", "params": {}})
    assert err is None  # unset seed is "pending", not an error
    assert np.array_equal(np.array(out), np.array(img))


def test_crop_rect_maps_to_pixels_and_resizes():
    img = _img(100, 100)
    out, err = execute_step(
        img, {"name": "crop", "params": {"roi": {"x": 0.0, "y": 0.0, "w": 0.5, "h": 0.25}}}
    )
    assert err is None
    assert out.size == (50, 25)  # normalized rect → pixels


def test_crop_without_roi_is_noop():
    img = _img(40, 40)
    out, err = execute_step(img, {"name": "crop", "params": {}})
    assert err is None
    assert out.size == (40, 40)
