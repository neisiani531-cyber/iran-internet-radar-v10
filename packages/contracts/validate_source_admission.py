import csv
from pathlib import Path

path = Path(__file__).parent / "source-admission-matrix.csv"
with path.open(encoding="utf-8-sig", newline="") as fp:
    rows = list(csv.DictReader(fp))
assert len(rows) == 19
assert len({x["source_family"] for x in rows}) == 19
required = {"source_family", "dossier_ids", "evidence_status", "dashboard_use", "ai_use", "admission_rule", "blocking_limit"}
assert required.issubset(rows[0].keys())
by_name = {x["source_family"]: x for x in rows}
assert by_name["OPERATOR_FINANCIAL"]["admission_rule"] == "BLOCKED"
assert by_name["ISPA_1405"]["admission_rule"] == "HOLD_NUMERIC"
assert by_name["LEAKED_DATA_CLAIMS"]["admission_rule"] == "EXCLUDE_RAW"
assert all(x["admission_rule"] != "Q5_ACCEPTED" for x in rows)
print("PASS: source admission matrix preserved without implicit scientific promotion")
