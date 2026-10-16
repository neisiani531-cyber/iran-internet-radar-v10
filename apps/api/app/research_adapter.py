"""Read-only, fail-closed adapter for explicitly published research metadata.

Never reads the private research repository or turns research values into official KPIs.
"""
import json
from pathlib import Path

CONTRACTS = Path(__file__).resolve().parents[3] / "packages" / "contracts"

def _read(name: str):
    return json.loads((CONTRACTS / name).read_text(encoding="utf-8"))

def research_snapshot(dossier: str | None = None):
    evidence = _read("evidence-metadata-public.json")
    preview = _read("p01-survey-research-preview.json")
    if evidence.get("officially_approved") != 0:
        raise ValueError("Research evidence approval status unexpectedly changed")
    entries = evidence["observations"]
    if any(row.get("official_dashboard_approved") is not False or row.get("public_numeric_value") is not None for row in entries):
        raise ValueError("An unapproved evidence record carries an official numeric value")
    by_id = {row["evidence_id"]: row for row in entries}
    if len(by_id) != len(entries):
        raise ValueError("Duplicate evidence identifier")
    if preview.get("publication_status") != "RESEARCH_PREVIEW_NOT_Q5":
        raise ValueError("Preview admission status changed")
    preview_rows = []
    for item in preview["observations"]:
        key = item["evidence_id"]
        if key not in by_id or by_id[key]["dossier_id"] != "P01":
            raise ValueError("Unlinked preview figure")
        if item.get("official_dashboard_approved") is not False or item.get("quality_gate") != "Q5_PENDING":
            raise ValueError("Preview figure promoted without review")
        if item.get("publication_status") != "RESEARCH_PREVIEW_NOT_Q5":
            raise ValueError("Unexpected preview figure publication status")
        preview_rows.append(item)
    filtered = [row for row in entries if dossier is None or row["dossier_id"] == dossier]
    return {
        "status": "RESEARCH_METADATA_ONLY_NOT_Q5",
        "officially_approved": 0,
        "count": len(filtered),
        "entries": filtered,
        "preview_figures": preview_rows if dossier is None or dossier == "P01" else [],
        "blocked_numeric_kpis": True,
        "note": "Research-only survey observations are not official, causal, or nationally approved KPIs.",
    }

def historical_research_snapshot(dossier: str | None = None):
    """Return approved-for-preview historical derivatives; never official KPIs."""
    data = _read("historical-research-preview.json")
    if data.get("publication_status") != "RESEARCH_PREVIEW_NOT_Q5":
        raise ValueError("Unexpected historical publication status")
    rows = data["observations"]
    if len(rows) != 20 or len({x["observation_id"] for x in rows}) != 20:
        raise ValueError("Historical registry count/unique identifiers changed")
    blocked = [x for x in rows if x["dossier_id"] == "E01"]
    research = [x for x in rows if x["dossier_id"] != "E01"]
    if len(blocked) != 6 or len(research) != 14:
        raise ValueError("Historical research/quarantine parity failed")
    for x in rows:
        if x.get("official_dashboard_approved") is not False or x.get("quality_gate") != "Q5_NOT_APPROVED":
            raise ValueError("Historical evidence was improperly promoted")
        if x["dossier_id"] == "E01":
            if x.get("numeric_value") is not None or x.get("source_id") is not None or x.get("display_status") != "BLOCKED_FINANCIAL_ORIGINAL_MISSING" or not x.get("missing_source_reason"):
                raise ValueError("Financial data quarantine violated")
        elif x.get("display_status") != "RESEARCH_PREVIEW_NOT_Q5" or not x.get("source_id"):
            raise ValueError("Ungated historical research row")
    filtered = [x for x in rows if dossier is None or x["dossier_id"] == dossier]
    return {"status": "RESEARCH_PREVIEW_NOT_Q5", "total": len(filtered),
            "summary": data["summary"], "observations": filtered,
            "officially_approved": 0, "blocked_financial": 6,
            "note": "Historical research preview. E01 numeric values redacted; never a national KPI."}

def public_research_relations():
    """Public-source projection: no private claim/conflict register is loaded."""
    graph = _read("research-public-relations.json")
    evidence = _read("evidence-metadata-public.json")
    if graph.get("officially_approved") != 0 or graph.get("scope") != "PUBLIC_ALREADY_ADMITTED_REFERENCES_ONLY":
        raise ValueError("Public graph publication gate violated")
    if graph.get("conflict_content_status") != "NOT_PUBLISHED_PENDING_EXPLICIT_ADMISSION":
        raise ValueError("Private conflicts cannot be published")
    rows = evidence["observations"]
    ids = {x["evidence_id"] for x in rows}
    if len(ids) != len(rows):
        raise ValueError("Duplicate evidence IDs")
    source_pairs = {(x["source_id"], x["evidence_id"]) for x in rows}
    actual_pairs = {(x["source_id"], x["evidence_id"]) for x in graph["source_evidence_links"]}
    claim_pairs = {(claim, x["evidence_id"]) for x in rows for claim in x.get("linked_claim_ids", [])}
    actual_claim_pairs = {(x["claim_id"], x["evidence_id"]) for x in graph["claim_evidence_links"]}
    if source_pairs != actual_pairs or claim_pairs != actual_claim_pairs:
        raise ValueError("Graph relationships diverge from admitted public evidence metadata")
    if set(graph["claim_ids"]) != {pair[0] for pair in claim_pairs}:
        raise ValueError("Claim registry mismatch")
    return {"status": graph["publication_status"], "officially_approved": 0,
            "evidence_count": len(rows), "source_links": graph["source_evidence_links"],
            "claim_links": graph["claim_evidence_links"], "claim_ids": graph["claim_ids"],
            "conflicts": [], "conflict_content_status": graph["conflict_content_status"]}
