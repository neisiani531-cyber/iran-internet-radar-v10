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
