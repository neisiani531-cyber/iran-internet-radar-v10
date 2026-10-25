# Iran Internet Radar V10 — Target Command Center Specification

Status: design and engineering baseline (not a claim of production readiness).
Target: a fully navigable decision-support command center, built independent of data availability but never fabricating observations.

## Layout
- 16:9/desktop control room, responsive tablet/mobile; Persian RTL using existing design tokens/font; accessible keyboard navigation.
- Fixed right rail: Command, Provinces, Operators, Fixed/Fiber, QoS/QoE, Routing/Incidents, Public Experience, Evidence, Reports, Assistant.
- Top global bar: data as-of time, per-source freshness, period comparison, province/operator/technology selectors, export.
- Upper strip: 6 metric cards with values only when qualified; badges showing publication gate and freshness.
- Central canvas: geographically accurate Iran SVG with province IDs; layer selector, legend, data-coverage status, tooltip/drill-down; do not imply coverage for missing provinces.
- Adjacent: incident timeline + operator trends and causal-hypothesis / evidence status.
- Bottom: technical QoS & routing, public-experience research, priority findings, evidence links, S01/S02 decision actions.
- Slide/TV presentation mode; no animation that obscures meaning.

## Data state contract (mandatory on every metric, chart, map layer, finding)
A widget MUST represent one of:
- measured: qualified actual observation, with source, time, unit, method, denominator and coverage.
- derived: calculation with explicit inputs, formula, denominator, same-period and same-scope checks.
- research_preview: source-associated research value not yet admitted as a national official KPI.
- pending_qa: transcription imported but unverified against original source.
- stale: observation exists but its time horizon fails a documented source-specific freshness rule.
- unavailable: no observation for selected filters; show transparent 'داده موجود نیست' empty-state.
- simulated: development/demo fixture ONLY and prominently labelled, excluded from production reports.
No invented defaults and no green national health status for absent provincial data.

Minimum metadata: metric_id, source_id, source_url_or_document, publication_date, observed_at_or_period, geographical_scope, operator_scope, methodology, numerator/denominator when applicable, status, qa_gate, retrieval_time, limitations.

## Data adapters (reuse before new ingestion)
1. CRA57 official 130 catalog (public/data/v917-official-catalog.json) — pending visual QA; region-specific mapping only when source contains geography.
2. CRA57 24-quarter operator broadband contract — source page 25, history; comparison with 7 extra metrics ONLY for 1405-Q1.
3. CRA57 QoS (3G/4G success/drop) and fixed/mobile RTT/Jitter — page 15 per operator vs page 14 aggregated; NEVER rank operators with aggregated RTT.
4. Fixed/FTTx and 5G snapshots — keep coverage versus active subscriptions distinct.
5. Public survey preview — Q5 pending, not official national score or causal proof.
6. TIC exploratory, BGP/RIS and IODA/RIPE/M-Lab/OONI feeds — each independent, metadata-gated; show live only when actually refreshed.
7. Social experimental data — never imply nationally representative sentiment.

## Definition of done by module
- Visual: consistent layout, meaningful empty/loading/error/stale states, keyboard access, desktop/mobile and TV sizing.
- Data: explicit time, geography, denominator, source and admissibility for each displayed value.
- Interaction: linked global filters, clear reset, province/operator drilldown, comparison and export.
- Evidence: clickable trace to source, limitation, and separate facts vs hypotheses.
- Quality: unit/component tests, typed fixture validation, independent browser build, no impact on running service until release approval.

## Implementation sequence
A. Build target dashboard shell as a new route/component in the existing Vite/React app; keep old command center accessible.
B. Add typed view-model/adapters for metric cards, map, trends and evidence statuses; wire available snapshots.
C. Add valid Iran province geometry and ID mapping with explicit no-data treatment; don't substitute arbitrary gradients.
D. Connect operator period comparison, quality, incidents, survey evidence and decision register.
E. UX and technical QA: responsive, RTL, performance, visual regression, accessibility, CI.
F. Parallel evidence acquisition backlog from empty-state inventory; stage deployment, rollback, controlled publish.

## Release gate
DO NOT auto-deploy to 185.105.101.70. Changes stay on integration/radar-v10-20261017 until tests + frontend build + review + controlled release.
