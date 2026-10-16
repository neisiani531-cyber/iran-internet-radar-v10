from app.public_retrieval import retrieve
import pytest

def test_specific_mechanism_returns_linked_evidence():
    response=retrieve("M01 کیفیت تجربه سرعت اینترنت")
    assert any(x["mechanism_id"]=="M01" for x in response["draft_actions"])
    assert any(x["evidence_id"]=="EV-P01-002" for x in response["evidence"])
    assert response["pdf_page_citations_available"] is False
    assert response["q5_approved"]==0
    assert all(x["public_numeric_value"] is None for x in response["evidence"])

def test_unknown_question_does_not_invent_citations():
    data=retrieve("پرسش کاملاً نامرتبط جغرافیای مریخ")
    assert data["evidence"]==[]
    assert data["draft_actions"]==[]

def test_private_conflict_contents_not_in_retrieval():
    data=retrieve("M02")
    assert "C-004" not in str(data)
    assert data["retrieval_scope"]=="PUBLIC_METADATA_AND_DRAFT_ACTIONS_ONLY"

def test_fail_closed_on_forged_approval(monkeypatch):
    import app.public_retrieval as retrieval
    original=retrieval.read
    def altered(name):
        document=original(name)
        if name=="s01-s02-decision-bridge.json":
            document["no_policy_approval"]=False
        return document
    monkeypatch.setattr(retrieval,"read",altered)
    with pytest.raises(ValueError):
        retrieval.retrieve("M01")
