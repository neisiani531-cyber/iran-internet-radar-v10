# Radar V10 assistant deployment status

The React assistant is available on every route and in the sidebar. **GitHub Pages cannot host a model API or keep an LLM API key secret.** Without backend deployment it deliberately uses a limited deterministic public-data guide, clearly labeled in the UI; this is not a full generative assistant.

## Production activation

Deploy `apps/api` on a server running Python 3.11+ with `pip install -r apps/api/requirements.txt`; launch from `apps/api` using `uvicorn app.main:app --host 0.0.0.0 --port 8000` (ensure project contracts folder is included with deployment). Configure server-only environment variables:

- `OPENAI_API_KEY`: secret LLM provider key. Never set this in Vite, frontend code or GitHub Actions Pages build.
- `RADAR_LLM_MODEL`: optionally select the allowed chat-completions model, default `gpt-4.1-mini`.
- `RADAR_ASSISTANT_FRONTEND_ORIGIN`: exact frontend origin, e.g. `https://neisiani531-cyber.github.io`.

Configure the **frontend build-time** `VITE_RADAR_ASSISTANT_API_URL` to the public HTTPS origin of the secure API server, then rebuild and deploy GitHub Pages. Do not include private evidence or raw repositories on the API server. Provide TLS termination, authentication or abuse throttling, request size limits, audit-safe logging and quota before public rollout.

## Evidence quality

The model receives only the published 22 public evidence metadata records with IDs and source IDs; it does not yet have full PDF page text, claims, 8 private conflicts, a vector index or retrieval service. It must state when evidence is inadequate. This is an **initial conversational foundation**, not a production-grade page-cited RAG assistant.

## Tests and release gate

Run `pytest apps/api/tests/test_assistant_api.py` with the existing test environment. Verify the browser with LLM endpoint configured and unconfigured, Persian RTL, mobile, rate limits and network failure states. Treat live LLM connectivity as NOT_EXECUTED until a real hosted endpoint, secret and browser round-trip are verified.
