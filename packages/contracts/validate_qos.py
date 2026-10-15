import json
from pathlib import Path
d = json.loads((Path(__file__).parent / "qos-metric-catalog.json").read_text(encoding="utf-8"))
assert d["publication_status"] == "SOURCE_REVIEW_REQUIRED"
assert len(d["metrics"]) == 4
for m in d["metrics"]:
    assert m["values"] == []
    assert m["value_status"] == "PENDING_SOURCE_PAGE"
    assert m["unit"] in {"ms", "percent"}
print("PASS: QoS catalogue is staged without unverified numeric observations")
