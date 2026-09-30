import asyncio
import json
import random
from datetime import datetime, timezone
from typing import AsyncGenerator
from fastapi import APIRouter, Form
from fastapi.responses import StreamingResponse
from app.models.schemas import GraphNode, GraphEdge, EntityType, RelationType, EvidenceReference
from app.storage.graph_engine import graph_engine
from app.core.config import settings

router = APIRouter()

# Event bus for live RTA intercepts
EVENT_QUEUE: asyncio.Queue = asyncio.Queue()

SIMULATED_INTERCEPT_SCRIPTS = [
    {
        "caller": "9822011122",
        "caller_name": "Krish",
        "receiver": "9822033344",
        "receiver_name": "Afnan",
        "tower_id": "TOWER_AUR_DEOGIRI_01",
        "duration": 45,
        "notes": "RTA Alert: Burst encrypted call originating from Deogiri campus cell.",
        "risk_level": "HIGH"
    },
    {
        "caller": "9822033344",
        "caller_name": "Afnan",
        "receiver": "9822022233",
        "receiver_name": "Manish",
        "tower_id": "TOWER_AUR_CIDCO_02",
        "duration": 60,
        "notes": "RTA Alert: Secondary logistics dispatch confirmed to MGM sector handler.",
        "risk_level": "CRITICAL"
    },
    {
        "caller": "9822022233",
        "caller_name": "Manish",
        "receiver": "9822011122",
        "receiver_name": "Krish",
        "tower_id": "TOWER_AUR_MGM_04",
        "duration": 30,
        "notes": "RTA Alert: Target synchronization call intercepted between campus nodes.",
        "risk_level": "CRITICAL"
    },
    {
        "caller": "9822044455",
        "caller_name": "Field Scout",
        "receiver": "9822022233",
        "receiver_name": "Manish",
        "tower_id": "TOWER_AUR_MGM_04",
        "duration": 25,
        "notes": "RTA Alert: Perimeter reconnaissance update relayed to Manish.",
        "risk_level": "MEDIUM"
    }
]


async def live_event_generator() -> AsyncGenerator[str, None]:
    """
    Continuous Server-Sent Events (SSE) stream for real-time control room monitoring.
    Yields events as they are pushed to the queue or periodic live telemetry pings.
    """
    event_counter = 0
    while True:
        try:
            # Wait up to 3 seconds for a real queued event
            event = await asyncio.wait_for(EVENT_QUEUE.get(), timeout=3.5)
            yield f"data: {json.dumps(event)}\n\n"
        except asyncio.TimeoutError:
            # Heartbeat telemetry
            event_counter += 1
            heartbeat = {
                "type": "HEARTBEAT",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "active_nodes": len(graph_engine.node_store),
                "active_edges": len(graph_engine.edge_store),
                "channel": "STATE_POLICE_TELECOM_STREAM"
            }
            yield f"data: {json.dumps(heartbeat)}\n\n"


@router.get("/live-intercepts")
async def stream_live_intercepts():
    """
    Real-Time Analytics (RTA) SSE stream endpoint:
    Connects frontend dashboard to live telecom monitoring feed.
    """
    return StreamingResponse(
        live_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/simulate-event")
async def trigger_simulated_intercept(
    script_index: int = Form(-1),
    officer_id: str = Form(settings.DEFAULT_IO_NAME)
):
    """
    Injects a live intercepted call event into the Knowledge Graph and broadcasts
    it to all connected SSE clients in real time.
    """
    if script_index >= 0 and script_index < len(SIMULATED_INTERCEPT_SCRIPTS):
        script = SIMULATED_INTERCEPT_SCRIPTS[script_index]
    else:
        script = random.choice(SIMULATED_INTERCEPT_SCRIPTS)

    now_iso = datetime.now(timezone.utc).isoformat()
    caller_phone = script["caller"]
    receiver_phone = script["receiver"]
    caller_id = f"PHONE_{caller_phone}"
    receiver_id = f"PHONE_{receiver_phone}"

    evidence = EvidenceReference(
        doc_id="LIVE_RTA_STREAM",
        doc_sha256="live-stream-telecom-intercept-sha256-verified",
        source_type="RTA_STREAM",
        snippet=f"Live RTA Intercept: {script['caller_name']} -> {script['receiver_name']} ({script['duration']}s). {script['notes']}",
        confidence=0.99
    )

    # Ensure nodes exist
    if caller_id not in graph_engine.node_store:
        graph_engine.add_node(
            GraphNode(
                id=caller_id,
                type=EntityType.PHONE,
                label=f"{script['caller_name']} ({caller_phone[-4:]})",
                properties={"msisdn": caller_phone},
                evidence_refs=[evidence]
            )
        )

    if receiver_id not in graph_engine.node_store:
        graph_engine.add_node(
            GraphNode(
                id=receiver_id,
                type=EntityType.PHONE,
                label=f"{script['receiver_name']} ({receiver_phone[-4:]})",
                properties={"msisdn": receiver_phone},
                evidence_refs=[evidence]
            )
        )

    edge_id = f"LIVE_CALL_{caller_phone}_{receiver_phone}_{int(datetime.now().timestamp() * 1000)}"
    new_edge = GraphEdge(
        id=edge_id,
        source=caller_id,
        target=receiver_id,
        relation=RelationType.CALLED,
        properties={
            "duration_sec": script["duration"],
            "tower_id": script["tower_id"],
            "notes": script["notes"],
            "live_intercept": True
        },
        timestamp=now_iso,
        evidence_refs=[evidence]
    )
    graph_engine.add_edge(new_edge)

    event_payload = {
        "type": "NEW_INTERCEPTED_CALL",
        "event_id": f"EVT-{random.randint(1000, 9999)}",
        "timestamp": now_iso,
        "caller": f"{script['caller_name']} ({caller_phone})",
        "receiver": f"{script['receiver_name']} ({receiver_phone})",
        "tower_id": script["tower_id"],
        "duration_sec": script["duration"],
        "risk_level": script["risk_level"],
        "notes": script["notes"],
        "edge_id": edge_id
    }

    # Enqueue for SSE delivery
    await EVENT_QUEUE.put(event_payload)

    return {
        "success": True,
        "event": event_payload,
        "message": f"Broadcasted live intercept event to RTA channel."
    }
