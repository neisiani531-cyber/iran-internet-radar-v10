"""Public, source-attributed snapshot API for Radar V10. No private research data."""
import json
import csv
import os
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from app import ris_live
from pydantic import BaseModel, Field

app = FastAPI(title="Iran Internet Radar V10 Public API", version="0.1.0")
assistant_frontend = os.environ.get("RADAR_ASSISTANT_FRONTEND_ORIGIN", "").strip()
allowed_origins = [origin for origin in [assistant_frontend, os.environ.get("RADAR_LIVE_FRONTEND_ORIGIN", "").strip()] if origin]
if allowed_origins:
    app.add_middleware(CORSMiddleware, allow_origins=list(set(allowed_origins)), allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


Technology = Literal["FTTx", "XDSL", "TDLTE", "WiFi"]
OFFICIAL_SOURCE = {
    "source_id": "CRA57_FIXED_ACCESS",
    "organization": "سازمان تنظیم مقررات و ارتباطات رادیویی",
    "publication": "گزارش فصلنامه ۵۷",
    "publication_status": "OFFICIAL_SNAPSHOT",
    "note": "Five consecutive quarterly observations from CRA57 page 22; cross-checked against archived PDF text.",
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
        "limitations": SNAPSHOT["limitations"],
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


MobileMetric = Literal["active_5g_sites", "population_4g_coverage"]
MOBILE_SNAPSHOT_PATH = Path(__file__).resolve().parents[3] / "packages" / "contracts" / "public-mobile-operators.snapshot.json"

@app.get("/api/v1/mobile-operators")
def mobile_operators(metric: MobileMetric = "active_5g_sites"):
    snapshot = json.loads(MOBILE_SNAPSHOT_PATH.read_text(encoding="utf-8"))
    item = next(m for m in snapshot["metrics"] if m["id"] == metric)
    return {"metric": item["id"], "unit": item["unit"], "values": item["values"], "period": snapshot["source"]["period"], "source": snapshot["source"], "limitations": snapshot["limitations"]}


@app.get('/api/v1/research-domains')
def research_domains():
    catalog_path = Path(__file__).resolve().parents[3] / 'packages' / 'contracts' / 'research-catalog.json'
    return json.loads(catalog_path.read_text(encoding='utf-8'))


P01_REGISTRY_PATH = Path(__file__).resolve().parents[3] / "packages" / "contracts" / "p01-research-registry.json"

def load_p01_registry():
    return json.loads(P01_REGISTRY_PATH.read_text(encoding="utf-8"))

@app.get("/api/v1/research-evidence")
def research_evidence(domain: str | None = None, study: str | None = None, q: str | None = None):
    registry = load_p01_registry()
    records = registry["records"]
    if domain is not None:
        if domain not in {"social", "experience", "economy"}:
            raise HTTPException(status_code=422, detail="Unknown research domain")
        records = [record for record in records if record["domain"] == domain]
    if study is not None:
        records = [record for record in records if record["study_family"] == study]
    if q is not None:
        needle = q.strip().casefold()
        records = [record for record in records if needle in (record["crosswalk_id"] + " " + record["exact_construct"] + " " + record["study_family"]).casefold()]
    return {
        "publication_status": registry["publication_status"],
        "q5_accepted": registry["q5_accepted"],
        "count": len(records),
        "records": records,
        "source": registry["source"],
        "limits": registry["limits"],
    }

@app.get("/api/v1/research-evidence/{crosswalk_id}")
def research_evidence_detail(crosswalk_id: str):
    registry = load_p01_registry()
    record = next((item for item in registry["records"] if item["crosswalk_id"] == crosswalk_id), None)
    if record is None:
        raise HTTPException(status_code=404, detail="Research entry not found")
    return {
        "record": record,
        "publication_status": registry["publication_status"],
        "q5_accepted": registry["q5_accepted"],
        "source": registry["source"],
        "limits": registry["limits"],
    }


@app.get("/api/v1/qos-catalog")
def qos_catalog():
    catalog_path = Path(__file__).resolve().parents[3] / "packages" / "contracts" / "qos-metric-catalog.json"
    return json.loads(catalog_path.read_text(encoding="utf-8"))


@app.get("/api/v1/source-admission")
def source_admission(family: str | None = None, rule: str | None = None):
    """Metadata only: exposes research admission semantics, never private evidence or automatic approvals."""
    matrix_path = Path(__file__).resolve().parents[3] / "packages" / "contracts" / "source-admission-matrix.csv"
    with matrix_path.open(encoding="utf-8-sig", newline="") as fp:
        rows = list(csv.DictReader(fp))
    if family is not None:
        rows = [row for row in rows if family.casefold() in row["source_family"].casefold()]
    if rule is not None:
        rows = [row for row in rows if row["admission_rule"] == rule]
    return {"status": "RESEARCH_ADMISSION_MATRIX", "count": len(rows), "entries": rows,
            "note": "A source lead or research review does not grant Q5 or public numeric KPI admission."}


@app.get("/api/v1/evidence-metadata")
def evidence_metadata(dossier: str | None = None):
    """Public metadata only: numerical research results remain gated."""
    path = Path(__file__).resolve().parents[3] / "packages" / "contracts" / "evidence-metadata-public.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    entries = data["observations"]
    if dossier is not None:
        entries = [entry for entry in entries if entry["dossier_id"] == dossier]
    return {"count": len(entries), "status": data["publication_status"],
            "officially_approved": data["officially_approved"], "entries": entries}


@app.get('/api/v1/research-snapshot')
def get_research_snapshot(dossier: str | None = None):
    from app.research_adapter import research_snapshot
    try:
        return research_snapshot(dossier)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail='Research admission validation failed') from exc

@app.get('/api/v1/historical-research')
def get_historical_research(dossier: str | None = None):
    from app.research_adapter import historical_research_snapshot
    try:
        return historical_research_snapshot(dossier)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail='Historical research admission validation failed') from exc

