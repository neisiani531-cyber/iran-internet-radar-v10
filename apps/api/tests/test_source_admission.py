from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_source_matrix_and_holds():
    r = client.get("/api/v1/source-admission")
    assert r.status_code == 200
    d = r.json()
    assert d["count"] == 19
    entries = {x["source_family"]: x for x in d["entries"]}
    assert entries["OPERATOR_FINANCIAL"]["admission_rule"] == "BLOCKED"
    assert entries["ISPA_1405"]["admission_rule"] == "HOLD_NUMERIC"
    assert entries["MELLAT_21921"]["admission_rule"] == "REVIEW_ONLY"

def test_filter_is_read_only():
    r = client.get("/api/v1/source-admission", params={"rule": "BLOCKED"})
    assert r.status_code == 200
    assert r.json()["count"] >= 1
    assert all(x["admission_rule"] == "BLOCKED" for x in r.json()["entries"])
