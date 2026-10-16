import json
from pathlib import Path

def test_expanded_operator_metrics():
    root=Path(__file__).resolve().parents[3]
    data=json.loads((root/"packages/contracts/cra57-operator-expanded.json").read_text(encoding="utf-8"))
    assert data["period"]=="1405-Q1"
    assert data["operators"]==["همراه اول","ایرانسل","رایتل"]
    assert len(data["metrics"])==7
    for item in data["metrics"]:
        assert item["page"] in (10,26)
        assert len(item["values"])==3
        assert all(isinstance(v,(int,float)) and v>=0 for v in item["values"])
    refs={x["key"]:x["values"] for x in data["metrics"]}
    assert refs["active_4g_sites"]==[27701,20274,4022]
    assert refs["covered_villages"]==[44918,19312,946]
    assert refs["m2m_subscriptions"]==[7410760,2931902,20050]
