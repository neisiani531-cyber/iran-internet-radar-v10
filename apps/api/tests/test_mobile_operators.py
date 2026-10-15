from fastapi.testclient import TestClient
from app.main import app
client=TestClient(app)

def test_5g_counts():
    r=client.get("/api/v1/mobile-operators",params={"metric":"active_5g_sites"})
    assert r.status_code==200
    assert [v["value"] for v in r.json()["values"]]==[1432,1171,18]
    assert r.json()["unit"]=="site"

def test_coverage():
    r=client.get("/api/v1/mobile-operators",params={"metric":"population_4g_coverage"})
    assert r.status_code==200
    assert [v["value"] for v in r.json()["values"]]==[99.46,94.52,58.94]
    assert r.json()["unit"]=="percent"

def test_wrong_metric():
    assert client.get("/api/v1/mobile-operators",params={"metric":"made_up"}).status_code==422
