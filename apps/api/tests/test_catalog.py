from fastapi.testclient import TestClient
from app.main import app
client=TestClient(app)
def test_domain_catalog_is_not_numeric_kpi():
    response=client.get("/api/v1/research-domains")
    assert response.status_code==200
    data=response.json()
    assert data["q5_accepted"]==0
    assert len(data["domains"])==3
    assert data["publication_status"]=="RESEARCH_PREVIEW"
    assert all("value" not in d for d in data["domains"])
