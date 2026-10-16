# Live BGP telemetry deployment and scientific limitations

**State**: Implemented behind an explicit opt-in flag; not deployed on GitHub Pages.

Backend: `apps/api/app/ris_live.py`, endpoints `/api/v1/live/status` and `/api/v1/live/events`. Frontend: `src/LiveRouting.tsx`, independent navigation item.

## Server configuration

Install `apps/api/requirements.txt` and start `uvicorn app.main:app --host 0.0.0.0 --port 8000` from `apps/api`, or an equivalent service environment with the root repository also available for public snapshot contracts.

On the trusted API server:
- `RADAR_ENABLE_RIS_LIVE=1` to start outbound secure WebSocket to `wss://ris-live.ripe.net/v1/ws/`. Default is **0**, meaning disabled.
- `RADAR_LIVE_FRONTEND_ORIGIN=https://neisiani531-cyber.github.io` to permit GitHub Pages GET access via CORS.
- use a production HTTPS proxy, proper restart policy and monitoring.

For Vite frontend build, configure `VITE_RADAR_LIVE_API_URL=https://<deployed-api-domain>` without a trailing slash. The UI will not assume a live service if this is unset. GitHub Pages only hosts static files and **does not run Python services**.

## Data contract

- Real RIPE RIS Live BGP updates, announcement and withdrawal only, are exposed with receive time and source.
- These are control-plane route changes; they **do not** measure users' network latency, packet loss, filtering, provincial QoE or a national health score.
- No fabricated numbers, simulated outages, province heatmap or synthetic health scores are included.
- Disconnected / disabled / error states do not masquerade as green health.
- State and events are in memory; restart loses events. Not a full collector, persistence or 24/7 operational SLA.
- The current allowlist is a sample group of five ASNs and cannot establish national completeness.
- For withdrawals, origin ASN is unknown and not inferred.
- The RIS API is an external dependency. Ensure actual feed schema and subscription delivery are verified in an integrated end-to-end test before calling this production-ready.

## Controls

Run `pytest apps/api/tests/test_ris_live.py` in correctly configured PYTHONPATH/test environment. GitHub Actions API suite and Vite Build check static behavior, but neither confirms a live RIPE stream at runtime.

To expose the feature to stakeholders, first deploy API and perform real WebSocket connectivity, CORS, E2E browsing and data-integrity testing. Until then the feature is a transparent **not connected** prototype, not a live monitor.
