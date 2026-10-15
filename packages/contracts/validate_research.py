"""Public catalog gate: disallow numeric research claims not scientifically admitted."""
import json
from pathlib import Path

catalog = json.loads((Path(__file__).parent / "research-catalog.json").read_text(encoding="utf-8"))
assert catalog["publication_status"] == "RESEARCH_PREVIEW"
assert catalog["q5_accepted"] == 0
assert {d["id"] for d in catalog["domains"]} == {"social", "experience", "economy"}
assert all(d["status"] == "RESEARCH_PREVIEW" for d in catalog["domains"])
assert all("value" not in d and "percent" not in d for d in catalog["domains"])
print("PASS: public research catalog contains no unapproved numeric KPIs")
