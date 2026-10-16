import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]/"packages"/"contracts"

def test_cra57_mobile_history_periods_and_source():
    data=json.loads((ROOT/"cra57-mobile-broadband-history.json").read_text(encoding="utf-8"))
    assert data["page"]==25
    assert data["metric"]=="active_mobile_broadband_subscriptions_by_operator"
    assert len(data["periods"])==24
    assert len(data["values"])==24
    assert len(set(data["periods"]))==24
    assert data["periods"][0]=="1399-Q2"
    assert data["periods"][-1]=="1405-Q1"
    assert data["operators"]==["ایرانسل","رایتل","همراه اول"]
    assert data["values"][0]==[35457551,3252879,37820749]
    assert data["values"][-1]==[52380910,4698187,70582958]
    assert all(len(x)==3 and all(isinstance(v,int) and v>=0 for v in x) for x in data["values"])
