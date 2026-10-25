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

## Layout implementation checkpoint — 2026-10-25
- Existing `ModularDashboard` retained; no chart/data adapter replacement.
- Three separately persisted chart layouts: analyst, manager and large display. These are analytics-layout presets, not a replacement for the existing full-dashboard presentation toggle.
- Widget library lists the three data-connected widgets; individual add/remove preserves chart mode, order, width and height. No placeholder feeds are fabricated.
- Storage v2 migrates legacy v1 preferences into analyst layout; known IDs, compatible chart modes, bounded heights and active profile are validated. Reset affects only the selected profile. Browser storage failure is visible.
- Reordering accepts only an internal active edit drag. Native height observation and existing accessible before/after controls remain available.
- Browser regression now covers native mouse resize, combined wide/hidden/restored/reordered widgets, profile isolation across reload and reset, empty-layout recovery, mobile controls, legacy migration and invalid stored settings.
- Remaining: extending the widget registry beyond the three current datasets, advanced grid compaction, and applying the approved central-map visual composition to the full dashboard.
- Release remains on the integration branch; no production deployment is authorized by this checkpoint.

### Two-axis layout follow-up
- Added a captured-pointer corner handle that changes chart height (180–480 px) and panel width (6–12 snapped grid columns). Native vertical resizing and width buttons remain available.
- RTL arrow keys provide a keyboard alternative. On narrow screens, panels occupy the available width while their desktop column preferences remain stored.
- Existing v2 profiles gain validated column widths from their prior normal/wide setting. No stored layout is discarded.
- Drag targets display a leading/trailing insertion marker; drops support both positions and still require an internal edit drag.
- Native ResizeObserver updates are suspended during the custom gesture, preventing stale intermediate measurements from replacing the final pointer size.
- Chromium regression covers real two-axis mouse resize, reload persistence, desktop/mobile width preservation, keyboard width adjustment and trailing insertion preview/drop in addition to previous coverage.

### Wide composition follow-up
- Target route alone now uses a compact navigation rail and full available canvas; other routes retain their existing shell.
- Six compact snapshot cards and a source-admission/evidence metadata strip precede a three-panel hero: operators, central Iran map, aggregate RTT/Jitter.
- Source counts are computed from existing public contracts. They are not feed health scores or claims of live national coverage.
- RTT bars use the four actual CRA57 network/route observations, with period, milliseconds, aggregate scope and visual-QA limitation. Map remains neutral because provincial observations are absent.
- Modular studio remains mounted below the hero, retaining all persisted preferences and resizing controls; supporting evidence/incident/decision panels follow it.
- Responsive layouts retain all panels. Browser regression checks centered/aligned map, period-mismatch empty state, source links, mobile overflow and all previous layout gestures.
- Outstanding: final art direction, richer time/axis/tooltips, additional qualified data-connected widget types and approved staging deployment.

### Chart inspection follow-up
- Extracted reusable `AnalyticsChart` from the modular layout component; no new dependency or data source.
- Charts use their actual container dimensions, source periods/questions and units, numeric Y axes, and responsive tick density.
- Pointer crosshair/readout and keyboard Home/End/arrow inspection expose exact source values. Series toggles retain at least one visible series. Donut remains restricted to compatible datasets and names its latest period.
- Survey bars use separate question labels, percentage scale, and source-specific descriptions; they do not imply a temporal series or common denominator.
- Expandable data tables expose all supplied observations, including the complete 24-quarter mobile series. Invalid/incomplete chart arrays receive an empty state rather than substituted zeroes.
- Chromium checks first/latest readouts and tabular values against the mobile source contract, survey qualification text, legend constraints, and existing layout regressions.

### Source-backed QoS widget expansion
- Widget registry now contains five entries: mobile history, fixed history, survey preview, 3G/4G access success and 3G/4G drop rate.
- New optional widgets are initially hidden, including when upgrading old stored profiles; existing visible order and sizes remain intact. Library add/remove, profile persistence and restore-all cover all five widgets.
- QoS widgets read twelve actual operator/generation values from CRA57 page 15. Source period and pending visual-QA gate remain visible; single-quarter snapshots are not rendered as time trends.
- Bar and heatmap are the only admitted chart modes for these widgets. Heatmap cells display actual percentages, generation rows, operator columns and an explicit numeric color domain; higher drop rate is not marked as better performance.
- Browser regression adds both widgets, checks all twelve table values against their source, verifies six cells per heatmap and checks reload persistence. Real widget screenshot is captured as qos-heatmap.png.

### Linked scope follow-up
- The target page now passes its mobile period/operator selection into the existing modular studio.
- Mobile history is truncated at the selected quarter and restricted to selected operators; donut composition uses that same endpoint.
- QoS widgets filter their operator columns and show an explicit unavailable state for quarters other than their actual 1405-Q1 source period. Source values are never copied into earlier quarters.
- Fixed access and survey widgets retain their independent source scopes with visible explanations, rather than being attributed to a mobile operator.
- Scope changes do not reset chart choice or persisted layout dimensions. Inspector state resets when the underlying scope changes.
- Browser regression checks selected-operator coverage, the 23-quarter cutoff and exact source endpoint, donut period, unavailable/recovery behavior, and preservation of layout/chart preferences.

### Paired QoS scatter widget
- Added a sixth optional widget using the existing page-15 snapshot. Access-success and drop-rate observations are joined by operator and generation, within the same source quarter.
- X is access success and Y is drop rate, both percentages. Stable colors identify operators; circle/diamond identifies 3G/4G. Numeric domains and the nonzero X origin are explicit.
- Inspector supports pointer, focus and keyboard navigation. The attached table exposes both exact source values for every point.
- Operator/period filters and unavailable states follow the same scope contract as other QoS widgets. No fitted trend, composite score, province attribution or causal conclusion is computed.
- Regression verifies all six joined observations against twelve source values, keyboard focus, selected-operator coverage, missing-period behavior and six-widget restore-all. Actual widget screenshot is qos-scatter.png.
