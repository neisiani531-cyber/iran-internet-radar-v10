"""Research adapter safety and publication gates."""
from fastapi.testclient import TestClient
from app.main import app
from app.research_adapter import research_snapshot
import pytest

client = TestClient(app)

def test_metadata_remains_research_only():
    response = client.get("/api/v1/research-snapshot")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "RESEARCH_METADATA_ONLY_NOT_Q5"
    assert body["officially_approved"] == 0
    assert body["blocked_numeric_kpis"] is True
    assert body["count"] == 22
    assert all(x["public_numeric_value"] is None and x["official_dashboard_approved"] is False for x in body["entries"])

def test_preview_is_explicitly_non_q5():
    body = research_snapshot("P01")
    assert len(body["preview_figures"]) == 4
    assert all(x["quality_gate"] == "Q5_PENDING" and x["official_dashboard_approved"] is False for x in body["preview_figures"])

def test_dossier_filter_no_preview_leak():
    body = client.get("/api/v1/research-snapshot", params={"dossier": "T05"}).json()
    assert body["count"] > 0
    assert all(x["dossier_id"] == "T05" for x in body["entries"])
    assert body["preview_figures"] == []

def test_quarantine_financial_no_numeric_kpi():
    body = research_snapshot("E01")
    assert body["blocked_numeric_kpis"] is True
    assert body["preview_figures"] == []
    assert all(x.get("public_numeric_value") is None for x in body["entries"])

def test_fail_closed_when_metadata_promoted(monkeypatch):
    import app.research_adapter as adapter
    original = adapter._read
    def altered(name):
        data = original(name)
        if name == "evidence-metadata-public.json":
            data["officially_approved"] = 1
        return data
    monkeypatch.setattr(adapter, "_read", altered)
    with pytest.raises(ValueError):
        adapter.research_snapshot()

def test_fail_closed_when_preview_mislinked(monkeypatch):
    import app.research_adapter as adapter
    original = adapter._read
    def altered(name):
        data = original(name)
        if name == "p01-survey-research-preview.json":
            data["observations"][0]["evidence_id"] = "FAKE-EVIDENCE"
        return data
    monkeypatch.setattr(adapter, "_read", altered)
    with pytest.raises(ValueError):
        adapter.research_snapshot()
