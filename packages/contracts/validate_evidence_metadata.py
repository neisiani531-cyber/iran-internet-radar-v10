import json
from pathlib import Path
p=Path(__file__).parent/"evidence-metadata-public.json"
d=json.loads(p.read_text(encoding="utf-8"))
assert d["officially_approved"]==0
assert len(d["observations"])==22
assert len({r["evidence_id"] for r in d["observations"]})==22
assert all(r["public_numeric_value"] is None and r["official_dashboard_approved"] is False for r in d["observations"])
assert all(r["dossier_id"] and r["source_id"] for r in d["observations"])
print("PASS: 22 source-linked evidence records, no numeric Q5 promotion")
