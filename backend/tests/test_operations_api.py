"""Test for the schema-returning /processing/operations endpoint (Phase 2).

Calls the route handler directly rather than via Starlette's TestClient: the
pinned FastAPI 0.104 / Starlette 0.27 TestClient is incompatible with the
installed httpx 0.28. (Bumping FastAPI/Starlette for full HTTP-level API tests
is tracked for the dependency-hardening phase.)
"""

import asyncio
import json

from app.api.routes.processing_db import get_available_operations


def _call() -> dict:
    resp = asyncio.run(get_available_operations())
    return json.loads(resp.body)


def test_operations_returns_full_schema():
    body = _call()
    assert body["success"] is True
    assert body["version"] == "2"
    assert [c["name"] for c in body["categories"]] == ["Basic", "OpenCV", "Scikit-Image"]

    ops = {
        op["id"]: op
        for cat in body["categories"]
        for sub in cat["subcategories"]
        for op in sub["operations"]
    }
    assert "gaussian_blur" in ops
    radius = next(p for p in ops["gaussian_blur"]["params"] if p["name"] == "radius")
    assert radius["type"] == "int"
    assert {"min", "max", "default"} <= set(radius)


def test_operations_keeps_legacy_list_for_compat():
    body = _call()
    assert "Gaussian Blur" in body["operations"]
    assert "Flood Fill" in body["operations"]
    assert body["total_count"] == 55
    assert len(body["operations"]) == 55
