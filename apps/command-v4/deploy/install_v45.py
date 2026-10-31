"""Install Radar v4.5 on the server: replaces the single-file dashboard and keeps a timestamped backup.

    sudo python3 install_v45.py                      # default target
    sudo python3 install_v45.py /path/to/index.html  # other target

v4.5 turns KPI numbers into visuals, adds the decision roadmap/readiness charts, fixes the v4.4 review
items and carries the assistant follow-up fix in source. Nothing else on the server is touched.
Optional (web hosting): add  header Content-Security-Policy "frame-ancestors 'none'"  in Caddy;
a <meta> CSP cannot carry frame-ancestors.
"""
import hashlib
import shutil
import sys
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
NEW = HERE / 'Radar_NII_Command_v4.5.html'
target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/home/ubuntu/services/radar-v42/index.html')
EXPECTED = '0e7d0a161e193f11c899ffaef4d5af73be08779ec4899ec4261ad38b65747db2'

data = NEW.read_bytes()
got = hashlib.sha256(data).hexdigest()
if got != EXPECTED:
    raise SystemExit(f'STOP: package file is corrupted (sha256 {got[:12]} != {EXPECTED[:12]})')
if not target.exists():
    raise SystemExit(f'STOP: {target} not found; pass the path of the served index.html')
old = target.read_text(encoding='utf-8', errors='replace')
if 'رادار فرماندهی شبکه ملی اطلاعات' not in old:
    raise SystemExit('STOP: target does not look like the radar dashboard; nothing changed')
backup_dir = target.parent.parent / (target.parent.name + '-backups')
backup_dir.mkdir(exist_ok=True)
backup = backup_dir / f'index-before-v4.5-{datetime.now():%Y%m%d-%H%M%S}.html'
shutil.copy2(target, backup)
tmp = target.with_suffix('.tmp')
tmp.write_bytes(data)
tmp.replace(target)
print('OK: installed Radar v4.5 ->', target)
print('    backup:', backup)
print('    sha256:', got)
print('    had floating NIN overlay before:', 'id="nin-panel"' in old)
