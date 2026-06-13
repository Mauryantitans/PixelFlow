"""Tests for the typed parameter specs (validation + coercion)."""

import pytest

from app.processing.param_specs import (
    AngleParam,
    BoolParam,
    ColorParam,
    EnumParam,
    FloatParam,
    IntParam,
    OddKernelParam,
    ParamError,
    PointParam,
    RectParam,
)


def test_int_param_coerces_and_clamps():
    p = IntParam(name="amount", label="Amount", default=0, min=-100, max=100)
    assert p.coerce(50) == 50
    assert p.coerce("50") == 50  # string -> int
    assert p.coerce(50.7) == 51  # float rounds
    assert p.coerce(999) == 100  # clamp high
    assert p.coerce(-999) == -100  # clamp low


def test_int_param_rejects_non_numeric():
    p = IntParam(name="amount", label="Amount", default=0, min=0, max=10)
    with pytest.raises(ParamError):
        p.coerce("abc")


def test_float_param_clamps():
    p = FloatParam(name="g", label="Gamma", default=1.0, min=0.1, max=3.0)
    assert p.coerce(5.0) == 3.0
    assert p.coerce("0.05") == pytest.approx(0.1)


def test_odd_kernel_snaps_to_odd():
    p = OddKernelParam(name="ksize", label="K", default=5, min=3, max=15)
    assert p.coerce(4) == 5
    assert p.coerce(5) == 5
    assert p.coerce(100) == 15  # clamp then already odd


def test_angle_wraps():
    p = AngleParam(name="a", label="Angle", default=0)
    assert p.coerce(270) == -90
    assert p.coerce(-270) == 90
    assert p.coerce(0) == 0


def test_enum_accepts_known_rejects_unknown():
    p = EnumParam(name="level", label="Level", default="Medium", options=["Low", "Medium", "High"])
    assert p.coerce("High") == "High"
    with pytest.raises(ParamError):
        p.coerce("Ultra")


def test_bool_param():
    p = BoolParam(name="b", label="B", default=False)
    assert p.coerce(True) is True
    assert p.coerce("true") is True
    assert p.coerce(0) is False


def test_color_param_to_rgb_tuple():
    p = ColorParam(name="c", label="Color", default="#000000")
    assert p.coerce("#ff8800") == (255, 136, 0)


def test_point_param_validates_normalized_and_maps_to_pixels():
    p = PointParam(name="seed", label="Seed")
    assert p.needs_image is True
    coerced = p.coerce({"x": 0.5, "y": 0.25})
    assert coerced == (0.5, 0.25)
    assert p.to_pixels(coerced, 100, 100) == (50, 25)
    with pytest.raises(ParamError):
        p.coerce({"x": 1.5, "y": 0.5})  # out of [0,1]


def test_rect_param_maps_to_pixels():
    p = RectParam(name="roi", label="ROI")
    coerced = p.coerce({"x": 0.0, "y": 0.0, "w": 0.5, "h": 0.5})
    assert p.to_pixels(coerced, 200, 100) == (0, 0, 100, 50)
