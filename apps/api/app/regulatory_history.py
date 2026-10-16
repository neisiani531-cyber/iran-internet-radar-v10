"""CRA57 historical mobile broadband observations.

Read-only. No synthetic values. Visual QA status preserved.
"""
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(
    prefix="/api/v1/regulatory",
    tags=["regulatory-history"],
)

SOURCE_FILE = (
    Path(__file__).resolve().parents[3]
    / "packages/contracts/cra57-mobile-broadband-history.json"
)


def load_history():
    data = json.loads(SOURCE_FILE.read_text(encoding="utf-8"))

    periods = data["periods"]
    operators = data["operators"]
    values = data["values"]

    if len(periods) != 24 or len(set(periods)) != 24:
        raise ValueError("Unexpected historical period registry")

    if len(operators) != 3 or len(set(operators)) != 3:
        raise ValueError("Unexpected operator registry")

    if len(values) != len(periods):
        raise ValueError("Period/value mismatch")

    for row in values:
        if (
            not isinstance(row, list)
            or len(row) != len(operators)
            or any(
                not isinstance(v, int)
                or isinstance(v, bool)
                or v < 0
                for v in row
            )
        ):
            raise ValueError("Invalid historical observation")

    return data


@router.get("/mobile-broadband-history")
def mobile_broadband_history(
    operator: str | None = None,
    period: str | None = None,
):
    try:
        data = load_history()
    except (ValueError, KeyError, OSError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Historical data validation failed",
        ) from exc

    operators = data["operators"]

    if operator is not None and operator not in operators:
        raise HTTPException(status_code=422, detail="Unknown operator")

    if period is not None and period not in data["periods"]:
        raise HTTPException(status_code=422, detail="Unknown period")

    observations = []

    for p, row in zip(data["periods"], data["values"]):
        if period is not None and p != period:
            continue

        for op, value in zip(operators, row):
            if operator is not None and op != operator:
                continue

            observations.append({
                "period": p,
                "operator": op,
                "metric": data["metric"],
                "value": value,
                "unit": data["unit"],
            })

    return {
        "dataset": "CRA57_MOBILE_BROADBAND_HISTORY",
        "source": data["source"],
        "source_page": data["page"],
        "validation": data["validation"],
        "period_count": len(data["periods"]),
        "operators": operators,
        "count": len(observations),
        "observations": observations,
        "limitations": data["limitations"],
    }


EXPANDED_FILE = (
    Path(__file__).resolve().parents[3]
    / "packages/contracts/cra57-operator-expanded.json"
)


@router.get("/operator-indicators")
def operator_indicators(
    operator: str | None = None,
    metric: str | None = None,
):
    try:
        data = json.loads(EXPANDED_FILE.read_text(encoding="utf-8"))
        operators = data["operators"]
        metrics = data["metrics"]

        if len(operators) != 3 or len(metrics) != 7:
            raise ValueError("Unexpected operator indicator contract")

        if len(set(operators)) != 3:
            raise ValueError("Duplicate operator")

        keys = [item["key"] for item in metrics]
        if len(set(keys)) != 7:
            raise ValueError("Duplicate metric")

        for item in metrics:
            values = item["values"]
            if len(values) != len(operators):
                raise ValueError("Operator/value mismatch")
            if any(
                isinstance(v, bool)
                or not isinstance(v, (int, float))
                or v < 0
                for v in values
            ):
                raise ValueError("Invalid indicator value")

    except (ValueError, KeyError, OSError, TypeError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Operator indicator validation failed",
        ) from exc

    if operator is not None and operator not in operators:
        raise HTTPException(status_code=422, detail="Unknown operator")

    if metric is not None and metric not in keys:
        raise HTTPException(status_code=422, detail="Unknown metric")

    observations = [
        {
            "period": data["period"],
            "operator": op,
            "metric": item["key"],
            "label": item["label"],
            "value": value,
            "unit": item["unit"],
            "source_page": item["page"],
        }
        for item in metrics
        if metric is None or item["key"] == metric
        for op, value in zip(operators, item["values"])
        if operator is None or operator == op
    ]

    return {
        "dataset": "CRA57_OPERATOR_EXPANDED",
        "source": data["source"],
        "validation": data["validation"],
        "period": data["period"],
        "count": len(observations),
        "observations": observations,
        "limitations": data["limitations"],
    }