@app.get('/api/v1/research-relations')
def get_public_research_relations():
    from app.research_adapter import public_research_relations
    return public_research_relations()

from app.assistant_api import router as assistant_router
app.include_router(assistant_router)

app.include_router(ris_live.router)

@app.on_event('startup')
async def _start_ris():
    if os.getenv('RADAR_ENABLE_RIS_LIVE','0') == '1':
        ris_live.start()

@app.on_event('shutdown')
async def _stop_ris():
    await ris_live.stop()


from app.regulatory_history import router as regulatory_router
app.include_router(regulatory_router)


# Social Intelligence: aggregated public-search observations only.
@app.get("/api/v1/social/summary")
def social_intelligence_summary():
    from datetime import datetime, timezone
    from pathlib import Path
    import json
    from fastapi import HTTPException

    path = Path("/app/social-data/social-summary.json")

    if not path.is_file():
        raise HTTPException(
            status_code=503,
            detail="Social summary is not available"
        )

    try:
        data = json.loads(path.read_text(encoding="utf-8"))

        if (
            not isinstance(data, dict)
            or data.get("source") != "BLUESKY_PUBLIC_SEARCH"
            or not isinstance(data.get("total_unique_posts"), int)
            or not isinstance(data.get("methodology"), dict)
        ):
            raise ValueError("Invalid social summary schema")

        generated = datetime.fromisoformat(
            data["generated_at_utc"].replace("Z", "+00:00")
        )
        if generated.tzinfo is None:
            raise ValueError("Summary timestamp has no timezone")

        age = max(
            0,
            int((datetime.now(timezone.utc) - generated).total_seconds())
        )

        last_success = data.get("latest_successful_collection_at")
        if last_success:
            last_dt = datetime.fromisoformat(
                last_success.replace("Z", "+00:00")
            )
            if last_dt.tzinfo is None:
                raise ValueError("Invalid collection timestamp")
            success_age = max(
                0, int(
                    (datetime.now(timezone.utc) - last_dt).total_seconds()
                )
            )
        else:
            success_age = None

        latest_status = data.get("source_health")

        if success_age is None:
            freshness = "MISSING"
        elif success_age > 7200:
            freshness = "STALE"
        elif latest_status != "ok":
            freshness = "DEGRADED"
        else:
            freshness = "RECENT"

        data["freshness"] = freshness
        data["age_seconds"] = age
        data["last_success_age_seconds"] = success_age
        data["national_representativeness"] = False

        return data

    except (OSError, ValueError, KeyError, TypeError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Social summary is invalid or unavailable"
        ) from exc


