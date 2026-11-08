"""Install the packaged HTML as a preview only; never alter services or index."""
import argparse
import hashlib
import re
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('--site', default='/home/ubuntu/services/radar-v42')
a = p.parse_args()
site = Path(a.site)
source = Path(__file__).with_name('Radar-v4.9.12-complete.html')
expected = Path(__file__).with_name('HTML.sha256').read_text().split()[0]
assert hashlib.sha256(source.read_bytes()).hexdigest() == expected, 'HTML checksum mismatch'
current = (site / 'index.html').read_text()
out = site / 'v4912-complete-preview.html'
if out.exists():
    raise SystemExit('STOP: preview already exists; choose another preview path in a reviewed copy.')
text = source.read_text()
for marker in ('RADAR_SIGNAL_CONTEXT_V1', 'RADAR_SIGNAL_COMPACT_V2'):
    blocks = [b for b in re.findall(r'<script\b[^>]*>.*?</script>', current, re.S | re.I) if marker in b]
    if len(blocks) != 1:
        raise SystemExit('STOP: expected one deployed signal script: ' + marker)
    if marker in text:
        raise SystemExit('STOP: signal script already embedded: ' + marker)
    text = text.replace('</body>', blocks[0] + '\n</body>', 1)
with out.open('x') as f:
    f.write(text)
print('PREVIEW:', out.name)
print('SHA256:', hashlib.sha256(out.read_bytes()).hexdigest())
print('index.html, API, collectors, database, Caddy and NetBird unchanged.')
