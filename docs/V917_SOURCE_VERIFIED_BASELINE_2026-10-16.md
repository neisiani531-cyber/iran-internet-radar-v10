# V9.17 source-verified migration baseline (2026-10-16)

Source: `iran_internet_radar_v9_17_embedded_font.html`
SHA-256: `4baf6708920d45b774bbc780fe89845afed3ea449e8856ff6bc6a194a304db46`

This inventory was recovered from the embedded JSON payload of the actual V9.17 HTML, **not** inferred from older V9 reports. This document inventories source content; it does not claim feature parity or scientific publication clearance.

## Counted payload collections

| Payload group | Entries |
|---|---:|
| `official` | 130 |
| `evidence` | 320 |
| `operators` | 3 |
| `coverage` | 10 |
| `technology` | 4 |
| `quality` | 4 |
| `pdfPages` | 28 |
| `research.sources` | 50 |
| `research.tic` | 11 |
| `research.tor` | 25 |
| `research.regional` | 4 |
| `research.conflicts` | 8 |
| `research.mechanisms` | 6 |
| `research.githubCentralEvidence` | 22 |
| `research.surveyCrosswalkV94` | 9 |
| `research.asnRecoveryReportedV94` | 6 |

There are exactly 130 distinct IDs in `official`, with no duplicate ID in that collection. They break down as follows: mobile 54, fixed 18, overview 16, services 16, other 10, quality 8, reach 5, citizen 3. **These lists overlap conceptually and must not be added together as a count of unique observations.** All 28 `pdfPages` contain embedded images. No external `script src` appears in the legacy HTML.

## Legacy navigation and destinations

| V9.17 route | V10 native destination | Audit classification | Work needed |
|---|---|---|---|
| home | CommandCenter | PARTIAL | source-linked national KPI catalog |
| mobile | OperatorExplorer | PARTIAL | historical series, complete metric options |
| fixed | Fixed section in main.tsx | PARTIAL | full fixed operator, technology and period explorers |
| quality | LatencyQuality / QoS | PARTIAL | multi-metric lab and drill-down |
| reach | none native | MISSING | coverage and regional analysis |
| citizen | ResearchInsights | PARTIAL | complaints and survey studio |
| services | none native | MISSING | roaming, post and satellite |
| resilience | S01/S02 partial | PARTIAL | Tor/TIC, scenarios and resilience lab |
| decision | ResearchInsights / EvidenceRoom | PARTIAL | constraints, conflicts and evidence-to-action |
| appendix | none native | MISSING | official indicator annex browser |
| library | EvidenceRoom | PARTIAL | original PDF page browser and source registry |
| assistant | RadarAssistant | PARTIAL | embedded frontend only, live model service not deployed |

The V10 repository already contains `public/legacy/v9-17.html` and links it through an iframe in `src/main.tsx`. **Embedding the legacy application is preservation/access, not a native React migration.**

## Source safety and acceptance gates

- `official` rows have ID, value, unit, period, page and source fields. Source labels and denominators are not necessarily suitable for publication without page-specific verification.
- Do not mix `research`, `evidence` and `official` counts; research items may be provisional, redundant or access-restricted.
- Do not promote private studies or evidence into the public application solely because the legacy standalone HTML included them.
- For every native destination, verify source and value equality, periods, denominator, JS/TS build, API tests, interactive browser behavior and Pages deployment separately.
- A successful build or successful Pages workflow is not proof of data accuracy.

## Immediate native migration batch

1. Canonicalize all **130 distinct official metrics** in a source-indexed contract. Preserve ID, group, unit, period, source page, denominator and status exactly. Include deterministic ID/total checks.
2. Build a catalog explorer with text search, group/period filtering and page-level source navigation. Guard uncertain page transcriptions, avoid inferred zeros.
3. Connect the existing fixed/mobile/QoS sections to the unified catalog, then restore reach, services and appendix views.
4. Compare the native interface with each V9.17 interaction. Publish PASS/FAIL/NOT_EXECUTED evidence separately.

This baseline documents observed structural presence, not a completed V10 parity assessment.