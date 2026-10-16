"""Historical derivative preserves parity, Q5 gates, and original-source quarantine."""
from fastapi.testclient import TestClient
from app.main import app
from app.research_adapter import historical_research_snapshot
import pytest

client = TestClient(app)

def test_historical_parity_and_quarantine():
    response = client.get("/api/v1/historical-research")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 20
    assert data["summary"] == {"total": 20, "research_preview": 14, "blocked_financial": 6}
    assert data["officially_approved"] == 0
    assert all(x["quality_gate"] == "Q5_NOT_APPROVED" for x in data["observations"])
    e01 = [x for x in data["observations"] if x["dossier_id"] == "E01"]
    assert len(e01) == 6
    assert all(x["numeric_value"] is None and x["source_id"] is None and x["missing_source_reason"] for x in e01)
    assert len([x for x in data["observations"] if x["dossier_id"] != "E01"]) == 14

def test_historical_filters():
    response = client.get("/api/v1/historical-research", params={"dossier": "E01"})
    data = response.json()
    assert response.status_code == 200
    assert data["total"] == 6
    assert all(x["numeric_value"] is None for x in data["observations"])

def test_fail_closed_on_financial_numeric_injection(monkeypatch):
    import app.research_adapter as adapter
    original = adapter._read
    def compromised(name):
        data = original(name)
        if name == "historical-research-preview.json":
            next(x for x in data["observations"] if x["dossier_id"] == "E01")["numeric_value"] = 123456
        return data
    monkeypatch.setattr(adapter, "_read", compromised)
    with pytest.raises(ValueError, match="quarantine"):
        adapter.historical_research_snapshot()

def test_fail_closed_on_fake_q5(monkeypatch):
    import app.research_adapter as adapter
    original = adapter._read
    def compromised(name):
        data = original(name)
        if name == "historical-research-preview.json":
            data["observations"][0]["quality_gate"] = "Q5_APPROVED"
        return data
    monkeypatch.setattr(adapter, "_read", compromised)
    with pytest.raises(ValueError, match="promoted"):
        adapter.historical_research_snapshot()
