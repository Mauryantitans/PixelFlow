"""Tests for the incremental prefix-cache engine (Phase 4.5)."""

import numpy as np
from PIL import Image

from app.processing import preview_cache
from app.utils.image_processing import ImageProcessor


def _img():
    arr = np.tile(np.linspace(0, 255, 64, dtype="uint8"), (48, 1))
    return Image.fromarray(np.stack([arr, arr, arr], axis=-1), "RGB")


def _run(img, pipeline, source_key):
    return ImageProcessor.apply_pipeline_with_timing_from_image(
        img, pipeline, source_key=source_key
    )


def test_second_identical_run_is_fully_cached():
    preview_cache.cache.clear()
    img = _img()
    pipeline = [
        {"name": "Brightness", "params": {"amount": 20}},
        {"name": "Gaussian Blur", "params": {"radius": 3}},
        {"name": "Invert", "params": {}},
    ]
    r1 = _run(img, pipeline, "sess|img1")
    assert r1.cached_prefix_len == 0  # cold

    r2 = _run(img, pipeline, "sess|img1")
    assert r2.cached_prefix_len == 3  # every step reused


def test_editing_last_step_only_recomputes_tail():
    preview_cache.cache.clear()
    img = _img()
    base = [
        {"name": "Brightness", "params": {"amount": 20}},
        {"name": "Gaussian Blur", "params": {"radius": 3}},
        {"name": "Invert", "params": {}},
    ]
    _run(img, base, "sess|img1")  # warm the cache

    # change step 1 (Gaussian Blur radius) -> step 0 cached, steps 1..2 recompute
    edited = [base[0], {"name": "Gaussian Blur", "params": {"radius": 8}}, base[2]]
    r = _run(img, edited, "sess|img1")
    assert r.cached_prefix_len == 1  # only Brightness reused


def test_cached_result_matches_full_recompute():
    preview_cache.cache.clear()
    img = _img()
    pipeline = [
        {"name": "Brightness", "params": {"amount": 30}},
        {"name": "Contrast", "params": {"amount": 15}},
        {"name": "Invert", "params": {}},
    ]
    full = ImageProcessor.apply_pipeline_with_timing_from_image(img, pipeline)  # no cache
    _run(img, pipeline, "sess|imgX")  # warm
    cached = _run(img, pipeline, "sess|imgX")  # fully cached
    assert cached.cached_prefix_len == 3
    assert np.array_equal(np.array(full.final_image), np.array(cached.final_image))


def test_different_source_keys_do_not_collide():
    preview_cache.cache.clear()
    img = _img()
    pipeline = [{"name": "Invert", "params": {}}]
    _run(img, pipeline, "sess|imgA")
    r = _run(img, pipeline, "sess|imgB")  # different image → cold
    assert r.cached_prefix_len == 0
