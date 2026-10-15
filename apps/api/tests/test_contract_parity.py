"""Contract parity tests: the API must expose the same values as the published snapshot."""
import json
from pathlib import Path

from fastapi.testclient import TestClient
from app.main import app

ROOT = Path(__file__).resolve().parents[3]
SNAPSHOT = json.loads((ROOT / "packages/contracts/public-fixed-access.snapshot.json").read_text(encoding="utf-8"))
client = TestClient(app)


def test_all_technologies_match_snapshot():
    for technology in ("FTTx", "XDSL", "TDLTE", "WiFi"):
        result = client.get("/api/v1/fixed-access", params={"technology": technology})
        assert result.status_code == 200
        actual = result.json()
        expected = SNAPSHOT["observations"]
        assert len(actual) == len(expected)
        for observation, row in zip(actual, expected):
            assert observation["period"] == row["period"]
            assert observation["value"] == row["technology_values"][technology]
            assert observation["source_id"] == SNAPSHOT["source"]["source_id"]


def test_every_period_total_matches_snapshot():
    for row in SNAPSHOT["observations"]:
        response = client.get(f"/api/v1/fixed-access/{row['period']}")
        assert response.status_code == 200
        body = response.json()
        assert body["total"] == row["reported_total"]
        assert body["technology_values"] == row["technology_values"]


def test_metadata_periods_match_snapshot():
    response = client.get("/api/v1/metadata")
    assert response.status_code == 200
    assert response.json()["periods"] == [r["period"] for r in SNAPSHOT["observations"]]
