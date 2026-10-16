"""Quality gate for S01 evidence to S02 draft decision bridge."""
import json
from pathlib import Path

CONTRACTS=Path(__file__).resolve().parents[3]/"packages"/"contracts"
def test_decision_bridge_has_six_distinct_mechanisms_and_valid_evidence():
    bridge=json.loads((CONTRACTS/"s01-s02-decision-bridge.json").read_text(encoding="utf-8"))
    public=json.loads((CONTRACTS/"evidence-metadata-public.json").read_text(encoding="utf-8"))
    known={x["evidence_id"] for x in public["observations"]}
    assert bridge["s02_source_status"]=="NOT_STARTED"
    assert bridge["no_policy_approval"] is True
    assert len(bridge["records"])==6
    assert {x["mechanism_id"] for x in bridge["records"]}=={"M01","M02","M03","M04","M05","M06"}
    for x in bridge["records"]:
        ids=([x["user_evidence_id"]] if x["user_evidence_id"] else [])+x["technical_evidence_ids"]
        assert set(ids).issubset(known),ids
        assert x["baseline_kpi"] is None and x["target_kpi"] is None
        assert x["budget"] is None and x["owner"]=="NOT_VALIDATED"
        assert x["approval_required"] is True
        assert x["action_status"]=="DRAFT_FOR_REVIEW_NOT_APPROVED"
        assert x["comparability_gate"]!="SAME_PERIOD_VERIFIED"
