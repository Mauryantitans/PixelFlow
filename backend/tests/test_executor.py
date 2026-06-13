"""Tests for the step executor (validation, coercion, resilience, coord mapping)."""

from PIL import Image

from app.processing.executor import build_kwargs, execute_step
from app.processing.param_specs import PointParam, RectParam
from app.processing.registry import OperationSpec


def _img():
    return Image.new("RGB", (64, 48), (120, 120, 120))


def test_execute_known_op_succeeds():
    out, err = execute_step(_img(), {"name": "Brightness", "params": {"amount": 40}})
    assert err is None
    assert out.size == (64, 48)


def test_unknown_op_returns_passthrough_and_error():
    img = _img()
    out, err = execute_step(img, {"name": "Nope", "params": {}})
    assert out is img  # unchanged
    assert err is not None and err.kind == "unknown_operation"


def test_invalid_param_reports_structured_error():
    out, err = execute_step(_img(), {"name": "Sharpen", "params": {"level": "Ultra"}})
    assert err is not None and err.kind == "invalid_params"
    assert err.param_errors and err.param_errors[0].param == "level"


def test_missing_param_uses_default():
    # No 'amount' supplied -> default 0 -> op still runs.
    out, err = execute_step(_img(), {"name": "Brightness", "params": {}})
    assert err is None


def test_legacy_label_resolves():
    out, err = execute_step(_img(), {"name": "Gaussian Blur", "params": {"radius": 3}})
    assert err is None


def test_execution_error_is_caught(monkeypatch):
    from app.processing.registry import registry

    spec = registry.resolve("gaussian_blur")
    monkeypatch.setattr(spec, "fn", lambda image, **kw: (_ for _ in ()).throw(RuntimeError("boom")))
    img = _img()
    out, err = execute_step(img, {"name": "gaussian_blur", "params": {"radius": 2}})
    assert out is img
    assert err is not None and err.kind == "execution_error"


def test_build_kwargs_materializes_point_and_rect_to_pixels():
    captured = {}

    def fake(image, seed=None, roi=None):
        captured["seed"] = seed
        captured["roi"] = roi
        return image

    spec = OperationSpec(
        id="fake",
        label="Fake",
        category="Test",
        fn=fake,
        params=[PointParam(name="seed", label="Seed"), RectParam(name="roi", label="ROI")],
    )
    raw = {"seed": {"x": 0.5, "y": 0.5}, "roi": {"x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0}}
    kwargs, errors = build_kwargs(spec, raw, width=100, height=80)
    assert errors == []
    assert kwargs["seed"] == (50, 40)
    assert kwargs["roi"] == (0, 0, 100, 80)


def test_build_kwargs_skips_unset_interactive_param():
    spec = OperationSpec(
        id="fake2",
        label="Fake2",
        category="Test",
        fn=lambda image, **k: image,
        params=[PointParam(name="seed", label="Seed", default=None)],
    )
    kwargs, errors = build_kwargs(spec, {}, 10, 10)
    assert errors == []
    assert "seed" not in kwargs  # pending, not an error
