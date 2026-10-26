# Native V9.17 content migration · 2026-10-26

Reference: the preserved `public/legacy/v9-17.html`, corresponding to the user-specified `/legacy/v9-17.html` route. Direct comparison with the running server bytes is not possible from the current execution environment. The preserved reference is unchanged.

## Delivered native access

- 130 official observations in 59 panels. Every ID and observation, including period, value, unit, page and notes, is retained exactly. Panels combine only compatible measures; composition views are limited to operator shares and fixed technologies. Single observations remain scalar values, rather than invented trends.
- Star/unstar pins individual source-backed panels on the command page. This selection persists independently of the existing seven-widget layout system.
- Native archive search and paginated detail views for 320 legacy evidence records, 50 sources, eight conflicts, six mechanisms, nine survey crosswalks, 22 central evidence records and six reported ASN recovery records.
- Original TIC, Tor, regional, model and companion objects remain inspectable with their original fields and numeric precision. Null is not converted to zero.
- All 28 original report images are accessible beside the matching extracted page text, without executing the legacy interface or embedding it in an iframe.
- Cost/income calculator preserves the legacy formula and rejects invalid or missing inputs. The three resilience scenarios retain the legacy illustrative series and carry explicit simulation labels.
- Legacy same-origin `/api/ripe?measurement=...` and `/api/stock?symbol=...` controls are available on demand. Response schemas are checked; failure cannot generate substitute observations. This does not deploy the gateway backends or verify a live external source.
- Corrected the existing OfficialDataStudio labels: `ping3g` and `ping4g` are legacy field names for reported download speed (Mbps), not response-time measurements.

## Verification

`scripts/test-legacy-native.mjs` compares every official record against the original embedded payload, checks uniqueness and panel units, checks download-speed semantics, and checks source image counts and Tor's known gap/frac behavior. This runs in the build using TypeScript transpilation compatible with CI Node 20.

`scripts/legacy-native-smoke.mjs`, invoked by the full browser suite, compares all 130 displayed values and IDs with the original source, verifies pin persistence, archive counts and search, the cost formula, scenario controls, original page 28 image identity, and mobile overflow. Gateway checks use explicit browser test fixtures; these do not demonstrate real server connectivity.

## Boundaries and remaining parity work

Data/content accessibility is broader than full UI and operational parity. The historical architecture audit remains relevant: language/theme parity, a complete reconstruction of each legacy visualization and interaction, graphical evidence/decision relationships, source-by-source visual scientific QA and live backend acceptance are not certified complete by this change. Existing dedicated native research and operator views remain available. Model and staged values must not be promoted to national measured KPIs.

The bridge reads the already-distributed preserved source using an inert DOMParser and JSON parsing. It does not execute legacy scripts, inject HTML, export new raw research contracts, or change the original scientific admission status.