EXPANDED_FILE = (
    Path(__file__).resolve().parents[3]
    / "packages/contracts/cra57-operator-expanded.json"
)


@router.get("/operator-indicators")
def operator_indicators(
    operator: str | None = None,
    metric: str | None = None,
):
    try:
        data = json.loads(EXPANDED_FILE.read_text(encoding="utf-8"))
        operators = data["operators"]
        metrics = data["metrics"]

        if len(operators) != 3 or len(metrics) != 7:
            raise ValueError("Unexpected operator indicator contract")

        if len(set(operators)) != 3:
            raise ValueError("Duplicate operator")

        keys = [item["key"] for item in metrics]
        if len(set(keys)) != 7:
            raise ValueError("Duplicate metric")

        for item in metrics:
            values = item["values"]
            if len(values) != len(operators):
                raise ValueError("Operator/value mismatch")
            if any(
                isinstance(v, bool)
                or not isinstance(v, (int, float))
                or v < 0
                for v in values
            ):
                raise ValueError("Invalid indicator value")

    except (ValueError, KeyError, OSError, TypeError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Operator indicator validation failed",
        ) from exc

    if operator is not None and operator not in operators:
        raise HTTPException(status_code=422, detail="Unknown operator")

    if metric is not None and metric not in keys:
        raise HTTPException(status_code=422, detail="Unknown metric")

    observations = [
        {
            "period": data["period"],
            "operator": op,
            "metric": item["key"],
            "label": item["label"],
            "value": value,
            "unit": item["unit"],
            "source_page": item["page"],
        }
        for item in metrics
        if metric is None or item["key"] == metric
        for op, value in zip(operators, item["values"])
        if operator is None or operator == op
    ]

    return {
        "dataset": "CRA57_OPERATOR_EXPANDED",
        "source": data["source"],
        "validation": data["validation"],
        "period": data["period"],
        "count": len(observations),
        "observations": observations,
        "limitations": data["limitations"],
    }


QUALITY_FILE = (
    Path(__file__).resolve().parents[3]
    / "packages/contracts/cra57-latency-quality.snapshot.json"
)


@router.get("/network-quality")
def network_quality(
    metric: str | None = None,
    network: str | None = None,
    route: str | None = None,
):
    try:
        data = json.loads(QUALITY_FILE.read_text(encoding="utf-8"))
        rows = data["observations"]

        expected = {
            (m, n, r)
            for m in ("rtt", "jitter")
            for n in ("fixed", "mobile")
            for r in ("domestic", "international")
        }
        actual = {
            (x["metric"], x["network"], x["route"])
            for x in rows
        }

        if len(rows) != 8 or actual != expected:
            raise ValueError("Unexpected network quality matrix")

        for x in rows:
            v = x["value"]
            if isinstance(v, bool) or not isinstance(v, (int, float)) or v < 0:
                raise ValueError("Invalid network quality value")

    except (ValueError, KeyError, TypeError, OSError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Network quality contract validation failed",
        ) from exc

    for name, value, allowed in (
        ("metric", metric, {"rtt", "jitter"}),
        ("network", network, {"fixed", "mobile"}),
        ("route", route, {"domestic", "international"}),
    ):
        if value is not None and value not in allowed:
            raise HTTPException(status_code=422, detail=f"Unknown {name}")

    result = [
        {**x, "unit": data["unit"], "period": data["source"]["period"]}
        for x in rows
        if (metric is None or x["metric"] == metric)
        and (network is None or x["network"] == network)
        and (route is None or x["route"] == route)
    ]

    return {
        "dataset": "CRA57_NETWORK_QUALITY",
        "source": data["source"],
        "count": len(result),
        "observations": result,
        "limitations": data["limitations"],
        "operator_specific": False,
    }