@app.get("/api/v1/social/timeline")
def social_intelligence_timeline():
    from pathlib import Path
    import json
    from fastapi import HTTPException

    path = Path("/app/social-data/social-timeline.json")

    if not path.is_file():
        raise HTTPException(
            status_code=503,
            detail="Social timeline unavailable"
        )

    try:
        data = json.loads(path.read_text(encoding="utf-8"))

        if (
            data.get("source") != "BLUESKY_PUBLIC_SEARCH"
            or data.get("metric") != "FIRST_OBSERVED_UNIQUE_POSTS"
            or not isinstance(data.get("hourly_observations"), list)
            or not isinstance(data.get("collection_runs"), list)
            or data.get("trend_validated") is not False
            or data.get("national_representativeness") is not False
        ):
            raise ValueError("Invalid timeline")

        return data

    except (OSError, ValueError, TypeError, AttributeError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Invalid social timeline"
        ) from exc


@app.get("/api/v1/social/topics")
def social_intelligence_topics():
    from pathlib import Path
    import json
    from fastapi import HTTPException

    path = Path("/app/social-data/social-topics.json")

    if not path.is_file():
        raise HTTPException(
            status_code=503,
            detail="Social topics unavailable"
        )

    try:
        data = json.loads(path.read_text(encoding="utf-8"))

        if (
            not isinstance(data, dict)
            or data.get("source") != "BLUESKY_PUBLIC_SEARCH"
            or data.get("classifier_version") != "fa-topics-v1.1"
            or not isinstance(data.get("topics"), list)
            or len(data["topics"]) != 5
            or data.get("validated_accuracy") is not False
            or data.get("national_representativeness") is not False
        ):
            raise ValueError("Invalid social topics contract")

        return data

    except (OSError, ValueError, TypeError, AttributeError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Invalid social topics report"
        ) from exc


@app.get("/api/v1/social/claims")
def social_intelligence_claims():
    import json
    from pathlib import Path
    from fastapi import HTTPException

    path = Path("/app/social-data/social-claims.json")

    try:
        data = json.loads(path.read_text(encoding="utf-8"))

        if not isinstance(data, dict):
            raise ValueError("Invalid payload")

        if (
            data.get("source") != "BLUESKY_PUBLIC_SEARCH"
            or data.get("topic_classifier") != "fa-topics-v1.1"
            or data.get("claim_analyzer") != "fa-claims-v1.3"
            or data.get("validated_accuracy") is not False
            or data.get("event_confirmation") is not False
            or data.get("national_representativeness") is not False
            or not isinstance(data.get("topic_claim_matrix"), list)
            or not isinstance(data.get("claim_distribution"), list)
        ):
            raise ValueError("Invalid claims contract")

        total = data.get("total_unique_posts")
        analyzed = data.get("analyzed_unique_posts")
        missing = data.get("not_analyzed_posts")

        if (
            type(total) is not int
            or type(analyzed) is not int
            or type(missing) is not int
            or min(total, analyzed, missing) < 0
            or total != analyzed + missing
        ):
            raise ValueError("Invalid analysis coverage")

        return data

    except (OSError, ValueError, TypeError, KeyError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Social claims report unavailable or invalid"
        ) from exc
