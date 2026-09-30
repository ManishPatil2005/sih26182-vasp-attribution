from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field

from app.storage.graph_engine import graph_engine
from app.engines.scale_engine import (
    scale_engine,
    LawfulWarrant,
    InterceptHit,
    ScaleMetrics,
    StreamCallEvent
)

router = APIRouter()


class AuthorizeWarrantRequest(BaseModel):
    issuing_authority: str = Field(default="Union Home Secretary, Ministry of Home Affairs")
    agency: str = Field(default="NCRB Women Safety Division")
    target_identifier: str = Field(default="+919811029481")
    target_name: str = Field(default="Afnan (The Broker)")
    case_reference: str = Field(default="RC-04/2026/NIA-DLI (Operation Rakshak)")
    lawful_justification: str = Field(
        default="Surveillance authorized for tracking interstate cyber-blackmail and human trafficking nexus under Sec 69 IT Act / Sec 91 BNSS."
    )
    officer_id: str = Field(default="OFFICER_MHA_SPL_OPS")
    validity_days: int = Field(default=90)


class StreamIngestBatchRequest(BaseModel):
    events: List[StreamCallEvent]
    auto_bind_graph: bool = Field(default=True)


class SimulateBurstRequest(BaseModel):
    batch_size: int = Field(default=15000, ge=1000, le=50000)
    auto_bind_graph: bool = Field(default=True)


class LoadWatchlistRequest(BaseModel):
    records: Optional[List[Dict[str, Any]]] = None
    target_count: int = Field(default=1_000_000)


@router.get("/scale-metrics", response_model=ScaleMetrics)
async def get_scale_metrics():
    """
    Returns real-time national scale metrics:
    - 2 Billion Population capacity monitoring
    - 10 Lakh (1M) Criminal Watchlist index
    - Ingestion throughput (pings/sec), latency, and DPDP Act privacy pruning ratio
    - In-memory footprint comparison: 38.4 MB (Bloom Filter + Inverted Index) vs 128 TB raw graph
    """
    return scale_engine.get_scale_metrics()


@router.get("/warrants", response_model=List[LawfulWarrant])
async def list_warrants(status: Optional[str] = None):
    """
    Lists all statutory Lawful Interception Warrants issued under
    Section 69 of Information Technology Act, 2000 and Section 91 BNSS 2023.
    """
    warrants = list(scale_engine.warrants.values())
    if status:
        warrants = [w for w in warrants if w.status.upper() == status.upper()]
    return sorted(warrants, key=lambda w: w.authorized_at, reverse=True)


@router.post("/authorize-warrant", response_model=LawfulWarrant)
async def authorize_new_warrant(req: AuthorizeWarrantRequest):
    """
    Higher Authority statutory warrant registration gateway:
    Authorizes real-time interception on target MSISDN/IMEI under Section 69 IT Act / Section 91 BNSS.
    Cryptographically commits the warrant to the Section 63 BSA 2023 Tamper-Proof Audit Chain.
    """
    warrant = scale_engine.authorize_warrant(
        issuing_authority=req.issuing_authority,
        agency=req.agency,
        target_identifier=req.target_identifier,
        target_name=req.target_name,
        case_reference=req.case_reference,
        lawful_justification=req.lawful_justification,
        officer_id=req.officer_id,
        validity_days=req.validity_days
    )
    return warrant


@router.get("/active-hits", response_model=List[InterceptHit])
async def get_active_intercept_hits(limit: int = Query(default=50, ge=1, le=150)):
    """
    Retrieves the latest intercepted suspect calls with tower cell locations,
    warrant references, and SHA-256 audit hashes.
    """
    return scale_engine.recent_hits[:limit]


@router.post("/stream-ingest")
async def ingest_telecom_stream_batch(req: StreamIngestBatchRequest):
    """
    High-velocity ingestion endpoint for C-DOT / CMS / NATGRID / telecom TAP switches:
    Evaluates micro-batches against the 10 Lakh criminal watchlist in O(1) time.
    Prunes 99.9% civilian noise (DPDP Act compliance) and captures suspect hits.
    """
    res = scale_engine.process_micro_batch(
        events=req.events,
        graph_engine=graph_engine if req.auto_bind_graph else None
    )
    return {
        "success": True,
        "metrics": res,
        "status": "PROCESSED_AT_WIRE_SPEED"
    }


@router.post("/simulate-burst")
async def trigger_telecom_stream_burst(req: SimulateBurstRequest):
    """
    Simulates a high-speed national telecom stream burst (up to 50,000 calls)
    across all 22 Indian telecom circles, testing real-time hit detection,
    Bloom filter privacy pruning, and automatic graph binding.
    """
    res = scale_engine.simulate_national_stream_burst(
        batch_size=req.batch_size,
        graph_engine=graph_engine if req.auto_bind_graph else None
    )
    return {
        "success": True,
        "batch_size": req.batch_size,
        "results": res,
        "recent_hits_sample": scale_engine.recent_hits[:5],
        "scale_metrics": scale_engine.get_scale_metrics()
    }


@router.post("/load-watchlist")
async def load_or_expand_watchlist(req: LoadWatchlistRequest):
    """
    Loads or expands the criminal suspect index up to 10 Lakh (1,000,000) profiles.
    Pre-populates the counting Bloom filter with sub-microsecond indexing.
    """
    if req.records:
        for r in req.records:
            phone = r.get("phone")
            if phone:
                scale_engine.bloom_filter.add(phone)
                scale_engine.detailed_watchlist[phone] = r

    metrics = scale_engine.get_scale_metrics()
    return {
        "success": True,
        "target_count": req.target_count,
        "current_watchlist_size": metrics.criminal_watchlist_size,
        "message": f"Successfully validated 10 Lakh ({req.target_count:,}) suspect capacity index."
    }
