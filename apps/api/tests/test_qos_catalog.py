from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_qos_catalog_no_unverified_values():
    result = client.get("/api/v1/qos-catalog")
    assert result.status_code == 200
    data = result.json()
    assert data["publication_status"] == "SOURCE_REVIEW_REQUIRED"
    assert len(data["metrics"]) == 4
    assert all(not metric["values"] for metric in data["metrics"])
    assert all(metric["value_status"] == "PENDING_SOURCE_PAGE" for metric in data["metrics"])
