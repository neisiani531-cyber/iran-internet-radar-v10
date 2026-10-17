import json
import sqlite3
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / 'var/social-intelligence/bluesky.sqlite3'
OUT = ROOT / 'var/social-intelligence/public-export/social-summary.json'

if not DB.exists():
    raise SystemExit('Database not found')

db = sqlite3.connect(f'file:{DB}?mode=ro', uri=True)

posts = db.execute('''
    SELECT first_seen_at, hashtags_json, keywords_json
    FROM posts
''').fetchall()

runs = db.execute('''
    SELECT fetched_at, status, returned_count, new_count
    FROM runs ORDER BY id DESC LIMIT 24
''').fetchall()

hashtags = Counter()
keywords = Counter()

for _, tags, words in posts:
    hashtags.update(json.loads(tags))
    keywords.update(json.loads(words))

summary = {
    'schema_version': '1.0.0',
    'source': 'BLUESKY_PUBLIC_SEARCH',
    'query': 'اینترنت',
    'generated_at_utc': datetime.now(timezone.utc).isoformat(),
    'total_unique_posts': len(posts),
    'collection_runs': len(runs),
    'source_health': (
        runs[0][1] if runs else 'not_collected'
    ),
    'latest_collection_at': runs[0][0] if runs else None,
    'hashtags': [
        {'name': name, 'post_count': count}
        for name, count in hashtags.most_common(20)
    ],
    'keywords': [
        {'name': name, 'post_count': count}
        for name, count in keywords.most_common(20)
    ],
    'recent_runs': [
        {
            'fetched_at': date,
            'status': status,
            'returned_count': returned,
            'new_count': new
        }
        for date, status, returned, new in runs
    ],
    'methodology': {
        'sampling': 'Latest search results, periodic sampling',
        'representative_of_iran': False,
        'trending_validated': False,
        'sentiment_validated': False,
        'count_unit': 'unique_posts_containing_term',
        'note': 'Results are search observations, not national indicators.'
    }
}


latest_success_row = db.execute(
    "SELECT fetched_at FROM runs WHERE status='ok' ORDER BY id DESC LIMIT 1"
).fetchone()
summary['latest_successful_collection_at'] = (
    latest_success_row[0] if latest_success_row else None
)
summary['freshness_basis'] = 'LAST_SUCCESSFUL_COLLECTION'
summary['trend_validated'] = False

OUT.parent.mkdir(parents=True, exist_ok=True)
temporary = OUT.with_suffix('.tmp')
temporary.write_text(
    json.dumps(summary, ensure_ascii=False, indent=2),
    encoding='utf-8'
)
temporary.replace(OUT)

print('SOCIAL SUMMARY EXPORTED')
print('POSTS:', summary['total_unique_posts'])
print('RUNS:', summary['collection_runs'])
print('HEALTH:', summary['source_health'])
print('OUTPUT:', OUT)

db.close()
