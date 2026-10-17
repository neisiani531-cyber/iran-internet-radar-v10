"""Regression coverage for CRA57 route registration and response contract."""

from fastapi.testclient import TestClient

from app.main import app
from app.regulatory_history import router as regulatory_router


def test_regulatory_operator_route_is_registered_once():
    matches = [
        route
        for route in regulatory_router.routes
        if regulatory_router.prefix + getattr(route, "path", "") == "/api/v1/regulatory/operator-indicators"
        and "GET" in getattr(route, "methods", set())
    ]
    assert len(matches) == 1, "Duplicate GET operator-indicators route"


def test_regulatory_operator_indicators_contract():
    response = TestClient(app).get("/api/v1/regulatory/operator-indicators")
    assert response.status_code == 200
    payload = response.json()
    assert payload["dataset"] == "CRA57_OPERATOR_EXPANDED"
    assert payload["count"] == 21
    assert len(payload["observations"]) == 21
    assert "validation" in payload
    assert "limitations" in payload


def test_regulatory_operator_indicators_rejects_invalid_filter():
    response = TestClient(app).get(
        "/api/v1/regulatory/operator-indicators",
        params={"metric": "__nonexistent_metric__"},
    )
    assert response.status_code == 422
