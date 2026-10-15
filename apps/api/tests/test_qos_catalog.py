from fastapi.testclient import TestClient
from app.main import app
client=TestClient(app)

def test_qos_values_and_provenance():
    result=client.get("/api/v1/qos-catalog")
    assert result.status_code==200
    data=result.json()
    assert data["source"]["page"]==15
    assert len(data["metrics"])==2
    assert sum(len(m["values"]) for m in data["metrics"])==12
    assert data["pending_metrics"][0]["status"]=="NOT_IMPORTED"
    assert data["publication_status"]=="CRA57_EXTRACTED_SOURCE_PAGE_REVIEW"
