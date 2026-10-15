from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_metadata_exposes_limitations():
    r = client.get("/api/v1/metadata")
    assert r.status_code == 200
    assert r.json()["periods"] == ["1404-Q1", "1404-Q2", "1404-Q3", "1404-Q4", "1405-Q1"]
    assert r.json()["research_q5_accepted"] == 0

def test_fttx_values_match_source():
    r = client.get("/api/v1/fixed-access", params={"technology": "FTTx"})
    assert r.status_code == 200
    assert [x["value"] for x in r.json()] == [691763, 806422, 937072, 1009494, 1037577]
    assert all(x["source_id"] == "CRA57_FIXED_ACCESS" for x in r.json())

def test_no_fabricated_quarters():
    assert client.get("/api/v1/fixed-access/1403-Q4").status_code == 404

def test_invalid_technology_is_rejected():
    assert client.get("/api/v1/fixed-access", params={"technology": "fictional"}).status_code == 422

def test_spring_1405_sum():
    data = client.get("/api/v1/fixed-access/1405-Q1").json()
    assert data["total"] == 10470912
    assert sum(data["technology_values"].values()) == data["total"]

def test_spring_1404_sum():
    assert client.get("/api/v1/fixed-access/1404-Q1").json()["total"] == 11269057
