# Radar V10 public API (initial migration)

This is a minimal independently testable FastAPI service. It is **not** a migration of the earlier full API nor of the private research corpus.

```bash
cd apps/api
python -m pip install -r requirements-dev.txt
python -m pytest -q
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Endpoints:
- `GET /health`
- `GET /api/v1/metadata`
- `GET /api/v1/fixed-access?technology=FTTx`
- `GET /api/v1/fixed-access/1405-Q1`

This public snapshot contains **only spring 1404 and spring 1405**, not fabricated intermediate quarters. Scientific Q5 admission is **independent** from an API or CI pass.
