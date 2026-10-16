"""Optional RIPE RIS Live route-event monitor. No fabricated network measurements."""
from __future__ import annotations
import asyncio
import json
import logging
import os
from collections import deque
from datetime import datetime, timezone
from time import monotonic
from fastapi import APIRouter

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/live", tags=["live-routing"])
RIS_URL = "wss://ris-live.ripe.net/v1/ws/"
ASN_ALLOWLIST = (12880, 197207, 44244, 58224, 57218)
MAX_EVENTS = 200
EVENT_TTL = 300
events: deque[dict] = deque(maxlen=MAX_EVENTS)
last_message_at: str | None = None
last_success_at: str | None = None
last_error: str | None = None
last_ack_at: str | None = None
received_history: deque[float] = deque(maxlen=3000)
seen_keys: dict[tuple, float] = {}
connected = False
task: asyncio.Task | None = None
stop_signal = asyncio.Event()

def process_message(payload: dict) -> int:
    """Accept only RIS UPDATE announced/withdrawn prefixes. BGP != latency/QoE."""
    global last_message_at, last_success_at, last_error, last_ack_at
    if payload.get("type") == "ris_subscribe_ok":
        last_ack_at = datetime.now(timezone.utc).isoformat()
        last_success_at = last_ack_at
        return 0
    if payload.get("type") == "ris_error":
        last_error = str((payload.get("data") or {}).get("message", "RIS subscription error"))[:400]
        log.error("RIS protocol error: %s", last_error)
        return 0
    if payload.get("type") != "ris_message":
        return 0
    data = payload.get("data")
    if not isinstance(data, dict) or data.get("type") != "UPDATE":
        return 0
    peer = data.get("peer_asn")
    path = data.get("path") or []
    if not isinstance(path, list):
        return 0
    try:
        path_asns = {int(str(a)) for a in path if str(a).isdigit()}
    except (ValueError, TypeError):
        return 0
    if not path_asns.intersection(ASN_ALLOWLIST):
        return 0
    origin_asn = int(path[-1]) if path and str(path[-1]).isdigit() else None
    when = datetime.now(timezone.utc).isoformat()
    timestamp = data.get("timestamp")
    if not isinstance(timestamp, (int, float)):
        timestamp = None
    rows = []
    for item in data.get("announcements") or []:
        if not isinstance(item, dict):
            continue
        for prefix in item.get("prefixes") or []:
            if isinstance(prefix, str):
                rows.append(("announcement", prefix))
    for prefix in data.get("withdrawals") or []:
        if isinstance(prefix, str):
            rows.append(("withdrawal", prefix))
    admitted = 0
    for kind, prefix in rows:
        try:
            from ipaddress import ip_network
            prefix = str(ip_network(prefix, strict=False))
        except ValueError:
            continue
        key = (kind, prefix, origin_asn if kind=="announcement" else None, timestamp, str(peer))
        now_mono = monotonic()
        if key in seen_keys and now_mono-seen_keys[key]<EVENT_TTL:
            continue
        seen_keys[key]=now_mono
        if len(seen_keys)>6000:
            seen_keys.clear()
        received_history.append(now_mono)
        last_success_at = when
        admitted += 1
        events.append({"kind":kind,"prefix":prefix,"origin_asn":origin_asn if kind=="announcement" else None,
                       "peer_asn":peer,"observed_at":when,"received_at":when,"ris_timestamp":timestamp,
                       "source":"RIPE_RIS_LIVE","measurement":"BGP_CONTROL_PLANE"})
    if admitted:
        last_message_at = when
    return admitted

async def run_monitor() -> None:
    global connected, last_error
    import websockets
    backoff = 2
    while not stop_signal.is_set():
        try:
            async with websockets.connect(RIS_URL, ping_interval=20, ping_timeout=20, max_size=2**21) as ws:
                # RIS subscription syntax is supported: type UPDATE with AS path match.
                for asn in ASN_ALLOWLIST:
                    await ws.send(json.dumps({"type":"ris_subscribe","data":{"type":"UPDATE","path":asn,"socketOptions":{"acknowledge":True}}}))
                connected = True
                backoff = 2
                async for raw in ws:
                    if stop_signal.is_set():
                        return
                    try:
                        process_message(json.loads(raw))
                    except (ValueError, TypeError, KeyError):
                        log.warning("Discarding invalid RIS message")
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            last_error = str(exc)[:400]
            log.warning("RIS transport disconnected: %s", exc)
        finally:
            connected = False
        try:
            await asyncio.wait_for(stop_signal.wait(), timeout=backoff)
        except asyncio.TimeoutError:
            pass
        backoff = min(backoff * 2, 60)

def start() -> None:
    global task
    if task is None or task.done():
        stop_signal.clear()
        task = asyncio.create_task(run_monitor(), name="ripe-ris-live")

async def stop() -> None:
    global task, connected
    stop_signal.set()
    if task:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
        task = None
    connected = False

@router.get("/status")
def status():
    enabled = os.getenv("RADAR_ENABLE_RIS_LIVE", "0") == "1"
    now = monotonic()
    count_60s=sum(1 for t in received_history if now-t<=60)
    state="disabled" if not enabled else "down" if not connected else "live" if count_60s else "degraded" if last_ack_at else "connecting"
    return {"state":state,"last_success_at":last_success_at if enabled else None,"last_error":last_error if enabled else None,"last_ack_at":last_ack_at if enabled else None,"records_in_last_minute":count_60s if enabled else 0,
            "mode":"LIVE_BGP" if enabled else "DISABLED","enabled":enabled,
            "connected":connected if enabled else False,"last_message_at":last_message_at if enabled else None,
            "event_count":len(events) if enabled else 0,"source":"RIPE_RIS_LIVE",
            "limitations":"BGP routing updates only; not provincial latency, DNS censorship, packet loss or health score."}

@router.get("/events")
def recent_events(limit:int=50):
    limit = min(max(limit,1),100)
    enabled = os.getenv("RADAR_ENABLE_RIS_LIVE", "0") == "1"
    return {"mode":"LIVE_BGP" if enabled else "DISABLED","connected":connected if enabled else False,
            "source":"RIPE_RIS_LIVE","data":list(reversed(events))[:limit] if enabled else []}
