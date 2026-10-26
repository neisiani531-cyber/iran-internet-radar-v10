import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "var/social-intelligence/bluesky.sqlite3"
OUT = ROOT / "var/social-intelligence/public-export/social-timeline.json"

db = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)

rows = db.execute("""
    SELECT
      substr(first_seen_at, 1, 13) || ':00:00Z' AS hour,
      COUNT(*) AS new_posts
    FROM posts
    GROUP BY hour
    ORDER BY hour
""").fetchall()

runs = db.execute("""
    SELECT fetched_at, status, returned_count, new_count
    FROM runs
    ORDER BY id DESC
    LIMIT 48
""").fetchall()

result = {
    "schema_version": "1.0.0",
    "source": "BLUESKY_PUBLIC_SEARCH",
    "query": "اینترنت",
    "generated_at_utc": datetime.now(timezone.utc).isoformat(),
    "metric": "FIRST_OBSERVED_UNIQUE_POSTS",
    "hourly_observations": [
        {"hour": hour, "new_posts": count}
        for hour, count in rows
    ],
    "collection_runs": [
        {
            "fetched_at": timestamp,
            "status": status,
            "returned_count": returned,
            "new_count": new
        }
        for timestamp, status, returned, new in reversed(runs)
    ],
    "trend_validated": False,
    "national_representativeness": False,
    "limitations": [
        "First-observed time is not publication time.",
        "Collection coverage is incomplete between scheduled runs.",
        "Search result ranking and pagination may affect counts.",
        "Hourly observations are not validated platform-wide trends."
    ]
}

OUT.parent.mkdir(parents=True, exist_ok=True)

temporary = OUT.with_suffix(".tmp")
temporary.write_text(
    json.dumps(result, ensure_ascii=False, indent=2),
    encoding="utf-8"
)
temporary.replace(OUT)

print("SOCIAL TIMELINE EXPORTED")
print("HOURLY BUCKETS:", len(rows))
print("RECENT RUNS:", len(runs))
print("TREND VALIDATED:", result["trend_validated"])

db.close()
