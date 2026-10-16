from fastapi.testclient import TestClient
from app.main import app
import app.assistant_api as assistant_api

client=TestClient(app)

def test_requires_secret(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY",raising=False)
    response=client.post("/api/v1/assistant/chat",json={"question":"این شاخص چیست؟","page":"command"})
    assert response.status_code==503
    assert "not configured" in response.json()["detail"]

def test_model_receives_page_and_public_evidence_not_secret(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY","test-placeholder")
    captured={}
    def fake_model(messages):
        captured["messages"]=messages
        return "پاسخ آزمون با ذکر محدودیت منبع."
    monkeypatch.setattr(assistant_api,"call_model",fake_model)
    response=client.post("/api/v1/assistant/chat",json={"question":"منبع این عدد چیست؟","page":"research"})
    assert response.status_code==200
    assert response.json()["q5_approved"]==0
    assert "EV-P01-002" in captured["messages"][1]["content"]
    assert "research" in captured["messages"][1]["content"]
    assert all("test-placeholder" not in m["content"] for m in captured["messages"])

def test_rejects_long_questions():
    response=client.post("/api/v1/assistant/chat",json={"question":"x"*1801,"page":"command"})
    assert response.status_code==422
