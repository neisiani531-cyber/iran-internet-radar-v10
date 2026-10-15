import json
from pathlib import Path

p = Path(__file__).parent / "p01-research-registry.json"
d = json.loads(p.read_text(encoding="utf-8"))
rows = d["records"]
assert len(rows) == 17
assert len({r["crosswalk_id"] for r in rows}) == 17
assert d["publication_status"] == "RESEARCH_PREVIEW"
assert d["q5_accepted"] == 0
for r in rows:
    assert r["allow_official_kpi"] is False
    assert r["value_for_official_kpi"] is None
    assert r["gate"] != "Q5_ACCEPTED"
    assert r["population_and_denominator"]
    assert r["interpretation_warning"]
print("PASS: 17 research crosswalk items, no numeric KPI promotion")
