# ADR-002 | Real Radar Operational Gates and History Preservation
Date: 2026-10-16
Status: ACCEPTED FOR EXECUTION; NOT DEPLOYED
Scope: incremental operational vertical slice; supplements ADR-001 and docs/ARCHITECTURE.md. No prior document, branch, legacy V9.17 asset, research dossier, or deployed container is superseded or deleted.

## Source of truth and non-regression
- Product code, public contracts, API, CI: neisiani531-cyber/iran-internet-radar-v10.
- Raw/private research, claim/evidence/conflict, Q0-Q5: neisiani53-create/iran-internet-research.
- Running VPS reality is **UNVERIFIED UNTIL G0 SERVER AUDIT**. GitHub branch and production are not presumed equal.
- Preserve CRA57 130 metrics, V9.17 legacy snapshots, Tor gap and frac handling, operator/fixed histories, QoS/QoE test build, P01 research preview, S01-S02 crosswalk, live API and routes. Changes are additive, reviewed, and rollbackable.
- Q5 accepted remains 0 unless independently advanced through research controls. Public snapshots cannot silently promote previews into official indicators.

## Measurable goal
An operational radar requires: continuous collection with timestamps/retry; durable immutable raw payload plus hashes and replay; versioned Iran ASN/prefix scope; normalized validated observations; source health including error, stale, missing, zero; an evidence-linked incident candidate and human review; auditable API + timeline. A passing frontend build does not satisfy this definition.

## Gates (enforce sequentially)
| Gate | Required artefact | Acceptance / stop rule |
|---|---|---|
| G0 FREEZE/TRUTH | docs/SERVER_TRUTH.md, docs/SOURCE_ONBOARDING.md, inventory of uncommitted VPS changes, image digests, Caddy routes, running containers, existing storage and jobs | Read-only facts captured with timestamp and redaction. **NO deploy, restart, build or Caddy edit before approval** |
| G1 SOURCE/SCOPE | Versioned Iran ASN/prefix registry + lineage; RIS Live and RIPEstat sample responses, API terms/limits, retries | A response with UTC, payload SHA-256, original URL, source version/last update; allocation vs BGP origin differentiated; no guessed operator attribution |
| G2 STORAGE | Reviewed DB migration and raw-store spec, backup/restore/retention/partition plan | PostgreSQL first unless measured volume dictates otherwise; raw append-only with hash; indexes and replay test; zero/missing/stale separated; rollback verified |
| G3 FIRST VERTICAL SLICE | RIS -> raw -> normalized observation -> existing FastAPI facade -> real timeline | Persistent after restart; source-health endpoint; contract/integration/stale tests; no fabricated incidents; 95th percentile ingest-to-query target under 60 s measured and reported as target, not current fact |
| G4 SECOND SOURCE | RIPEstat enrichment of G3 events; optional IODA only after onboarding | Provenance and source matching; independent measurement not implied by enrichment; no forced correlation |
| G5 INCIDENT v0 | documented baseline, candidate rule, supporting and conflicting evidence links, reviewer states | withdrawal does not equate reachability loss; tunable thresholds tested for false positives; attack attribution prohibited without corroboration |
| G6 PRODUCT/SECURITY | reused shared charts, integrated QoS/QoE, case timeline; RBAC, secrets, audit, backup, CI/E2E | Gate G3/G4 data powers view; no newly invented datasets; staging -> reviewed production with rollback |

## Design requirements
Collector -> queue/outbox (when required by measured load) -> immutable raw -> validator -> observation DB -> evidence/incident -> existing FastAPI -> UX. Start minimal, do not prematurely provision ClickHouse/Timescale or message broker. Retain history according to measured volume/legal terms; initial 30-day target subject to review.
Mandatory observation fields: source_id, observed_at UTC, received_at UTC, recorded_at UTC, source_revision, entity (ASN/prefix/geo), metric, unit, value nullable, value_state, method, vantage, quality_state, raw_sha256.
Source health: connection_state, last_success_at, last_event_at, lag_seconds, last_error_redacted, sample_count, dropped_count, data_completeness, ingestion_version.
Source access onboarding must separate API documentation, successful response, permission to store, permission to republish, quota, authentication and update cadence.
Prior research Q5 gates and product gates G0-G7 are distinct; this document's operational G0-G6 does not rename or replace existing product G0-G7 gates.

## Scope freeze
P0: existing RIS and RIPEstat only. IODA v2 conditional future source. Atlas, Cloudflare, OONI and ArvanCloud are candidates pending access/terms and review. No new dashboard/rebuild before G3. Existing frontend stays available but is not evidence of operational completion.

## Next actionable step
Run read-only host inspection and populate SERVER_TRUTH; do not commit secrets, IP/private tokens, SSH key paths, or sensitive raw data. Determine local-only changes before pulling or writing any production files. Collect one actual RIS response and one RIPEstat sample only after G0.
