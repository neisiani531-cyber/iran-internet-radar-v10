import hashlib
import json
import re
import sqlite3
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
import importlib.util

_classifier_path = Path(__file__).with_name("social-topic-classifier.py")
_spec = importlib.util.spec_from_file_location("social_topic_classifier", _classifier_path)

_claim_path = Path(__file__).with_name("social-claim-analyzer.py")
_claim_spec = importlib.util.spec_from_file_location(
    "social_claim_analyzer", _claim_path
)
_claim_analyzer = importlib.util.module_from_spec(_claim_spec)
_claim_spec.loader.exec_module(_claim_analyzer)

_classifier = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_classifier)


ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / 'var/social-intelligence/bluesky.sqlite3'
QUERY = 'اینترنت'
ENDPOINT = 'https://api.bsky.app/xrpc/app.bsky.feed.searchPosts'

def utcnow():
    return datetime.now(timezone.utc).isoformat()

def connect():
    DB.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DB)
    db.execute('PRAGMA journal_mode=WAL')
    db.execute('''CREATE TABLE IF NOT EXISTS posts (
        post_hash TEXT PRIMARY KEY,
        published_at TEXT,
        first_seen_at TEXT NOT NULL,
        hashtags_json TEXT NOT NULL,
        keywords_json TEXT NOT NULL
    )''')
    db.execute('''CREATE TABLE IF NOT EXISTS runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fetched_at TEXT NOT NULL,
        status TEXT NOT NULL,
        returned_count INTEGER NOT NULL,
        new_count INTEGER NOT NULL,
        error TEXT
    )''')
    return db

def extract(text):
    text = text.replace('ي', 'ی').replace('ك', 'ک')
    tags = sorted(set(
        tag.casefold() for tag in re.findall(r'#[\w\u200c]+', text)
    ))
    clean = re.sub(r'https?://\S+|@\S+|#[\w\u200c]+', ' ', text)
    stop = {'اینترنت','برای','است','این','اون','که','های',
            'یک','در','از','به','با','را','هم','شما','شد'}
    words = [
        w for w in re.findall(r'[\u0600-\u06FF\u200c]{3,}', clean)
        if w not in stop
    ]
    return tags, sorted(set(words))

def main():
    db = connect()
    timestamp = utcnow()
    returned = new = 0
    status = 'ok'
    error = None

    try:
        url = ENDPOINT + '?' + urllib.parse.urlencode({
            'q': QUERY, 'limit': 100, 'sort': 'latest'
        })
        req = urllib.request.Request(url, headers={
            'Accept': 'application/json',
            'User-Agent': 'IranInternetRadar/10 ResearchCollector'
        })
        with urllib.request.urlopen(req, timeout=25) as response:
            payload = json.load(response)

        posts = payload.get('posts', [])
        if not isinstance(posts, list):
            raise ValueError('Invalid posts response')
        returned = len(posts)

        with db:
            for item in posts:
                uri = item.get('uri')
                if not isinstance(uri, str) or not uri:
                    continue
                record = item.get('record') or {}
                tags, words = extract(record.get('text') or '')
                post_hash = hashlib.sha256(uri.encode()).hexdigest()
                cursor = db.execute(
                    '''INSERT OR IGNORE INTO posts
                       VALUES (?, ?, ?, ?, ?)''',
                    (post_hash, record.get('createdAt'), timestamp,
                     json.dumps(tags, ensure_ascii=False),
                     json.dumps(words, ensure_ascii=False))
                )
                new += cursor.rowcount

                claim = _claim_analyzer.analyze(
                    record.get('text') or ''
                )
                db.execute(
                    """INSERT OR IGNORE INTO claim_classifications
                       (post_hash, analyzer_version, claim_status,
                        evidence_rule, analyzed_at)
                       VALUES (?, ?, ?, ?, ?)""",
                    (
                        post_hash,
                        _claim_analyzer.VERSION,
                        claim['status'],
                        claim['rule'],
                        timestamp
                    )
                )


                for topic_result in _classifier.classify(
                    record.get('text') or ''
                ):
                    db.execute(
                        """INSERT OR IGNORE INTO topic_classifications
                           (post_hash, classifier_version, topic,
                            status, evidence_rule, classified_at)
                           VALUES (?, ?, ?, ?, ?, ?)""",
                        (
                            post_hash,
                            _classifier.VERSION,
                            topic_result['topic'],
                            topic_result['status'],
                            topic_result['evidence_rule'],
                            timestamp
                        )
                    )


    except Exception as exc:
        status = 'error'
        error = str(exc)[:300]

    with db:
        db.execute(
            '''INSERT INTO runs
               (fetched_at,status,returned_count,new_count,error)
               VALUES (?,?,?,?,?)''',
            (timestamp,status,returned,new,error)
        )

    print(json.dumps({
        'status':status,
        'returned':returned,
        'new':new,
        'fetched_at':timestamp,
        'error':error
    }, ensure_ascii=False))
    db.close()
    if status != 'ok':
        raise SystemExit(1)

if __name__ == '__main__':
    main()
