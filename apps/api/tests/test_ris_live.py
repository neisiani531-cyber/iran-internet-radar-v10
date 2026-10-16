from fastapi.testclient import TestClient
from app.main import app
from app import ris_live

def test_disabled_does_not_fabricate(monkeypatch):
    monkeypatch.delenv("RADAR_ENABLE_RIS_LIVE", raising=False)
    client=TestClient(app)
    s=client.get("/api/v1/live/status").json()
    assert s["mode"]=="DISABLED" and s["connected"] is False
    assert client.get("/api/v1/live/events").json()["data"]==[]

def test_parse_real_ris_announcement_and_withdrawal():
    ris_live.events.clear()
    msg={"type":"ris_message","data":{"type":"UPDATE","peer_asn":64500,"path":[64500,197207],
      "announcements":[{"next_hop":"192.0.2.1","prefixes":["203.0.113.0/24"]}],
      "withdrawals":["198.51.100.0/24"],"timestamp":1760000000}}
    assert ris_live.process_message(msg)==2
    assert [x["kind"] for x in ris_live.events]==["announcement","withdrawal"]
    assert ris_live.events[0]["origin_asn"]==197207
    assert ris_live.events[1]["origin_asn"] is None
    ris_live.events.clear()

def test_nonmatching_paths_and_other_messages_ignored():
    ris_live.events.clear()
    assert ris_live.process_message({"type":"ris_message","data":{"type":"UPDATE","path":[64496],
        "announcements":[{"prefixes":["203.0.113.0/24"]}]}})==0
    assert ris_live.process_message({"type":"ris_subscribe_ok","data":{}})==0
    assert len(ris_live.events)==0
