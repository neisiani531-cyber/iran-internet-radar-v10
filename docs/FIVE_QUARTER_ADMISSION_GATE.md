# Gate: complete five-quarter fixed-access history

**Status:** BLOCKED_ON_SOURCE (not blocked on software).

The current public shared snapshot contains only `1404-Q1` and `1405-Q1`; these endpoints are tested. The intended five-quarter series also requires:
- `1404-Q2` (تابستان ۱۴۰۴)
- `1404-Q3` (پاییز ۱۴۰۴)
- `1404-Q4` (زمستان ۱۴۰۴)

Do not infer missing values by interpolation, copying nearby reports, or using a prose summary of the former V9 HTML. Before importing each quarter, supply the original report, page/table, units, value of each of the four technologies, and the published total. Compare the sum and note any official corrections.

## Admission checklist
- Original source URL or archived report identifier; publisher and retrieval date
- Page number and table title; quarter calendar interpretation
- XDSL, FTTx, TDLTE, WiFi; totals and checked arithmetic
- A meaningful per-observation provenance field when schema is expanded
- Exact result of the new contract-parity tests and React Build
- No change to scientific Q5 status of independent research dossiers

The product and research repositories are separate sources of truth. Even a successful React or API CI cannot establish scientific acceptance of these missing observations.

## Immediate safe work
The contract-parity tests now compare all four technology values, every published quarter, and API metadata against the same JSON snapshot, instead of testing only isolated constants. Extend the existing snapshot validator and tests only after new original source evidence is available.
