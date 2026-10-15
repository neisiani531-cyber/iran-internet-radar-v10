"""No-third-party-dependency validation of the initial public fixed-access snapshot."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "public-fixed-access.snapshot.json"
TECHS = {"FTTx", "XDSL", "TDLTE", "WiFi"}
EXPECTED_PERIODS = {"1404-Q1", "1405-Q1"}
EXPECTED_TOTALS = {"1404-Q1": 11269057, "1405-Q1": 10470912}


def validate():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    assert data["dataset_id"] == "CRA57_FIXED_ACCESS"
    assert data["source"]["source_id"] == "CRA57_FIXED_ACCESS"
    assert data["source"]["publication_status"] == "OFFICIAL_SNAPSHOT"
    observations = data["observations"]
    assert len(observations) == 2, "Bootstrap has exactly two sourced periods"
    periods = [x["period"] for x in observations]
    assert len(periods) == len(set(periods))
    assert set(periods) == EXPECTED_PERIODS
    for row in observations:
        values = row["technology_values"]
        assert set(values) == TECHS
        assert all(type(v) is int and v >= 0 for v in values.values())
        assert sum(values.values()) == EXPECTED_TOTALS[row["period"]]
        assert row["reported_total"] == EXPECTED_TOTALS[row["period"]]
    assert data["limitations"]
    return True


if __name__ == "__main__":
    assert validate()
    print("PASS: fixed-access public snapshot totals, periods, schema and provenance")
