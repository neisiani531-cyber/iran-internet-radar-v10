import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]/"packages"/"contracts"

def test_cra57_latency_eight_source_values():
    data=json.loads((ROOT/"cra57-latency-quality.snapshot.json").read_text(encoding="utf-8"))
    assert data["source"]["printed_page"]==14
    assert data["source"]["period"]=="1405-Q1"
    assert data["unit"]=="ms"
    records=data["observations"]
    assert len(records)==8
    lookup={(r["metric"],r["network"],r["route"]):r["value"] for r in records}
    assert len(lookup)==8
    assert lookup["rtt","fixed","domestic"]==21.14
    assert lookup["rtt","mobile","international"]==104.1
    assert lookup["jitter","fixed","international"]==2.41
    assert lookup["jitter","mobile","international"]==13.57
    assert all(v>=0 for v in lookup.values())
