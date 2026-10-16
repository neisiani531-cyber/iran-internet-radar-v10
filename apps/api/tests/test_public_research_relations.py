from app.research_adapter import public_research_relations
import pytest

def test_public_graph_referential_integrity():
    data = public_research_relations()
    assert data["officially_approved"] == 0
    assert data["evidence_count"] == 22
    assert len(data["source_links"]) == 22
    assert len(data["claim_links"]) == 4
    assert len(data["claim_ids"]) == 3
    assert data["conflicts"] == []

def test_public_graph_rejects_tampered_edges(monkeypatch):
    import app.research_adapter as adapter
    original = adapter._read
    def changed(name):
        document = original(name)
        if name == "research-public-relations.json":
            document["claim_evidence_links"][0]["evidence_id"] = "NOT-REGISTERED"
        return document
    monkeypatch.setattr(adapter, "_read", changed)
    with pytest.raises(ValueError):
        adapter.public_research_relations()
