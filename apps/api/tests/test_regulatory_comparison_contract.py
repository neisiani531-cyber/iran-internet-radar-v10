"""Contract guardrails for comparing quarterly operator indicators.

The source lists operators in different orders. Join by operator name, never
by a shared numeric index. The expansion snapshot is single-quarter only.
"""
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3] / "packages" / "contracts"


def _load(name):
    return json.loads((ROOT / name).read_text(encoding="utf-8"))


def test_operator_names_align_but_are_not_assumed_positional():
    history = _load("cra57-mobile-broadband-history.json")
    expanded = _load("cra57-operator-expanded.json")
    assert len(history["periods"]) == len(history["values"]) == 24
    assert len(history["operators"]) == len(set(history["operators"])) == 3
    assert len(expanded["operators"]) == len(set(expanded["operators"])) == 3
    assert set(history["operators"]) == set(expanded["operators"])
    assert history["operators"] != expanded["operators"]  # Reordering is intentional.
    assert all(len(row) == 3 for row in history["values"])
    assert all(len(metric["values"]) == 3 for metric in expanded["metrics"])


def test_expansion_has_single_matching_period_and_required_metrics():
    history = _load("cra57-mobile-broadband-history.json")
    expanded = _load("cra57-operator-expanded.json")
    assert expanded["period"] == "1405-Q1"
    assert expanded["period"] in history["periods"]
    keys = {metric["key"] for metric in expanded["metrics"]}
    assert {"active_4g_sites", "covered_cities_4g", "covered_villages"} <= keys
    assert len(keys) == len(expanded["metrics"])
    assert "VISUAL_QA_PENDING" in history["validation"]


def test_quality_is_aggregate_not_operator_specific():
    quality = _load("cra57-latency-quality.snapshot.json")
    assert quality["source"]["period"] == "1405-Q1"
    assert len(quality["observations"]) == 8
    assert all("operator" not in row for row in quality["observations"])
    assert all(row["metric"] in {"rtt", "jitter"} for row in quality["observations"])
