import json
import sqlite3
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "var/social-intelligence/bluesky.sqlite3"
OUT = ROOT / "var/social-intelligence/public-export/social-claims.json"

db = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)

rows = db.execute("""
    SELECT t.topic, t.status, c.claim_status,
           COUNT(DISTINCT t.post_hash) AS n
    FROM topic_classifications t
    JOIN claim_classifications c ON t.post_hash=c.post_hash
    WHERE t.classifier_version='fa-topics-v1.1'
      AND c.analyzer_version='fa-claims-v1.3'
      AND t.topic!='OTHER'
    GROUP BY t.topic, t.status, c.claim_status
    ORDER BY t.topic, c.claim_status
""").fetchall()

counts = db.execute("""
    SELECT claim_status, COUNT(DISTINCT post_hash)
    FROM claim_classifications
    WHERE analyzer_version='fa-claims-v1.3'
    GROUP BY claim_status
""").fetchall()


total_posts = db.execute(
    "SELECT COUNT(*) FROM posts"
).fetchone()[0]

analyzed_posts = db.execute("""
    SELECT COUNT(DISTINCT post_hash)
    FROM claim_classifications
    WHERE analyzer_version='fa-claims-v1.3'
""").fetchone()[0]

assert 0 <= analyzed_posts <= total_posts

result = {
    "total_unique_posts": total_posts,
    "analyzed_unique_posts": analyzed_posts,
    "not_analyzed_posts": total_posts - analyzed_posts,

    "schema_version": "1.0.0",
    "source": "BLUESKY_PUBLIC_SEARCH",
    "generated_at_utc": datetime.now(timezone.utc).isoformat(),
    "topic_classifier": "fa-topics-v1.1",
    "claim_analyzer": "fa-claims-v1.3",
    "claim_distribution": [
        {"status": status, "posts": n} for status, n in counts
    ],
    "topic_claim_matrix": [
        {
            "topic": topic,
            "topic_match_status": match,
            "claim_status": claim,
            "posts": n
        }
        for topic, match, claim, n in rows
    ],
    "validated_accuracy": False,
    "national_representativeness": False,
    "event_confirmation": False,
    "interpretation": "EXPERIMENTAL_TOPIC_AND_CLAIM_LABELS"
}

OUT.parent.mkdir(parents=True, exist_ok=True)
tmp = OUT.with_suffix(".tmp")
tmp.write_text(
    json.dumps(result, ensure_ascii=False, indent=2),
    encoding="utf-8"
)
tmp.replace(OUT)

print("SOCIAL CLAIM MATRIX EXPORTED")
print("CLAIM STATUSES:", len(counts))
print("MATRIX CELLS:", len(rows))
print("OUTPUT:", OUT)
db.close()
