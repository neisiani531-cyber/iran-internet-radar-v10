import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "var/social-intelligence/bluesky.sqlite3"
OUT = ROOT / "var/social-intelligence/public-export/social-topics.json"
VERSION = "fa-topics-v1.1"

if not DB.exists():
    raise SystemExit("STOP: database missing")

db = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)

total_posts = db.execute(
    "SELECT COUNT(*) FROM posts"
).fetchone()[0]

classified = db.execute("""
    SELECT COUNT(DISTINCT post_hash)
    FROM topic_classifications
    WHERE classifier_version=?
""", (VERSION,)).fetchone()[0]

rows = db.execute("""
    SELECT topic, status, COUNT(DISTINCT post_hash)
    FROM topic_classifications
    WHERE classifier_version=?
    GROUP BY topic, status
""", (VERSION,)).fetchall()

topics = {
    name: {"MATCHED": 0, "AMBIGUOUS": 0}
    for name in ("OUTAGE", "QUALITY", "PRICE", "ACCESS", "SECURITY")
}

unclassified = 0

for topic, status, count in rows:
    if topic == "OTHER":
        unclassified += count
    elif topic in topics and status in topics[topic]:
        topics[topic][status] = count

result = {
    "schema_version": "1.0.0",
    "source": "BLUESKY_PUBLIC_SEARCH",
    "query": "اینترنت",
    "classifier_version": VERSION,
    "generated_at_utc": datetime.now(timezone.utc).isoformat(),
    "total_unique_posts": total_posts,
    "classified_unique_posts": classified,
    "unclassified_posts": unclassified,
    "topics": [
        {"topic": topic, **counts}
        for topic, counts in topics.items()
    ],
    "national_representativeness": False,
    "validated_accuracy": False,
    "interpretation": "RULE_BASED_TOPIC_MENTIONS",
    "limitations": [
        "Topic matches do not establish factual events.",
        "Multiple topics may apply to the same post.",
        "Classification accuracy has not been independently evaluated.",
        "Historical posts lacking original text may remain unclassified.",
        "The sample is not representative of Iran."
    ]
}

assert classified <= total_posts

OUT.parent.mkdir(parents=True, exist_ok=True)
tmp = OUT.with_suffix(".tmp")
tmp.write_text(
    json.dumps(result, ensure_ascii=False, indent=2),
    encoding="utf-8"
)
tmp.replace(OUT)

print("SOCIAL TOPICS EXPORTED")
print("TOTAL POSTS:", total_posts)
print("CLASSIFIED:", classified)
print("UNCLASSIFIED:", unclassified)
print("TOPICS:", topics)
print("OUTPUT:", OUT)

db.close()
