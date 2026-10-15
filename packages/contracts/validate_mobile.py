"""Validate the published mobile-operator snapshot without third-party dependencies."""
import json
from pathlib import Path
d=json.loads((Path(__file__).parent/"public-mobile-operators.snapshot.json").read_text(encoding="utf-8"))
assert d["dataset_id"]=="CRA57_MOBILE_OPERATOR_SNAPSHOT"
assert d["source"]["period"]=="1405-Q1"
expected={"active_5g_sites":("site",[1432,1171,18]),"population_4g_coverage":("percent",[99.46,94.52,58.94])}
assert set(x["id"] for x in d["metrics"])==set(expected)
for item in d["metrics"]:
    unit, vals=expected[item["id"]]
    assert item["unit"]==unit
    assert [v["value"] for v in item["values"]]==vals
    assert [v["operator"] for v in item["values"]]==["همراه اول","ایرانسل","رایتل"]
assert d["limitations"]
print("PASS: mobile snapshot metrics, units, operators and source period")
