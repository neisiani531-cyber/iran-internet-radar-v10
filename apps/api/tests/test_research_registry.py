from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_registry_count_and_status():
    d = client.get("/api/v1/research-evidence").json()
    assert d["count"] == 17
    assert d["q5_accepted"] == 0
    assert d["publication_status"] == "RESEARCH_PREVIEW"
    assert all(r["allow_official_kpi"] is False for r in d["records"])

def test_filter():
    r = client.get("/api/v1/research-evidence", params={"study": "MELLAT_21921"})
    assert r.status_code == 200
    assert r.json()["count"] == 7

def test_detail():
    r = client.get("/api/v1/research-evidence/P01-X004")
    assert r.status_code == 200
    assert r.json()["record"]["gate"] == "NOT_FINAL_Q5"

def test_invalid_requests():
    assert client.get("/api/v1/research-evidence/P01-X999").status_code == 404
    assert client.get("/api/v1/research-evidence", params={"domain": "unknown"}).status_code == 422
