"""Install Radar v4.7 on the server.

    sudo python3 install_v47.py                                   # dashboard only (default target)
    sudo python3 install_v47.py --html /path/to/index.html        # dashboard at another path
    python3 install_v47.py --repo ~/services/iran-internet-radar-v10   # also update the API code from the bundle

Dashboard: replaces the single HTML file and keeps a timestamped backup (as in v4.4/v4.5).
API (only with --repo): the online monitoring in v4.7 lives in apps/api (detector, incidents, alerts, attacks collector,
cyber register). The script imports radar-v4.7.bundle into that git checkout on a new branch radar-v4.7 without
touching the current branch, refuses if the working tree has uncommitted changes, runs the API tests, and prints
the restart step. It does not restart services: the service name/manager on the server is not known to this package.
"""
import hashlib
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
NEW = HERE / 'Radar_NII_Command_v4.7.html'
BUNDLE = HERE / 'radar-v4.7.bundle'
EXPECTED = '__SHA__'
args = sys.argv[1:]
target = Path(args[args.index('--html') + 1]) if '--html' in args else Path('/home/ubuntu/services/radar-v42/index.html')
repo = Path(args[args.index('--repo') + 1]).expanduser() if '--repo' in args else None

data = NEW.read_bytes()
got = hashlib.sha256(data).hexdigest()
if got != EXPECTED:
    raise SystemExit(f'STOP: package file is corrupted (sha256 {got[:12]} != {EXPECTED[:12]})')
if target.exists():
    old = target.read_text(encoding='utf-8', errors='replace')
    if 'رادار فرماندهی شبکه ملی اطلاعات' not in old:
        raise SystemExit('STOP: target does not look like the radar dashboard; nothing changed')
    backup_dir = target.parent.parent / (target.parent.name + '-backups')
    backup_dir.mkdir(exist_ok=True)
    backup = backup_dir / f'index-before-v4.7-{datetime.now():%Y%m%d-%H%M%S}.html'
    shutil.copy2(target, backup)
    tmp = target.with_suffix('.tmp'); tmp.write_bytes(data); tmp.replace(target)
    print('OK: dashboard v4.7 ->', target, '\n    backup:', backup, '\n    sha256:', got)
else:
    print(f'SKIP dashboard: {target} not found (pass --html PATH)')

if repo:
    run = lambda *c, **k: subprocess.run(c, cwd=repo, check=True, text=True, capture_output=True, **k).stdout.strip()
    if not (repo / '.git').exists():
        raise SystemExit(f'STOP: {repo} is not a git checkout')
    if run('git', 'status', '--porcelain', '--untracked-files=no'):
        raise SystemExit('STOP: the server checkout has uncommitted changes; commit or stash them first. Nothing changed.')
    run('git', 'bundle', 'verify', str(BUNDLE))
    run('git', 'fetch', str(BUNDLE), 'radar-v4.7-local:refs/tags/radar-v4.7-local')
    prev = run('git', 'rev-parse', '--abbrev-ref', 'HEAD')
    run('git', 'checkout', '-B', 'radar-v4.7', 'radar-v4.7-local')
    print(f'OK: API code at radar-v4.7 (previous branch: {prev}; return with: git checkout {prev})')
    t = subprocess.run([sys.executable, '-m', 'pytest', '-q'], cwd=repo / 'apps' / 'api', text=True, capture_output=True)
    print('    API tests:', (t.stdout.strip().splitlines() or ['?'])[-1])
    print('NEXT: restart the API process the way it runs on this server (e.g. systemctl restart <service> or docker compose restart <api>),')
    print('      set RADAR_ONLINE_SCHEDULER=1 and CLOUDFLARE_API_TOKEN in its environment, then run:')
    print('      cd', repo / 'apps' / 'api', '&& python3 scripts/online_audit.py > online_audit.md')
