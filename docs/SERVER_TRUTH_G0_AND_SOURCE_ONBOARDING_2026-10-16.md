# G0 | Server Truth and Source Onboarding
Date: 2026-10-16
State: **PENDING HOST INSPECTION**. This is an evidence template, NOT a completed audit.
Governing decision: [ADR-002](decisions/ADR-002-OPERATIONAL-RADAR-GATES-2026-10-16.md).
Previous baseline and V9.17 materials are retained; do not git reset, clean, pull, or overwrite local files to match main.

## A. Known reports (NOT independently reverified against server in this commit)
- Host project reported as ~/services/iran-internet-radar-v10 on an Ubuntu VPS.
- Product GitHub default branch: main; local-only QoSQoECenter.tsx, fixed redesign and docs/qos-qoe-source-matrix.json may exist.
- Reported frontend test image: iran-radar-frontend:v10-qos-qoe-test; trial container iran-radar-qos-qoe-test; Caddy routes / and /qos-preview/; route assets may be manually patched and ephemeral.
- Reported tests: frontend build/TypeScript and V9.17 migration 18/18; **NOT** production data integrity, source licensing, browser E2E or research Q5.
- RIPE RIS Live implemented in FastAPI with in-memory deque and five-ASN allowlist; existing live status must be measured again.
- Research private repo controls remain independent; data source registry 164 entries / 46 relations was previously reported for 2026-10-15, not a live re-audit.

## B. Fill only after real server observation
| Item | Actual value/evidence/time | Check |
|---|---|---|
| UTC timestamp, host OS and uptime | PENDING | |
| Git branch / HEAD SHA / dirty files (redact secrets) | PENDING | |
| Production image ID/digest vs local test image | PENDING | |
| Docker services, networks, volumes, mounts | PENDING | |
| Caddy active config and route -> container | PENDING | |
| Cron/systemd jobs and data persistence locations | PENDING | |
| RIS /api/v1/live/status and backend uptime | PENDING | |
| API/frontend version mismatch and unpublished local changes | PENDING | |
| Backup path, restore drill and rollback target | PENDING | |
| Host RAM/disk headroom for PostgreSQL | PENDING | |

## C. Read-only commands for server operator (run without posting sensitive details)
```bash
cd ~/services/iran-internet-radar-v10
date -u; git branch --show-current; git rev-parse HEAD; git status --short
sudo docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
sudo docker image inspect iran-radar-frontend:v10-qos-qoe-test --format '{{.Id}}' 2>/dev/null || true
sudo docker volume ls
df -h .; free -h
curl -fsS --max-time 8 -H 'Host: 185.105.101.70' http://127.0.0.1/api/v1/live/status || true
```
Review all output for tokens, internal addresses and other secrets before sharing. Do not run build/restart/deploy in G0.

## D. Source onboarding matrix
| Source | Operational role | Documentation checked | Real sample captured | Terms/storage/redistribution approved | Auth and quota | State |
|---|---|---|---|---|---|---|
| RIPE RIS Live | streamed BGP UPDATEs | existing implementation + docs | PENDING new UTC proof | PENDING | public WebSocket; verify use terms and observed rate | IMPLEMENTED, G1 NOT PASSED |
| RIPEstat | ASN/prefix history and route context | existing ecosystem knowledge | PENDING | PENDING | verify per endpoint | CANDIDATE G1 |
| IODA v2 | independent reachability evidence | T07 API v2 schema audit in research repo | PENDING | PENDING | verify v2 schema & limits | CONDITIONAL G4+ |
| RIPE Atlas | existing measurement samples | PENDING | PENDING | PENDING | probe coverage and credits | DEFERRED |
| Cloudflare Radar | normalized HTTP/attack/DNS signals | research T07 audit exists | PENDING | PENDING | token and quotas | DEFERRED |
| OONI | vantage-limited reachability tests | A01 protocol audit exists | PENDING | PENDING | limits + reuse | DEFERRED |
| ArvanCloud/public domestic probes | access and service viewpoints | PENDING | PENDING | PENDING | public display != API | DEFERRED |

## E. Scope and protection
- Evidence flow: raw source metadata -> source/evidence/claim/conflict IDs -> Q0-Q5; never promote candidate to official.
- Keep separate: allocation country, BGP origin ASN, observed path ASN and operator ownership.
- No new UI, Caddy modifications or container restart until G0 accepted.
- Existing research product dashboards, published V9.17 and QoS/QoE local trials remain as historic development assets.
- After G0: save a redacted evidence-backed revision with explicit commit SHA and status change; never quietly rewrite this pending state.
