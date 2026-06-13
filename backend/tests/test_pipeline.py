"""End-to-end pipeline execution via ImageProcessor (registry-backed)."""

from PIL import Image

from app.utils.image_processing import ImageProcessor


def test_pipeline_runs_and_aligns_step_errors():
    img = Image.new("RGB", (40, 30), (90, 90, 90))
    pipeline = [
        {"name": "Grayscale", "params": {}},
        {"name": "Gaussian Blur", "params": {"radius": 2}},
        {"name": "Bogus Op", "params": {}},  # unknown -> passthrough + error
        {"name": "Brightness", "params": {"amount": 20}},
    ]
    result = ImageProcessor.apply_pipeline_with_timing_from_image(img, pipeline)

    assert result.final_image is not None
    assert len(result.step_details) == 4
    assert len(result.step_errors) == 4
    # only the 3rd step errored
    kinds = [e.kind if e else None for e in result.step_errors]
    assert kinds == [None, None, "unknown_operation", None]
    # total time recorded
    assert result.total_time >= 0


def test_bad_step_passes_image_through_unchanged():
    img = Image.new("RGB", (10, 10), (10, 20, 30))
    result = ImageProcessor.apply_pipeline_with_timing_from_image(
        img, [{"name": "Bogus", "params": {}}]
    )
    # the unknown step leaves pixels untouched
    assert list(result.final_image.getdata())[0] == (10, 20, 30)
