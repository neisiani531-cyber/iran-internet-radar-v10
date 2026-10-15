"""Public, source-attributed snapshot API for Radar V10. No private research data."""
import json
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Iran Internet Radar V10 Public API", version="0.1.0")

Technology = Literal["FTTx", "XDSL", "TDLTE", "WiFi"]
OFFICIAL_SOURCE = {
    "source_id": "CRA57_FIXED_ACCESS",
    "organization": "سازمان تنظیم مقررات و ارتباطات رادیویی",
    "publication": "گزارش فصلنامه ۵۷",
    "publication_status": "OFFICIAL_SNAPSHOT",
    "note": "Only two explicitly sourced spring observations are included in this bootstrap; intermediate quarters are not inferred.",
}
SNAPSHOT_PATH = Path(__file__).resolve().parents[3] / "packages" / "contracts" / "public-fixed-access.snapshot.json"
SNAPSHOT = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
VALUES = tuple(
    {"period": row["period"], "period_label": row["period_label"], **row["technology_values"]}
    for row in SNAPSHOT["observations"]
)



class Observation(BaseModel):
    period: str
    period_label: str
    technology: Technology
    value: int = Field(ge=0)
    unit: Literal["subscription"] = "subscription"
    source_id: str
    publication_status: str


@app.get("/health")
def health():
    return {"status": "ok", "service": "radar-v10-public-api"}


@app.get("/api/v1/metadata")
def metadata():
    return {
        "source": OFFICIAL_SOURCE,
        "periods": [r["period"] for r in VALUES],
        "technologies": ["FTTx", "XDSL", "TDLTE", "WiFi"],
        "research_q5_accepted": 0,
        "research_q5_asof": "2026-10-15",
        "limitations": ["No intermediate-quarter extrapolation", "No raw or restricted research material"],
    }


@app.get("/api/v1/fixed-access", response_model=list[Observation])
def fixed_access(technology: Technology = "FTTx"):
    return [
        Observation(
            period=r["period"],
            period_label=r["period_label"],
            technology=technology,
            value=r[technology],
            source_id=OFFICIAL_SOURCE["source_id"],
            publication_status=OFFICIAL_SOURCE["publication_status"],
        )
        for r in VALUES
    ]


@app.get("/api/v1/fixed-access/{period}")
def fixed_access_period(period: str):
    row = next((r for r in VALUES if r["period"] == period), None)
    if row is None:
        raise HTTPException(status_code=404, detail="This period is not available in the approved public snapshot")
    values = {t: row[t] for t in ("FTTx", "XDSL", "TDLTE", "WiFi")}
    return {
        "period": period,
        "period_label": row["period_label"],
        "technology_values": values,
        "total": sum(values.values()),
        "source": OFFICIAL_SOURCE,
    }
