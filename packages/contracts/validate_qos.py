import json
from pathlib import Path
d=json.loads((Path(__file__).parent/"qos-metric-catalog.json").read_text(encoding="utf-8"))
assert d["publication_status"] == "CRA57_EXTRACTED_SOURCE_PAGE_REVIEW"
assert d["period"] == "1405-Q1"
assert d["source"]["page"] == 15
metrics={m["id"]:m for m in d["metrics"]}
assert set(metrics) == {"access_success","drop_rate"}
for m in metrics.values():
    assert m["unit"] == "percent"
    assert m["value_status"] == "CRA57_PAGE15_EXTRACTED"
    assert len(m["values"]) == 6
    assert {r["generation"] for r in m["values"]} == {"3G","4G"}
    assert {r["operator_id"] for r in m["values"]} == {"mci","mtn","rightel"}
    assert all(0 <= r["value"] <= 100 for r in m["values"])
success=metrics["access_success"]["values"]
drop=metrics["drop_rate"]["values"]
assert [r["value"] for r in success] == [99.42,99.65,97.88,99.31,99.33,99.46]
assert [r["value"] for r in drop] == [0.31,0.23,0.42,0.22,0.55,0.16]
assert all(x["status"] == "NOT_IMPORTED" for x in d["pending_metrics"])
print("PASS: 12 page-15 QoS observations, metadata and pending page-14 metrics")
