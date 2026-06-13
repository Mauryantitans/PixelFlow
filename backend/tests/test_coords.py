"""Tests for coordinate / kernel / color helpers."""

import pytest

from app.processing import coords


def test_ensure_odd_rounds_up_and_respects_minimum():
    assert coords.ensure_odd(4) == 5
    assert coords.ensure_odd(5) == 5
    assert coords.ensure_odd(0, minimum=3) == 3
    assert coords.ensure_odd(2, minimum=1) == 3


def test_clamp():
    assert coords.clamp(5, 0, 10) == 5
    assert coords.clamp(-1, 0, 10) == 0
    assert coords.clamp(99, 0, 10) == 10


@pytest.mark.parametrize(
    "value,expected",
    [
        ("#ff0000", (255, 0, 0)),
        ("#0f0", (0, 255, 0)),
        ([10, 20, 30], (10, 20, 30)),
        ((0, 0, 0, 255), (0, 0, 0)),
    ],
)
def test_parse_color(value, expected):
    assert coords.parse_color(value) == expected


@pytest.mark.parametrize("bad", ["#xyzxyz", "nothex", [1, 2], "12345"])
def test_parse_color_rejects_bad(bad):
    with pytest.raises(ValueError):
        coords.parse_color(bad)


def test_denormalize_point_and_clamp():
    assert coords.denormalize_point(0.0, 0.0, 100, 50) == (0, 0)
    assert coords.denormalize_point(1.0, 1.0, 100, 50) == (99, 49)
    # out-of-range normalized values are clamped
    assert coords.denormalize_point(2.0, -1.0, 100, 50) == (99, 0)


def test_denormalize_rect_stays_in_bounds():
    x, y, w, h = coords.denormalize_rect(0.5, 0.5, 0.9, 0.9, 100, 100)
    assert x + w <= 100
    assert y + h <= 100
    assert w >= 1 and h >= 1
