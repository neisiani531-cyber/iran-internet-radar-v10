"""Small public-only evidence retrieval layer for the assistant.

No private repository, document PDF contents, or Q5 approval implied.
"""
import json
import re
from pathlib import Path

CONTRACTS = Path(__file__).resolve().parents[3] / "packages" / "contracts"

def read(name):
    return json.loads((CONTRACTS / name).read_text(encoding="utf-8"))

def retrieve(question, focus="", limit=6):
    evidence = read("evidence-metadata-public.json")
    bridge = read("s01-s02-decision-bridge.json")
    if evidence.get("officially_approved") != 0 or bridge.get("no_policy_approval") is not True or bridge.get("s02_source_status") != "NOT_STARTED":
        raise ValueError("Publication gate failed")
    rows = evidence["observations"]
    if any(x.get("official_dashboard_approved") is not False or x.get("public_numeric_value") is not None for x in rows):
        raise ValueError("Invalid evidence gate")
    known = {x["evidence_id"] for x in rows}
    for x in bridge["records"]:
        refs = ([x["user_evidence_id"]] if x["user_evidence_id"] else []) + x["technical_evidence_ids"]
        if not set(refs).issubset(known) or x["action_status"] != "DRAFT_FOR_REVIEW_NOT_APPROVED":
            raise ValueError("Invalid draft action")
    tokens = set(re.findall(r"[\w\u0600-\u06ff]{3,}", question + " " + focus))
    def score(x):
        searchable = x.lower()
        return sum(1 for token in tokens if token.lower() in searchable)
    evidence_rank = sorted(rows, key=lambda x: score(" ".join((x["description"],x["dossier_id"],x["evidence_id"],x["source_id"]))), reverse=True)
    action_rank = sorted(bridge["records"], key=lambda x: score(" ".join((x["title"],x["mechanism_id"],x["limitation"],x["proposed_action"]))), reverse=True)
    matched_evidence = [x for x in evidence_rank if score(x["description"]+" "+x["evidence_id"]+" "+x["dossier_id"])>0][:limit]
    matched_actions = [x for x in action_rank if score(x["title"]+" "+x["mechanism_id"]+" "+x["proposed_action"])>0][:3]
    selected_ids = {ref for action in matched_actions for ref in (([action["user_evidence_id"]] if action["user_evidence_id"] else [])+action["technical_evidence_ids"])}
    matched_evidence = list({x["evidence_id"]:x for x in ([row for row in rows if row["evidence_id"] in selected_ids] + matched_evidence)}.values())[:limit]
    return {
        "evidence": [{"evidence_id":x["evidence_id"],"source_id":x["source_id"],"title":x["description"],"verification_status":x["verification_status"],"public_numeric_value":None,"q5":"NOT_APPROVED"} for x in matched_evidence],
        "draft_actions": [{"mechanism_id":x["mechanism_id"],"title":x["title"],"linked_evidence":([x["user_evidence_id"]] if x["user_evidence_id"] else [])+x["technical_evidence_ids"],"limitation":x["limitation"],"action":x["proposed_action"],"decision_gate":x["decision_gate"],"status":x["action_status"]} for x in matched_actions],
        "retrieval_scope":"PUBLIC_METADATA_AND_DRAFT_ACTIONS_ONLY",
        "source_pdf_page_citations_available":False,
        "q5_approved":0
    }
