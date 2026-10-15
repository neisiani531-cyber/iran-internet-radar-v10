# Radar V10 contracts (public snapshot)

This directory is the **shared semantic contract** for independently tested public data. It is not a copy of private research evidence.

- `public-fixed-access.snapshot.json`: two explicitly sourced spring snapshots, with reported totals and provenance.
- `observation.schema.json`: JSON Schema for a numeric public observation.
- `validate_snapshot.py`: standard-library validator. It fails for inconsistent totals, unexpected periods, negative values, missing provenance and accidental third-quarter additions.

Run `python packages/contracts/validate_snapshot.py` from repository root. The CI workflow should also execute it.

**Migration:** The initial React bootstrap and FastAPI service still contain their own copies of these two observations. Centralizing imports is the next change and must be gated by regression tests. No scientific promotion follows from passing tests.
